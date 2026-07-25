import { mutation } from "../functions";
import { v, ConvexError } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";
import type { Id } from "../_generated/dataModel";

/**
 * Create a RUP entry
 */
export const create = mutation({
  args: {
    specialtyIds: v.array(v.string()),
    academicYearId: v.string(),
    baseClass: v.optional(v.array(v.number())),
    language: v.optional(v.string()),
    groupId: v.optional(v.string()),
    moduleIndex: v.string(),
    moduleName: v.string(),
    learningOutcome: v.string(),
    totalCredits: v.string(),
    totalHours: v.string(),
    groupHours: v.optional(v.string()),
    theoreticalHours: v.string(),
    labPracticalHours: v.string(),
    field3Value: v.string(),
    srspHours: v.string(),
    srsHours: v.string(),
    trainingPracticeHours: v.string(),
    individualHours: v.string(),
    individualAdditionalHours: v.optional(v.string()),
    position: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("rupEntries", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a RUP entry
 */
export const update = mutation({
  args: {
    id: v.id("rupEntries"),
    specialtyIds: v.optional(v.array(v.string())),
    academicYearId: v.optional(v.string()),
    baseClass: v.optional(v.array(v.number())),
    language: v.optional(v.string()),
    groupId: v.optional(v.string()),
    moduleIndex: v.optional(v.string()),
    moduleName: v.optional(v.string()),
    learningOutcome: v.optional(v.string()),
    totalCredits: v.optional(v.string()),
    totalHours: v.optional(v.string()),
    groupHours: v.optional(v.string()),
    theoreticalHours: v.optional(v.string()),
    labPracticalHours: v.optional(v.string()),
    field3Value: v.optional(v.string()),
    srspHours: v.optional(v.string()),
    srsHours: v.optional(v.string()),
    trainingPracticeHours: v.optional(v.string()),
    individualHours: v.optional(v.string()),
    individualAdditionalHours: v.optional(v.string()),
    position: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a RUP entry.
 *
 * Cascades `distributionEntries` (RUP-owned configuration, safe to remove).
 * BLOCKS the delete if the entry is still referenced by live user data —
 * calendarEvents (lessons), ktps (thematic plan), journals (grade books),
 * scheduledIntermediate/FinalControls — throwing a `ConvexError` with a
 * per-table count so the caller can surface a clear message and let the
 * user detach or delete those first. Silently cascading them would drop
 * teachers' journals/marks/events with no warning.
 */
export const remove = mutation({
  args: { id: v.id("rupEntries") },
  handler: async (ctx, args) => {
    const rupIdStr = args.id as unknown as string;

    // Count live references. String-typed foreign keys use their own indexes;
    // journals.disciplineId has no index (falls back to a scan + filter).
    const [events, ktps, ic, fc, journals] = await Promise.all([
      ctx.db
        .query("calendarEvents")
        .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", rupIdStr))
        .collect(),
      ctx.db
        .query("ktps")
        .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", rupIdStr))
        .collect(),
      ctx.db
        .query("scheduledIntermediateControls")
        .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", rupIdStr))
        .collect(),
      ctx.db
        .query("scheduledFinalControls")
        .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", rupIdStr))
        .collect(),
      ctx.db
        .query("journals")
        .filter((q) => q.eq(q.field("disciplineId"), rupIdStr))
        .collect(),
    ]);

    const refs: Record<string, number> = {};
    if (events.length) refs.calendarEvents = events.length;
    if (ktps.length) refs.ktps = ktps.length;
    if (ic.length) refs.scheduledIntermediateControls = ic.length;
    if (fc.length) refs.scheduledFinalControls = fc.length;
    if (journals.length) refs.journals = journals.length;

    if (Object.keys(refs).length > 0) {
      throw new ConvexError({
        code: "RUP_ENTRY_HAS_REFERENCES",
        message: "Запись РУП используется — сначала удалите ссылки",
        references: refs,
      });
    }

    // Safe: cascade only the RUP-owned distributionEntries + the entry itself.
    const distributions = await ctx.db
      .query("distributionEntries")
      .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", args.id))
      .collect();
    for (const dist of distributions) {
      await ctx.db.delete(dist._id);
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Delete an entire language-variant group atomically. Pre-checks references
 * for ALL variants first (same rules as `remove`) so we don't partially delete
 * some variants before hitting a blocker on another — either the whole group
 * goes, or nothing goes and a ConvexError lists what's in the way.
 */
export const removeGroup = mutation({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const variants = await ctx.db
      .query("rupEntries")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
    if (variants.length === 0) return { success: true, deleted: 0 };

    // Aggregate references across the WHOLE group before deleting anything.
    const totalRefs: Record<string, number> = {};
    for (const v of variants) {
      const idStr = v._id as unknown as string;
      const [events, ktps, ic, fc, journals] = await Promise.all([
        ctx.db.query("calendarEvents").withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", idStr)).collect(),
        ctx.db.query("ktps").withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", idStr)).collect(),
        ctx.db.query("scheduledIntermediateControls").withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", idStr)).collect(),
        ctx.db.query("scheduledFinalControls").withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", idStr)).collect(),
        ctx.db.query("journals").filter((q) => q.eq(q.field("disciplineId"), idStr)).collect(),
      ]);
      if (events.length) totalRefs.calendarEvents = (totalRefs.calendarEvents ?? 0) + events.length;
      if (ktps.length) totalRefs.ktps = (totalRefs.ktps ?? 0) + ktps.length;
      if (ic.length) totalRefs.scheduledIntermediateControls = (totalRefs.scheduledIntermediateControls ?? 0) + ic.length;
      if (fc.length) totalRefs.scheduledFinalControls = (totalRefs.scheduledFinalControls ?? 0) + fc.length;
      if (journals.length) totalRefs.journals = (totalRefs.journals ?? 0) + journals.length;
    }
    if (Object.keys(totalRefs).length > 0) {
      throw new ConvexError({
        code: "RUP_ENTRY_HAS_REFERENCES",
        message: "Группа записей РУП используется — сначала удалите ссылки",
        references: totalRefs,
      });
    }

    let deleted = 0;
    for (const variant of variants) {
      const dists = await ctx.db
        .query("distributionEntries")
        .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", variant._id))
        .collect();
      for (const d of dists) await ctx.db.delete(d._id);
      await ctx.db.delete(variant._id);
      deleted++;
    }
    return { success: true, deleted };
  },
});

/**
 * Reorder RUP entries (atomic position update based on new id order)
 */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("rupEntries")) },
  handler: async (ctx, { orderedIds }) => {
    await Promise.all(
      orderedIds.map((id, index) => ctx.db.patch(id, { position: index, }))
    );
    return { success: true };
  },
});

/**
 * Add a distribution entry to a RUP entry
 */
export const addDistribution = mutation({
  args: {
    rupEntryId: v.id("rupEntries"),
    academicYearId: v.string(),
    semesterId: v.string(),
    hours: v.string(),
    srsHours: v.optional(v.string()),
    srspHours: v.optional(v.string()),
    individualHours: v.optional(v.string()),
    intermediateControlId: v.optional(v.string()),
    finalControlId: v.optional(v.string()),
    examEnabled: v.optional(v.boolean()),
    creditEnabled: v.optional(v.boolean()),
    controlLessonEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("distributionEntries", {
      ...args,
      semesterId: args.semesterId as any,
      ...timestamps,
    });
  },
});

/**
 * Update a distribution entry
 */
export const updateDistribution = mutation({
  args: {
    id: v.id("distributionEntries"),
    academicYearId: v.optional(v.string()),
    semesterId: v.optional(v.string()),
    hours: v.optional(v.string()),
    srsHours: v.optional(v.string()),
    srspHours: v.optional(v.string()),
    individualHours: v.optional(v.string()),
    intermediateControlId: v.optional(v.string()),
    finalControlId: v.optional(v.string()),
    examEnabled: v.optional(v.boolean()),
    creditEnabled: v.optional(v.boolean()),
    controlLessonEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a distribution entry
 */
export const removeDistribution = mutation({
  args: { id: v.id("distributionEntries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Update a RUP entry with its distribution entries (full sync)
 */
export const updateWithDistributions = mutation({
  args: {
    id: v.id("rupEntries"),
    specialtyIds: v.optional(v.array(v.string())),
    academicYearId: v.optional(v.string()),
    baseClass: v.optional(v.array(v.number())),
    language: v.optional(v.string()),
    groupId: v.optional(v.string()),
    moduleIndex: v.optional(v.string()),
    moduleName: v.optional(v.string()),
    learningOutcome: v.optional(v.string()),
    totalCredits: v.optional(v.string()),
    totalHours: v.optional(v.string()),
    groupHours: v.optional(v.string()),
    theoreticalHours: v.optional(v.string()),
    labPracticalHours: v.optional(v.string()),
    field3Value: v.optional(v.string()),
    srspHours: v.optional(v.string()),
    srsHours: v.optional(v.string()),
    trainingPracticeHours: v.optional(v.string()),
    individualHours: v.optional(v.string()),
    individualAdditionalHours: v.optional(v.string()),
    position: v.optional(v.number()),
    distributionEntries: v.array(
      v.object({
        id: v.string(),
        academicYearId: v.string(),
        semesterId: v.string(),
        hours: v.string(),
        srsHours: v.optional(v.string()),
        srspHours: v.optional(v.string()),
        individualHours: v.optional(v.string()),
        intermediateControlId: v.optional(v.union(v.string(), v.null())),
        finalControlId: v.optional(v.union(v.string(), v.null())),
        examEnabled: v.optional(v.boolean()),
        creditEnabled: v.optional(v.boolean()),
        controlLessonEnabled: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, distributionEntries, ...updates } = args;

    // Update the main RUP entry
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      });

    // Get existing distribution entries
    const existingDistributions = await ctx.db
      .query("distributionEntries")
      .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", id))
      .collect();

    const existingIds = new Set(existingDistributions.map((d) => d._id));
    const currentIds = new Set(distributionEntries.map((d) => d.id));

    // Delete entries that no longer exist
    for (const existing of existingDistributions) {
      if (!currentIds.has(existing._id)) {
        await ctx.db.delete(existing._id);
      }
    }

    // Add or update entries
    const timestamps = createTimestamps();
    for (const entry of distributionEntries) {
      if (!existingIds.has(entry.id as any)) {
        // New entry - add it
        await ctx.db.insert("distributionEntries", {
          rupEntryId: id,
          academicYearId: entry.academicYearId,
          semesterId: entry.semesterId as any,
          hours: entry.hours,
          srsHours: entry.srsHours,
          srspHours: entry.srspHours,
          individualHours: entry.individualHours,
          intermediateControlId: entry.intermediateControlId ?? undefined,
          finalControlId: entry.finalControlId ?? undefined,
          examEnabled: entry.examEnabled,
          creditEnabled: entry.creditEnabled,
          controlLessonEnabled: entry.controlLessonEnabled,
          ...timestamps,
        });
      } else {
        // Existing entry - update it
        await ctx.db.patch(entry.id as Id<"distributionEntries">, {
          academicYearId: entry.academicYearId,
          semesterId: entry.semesterId as any,
          hours: entry.hours,
          srsHours: entry.srsHours,
          srspHours: entry.srspHours,
          individualHours: entry.individualHours,
          intermediateControlId: entry.intermediateControlId ?? undefined,
          finalControlId: entry.finalControlId ?? undefined,
          examEnabled: entry.examEnabled,
          creditEnabled: entry.creditEnabled,
          controlLessonEnabled: entry.controlLessonEnabled,
          });
      }
    }

    return await ctx.db.get(id);
  },
});

/**
 * Create multiple language variants of a RUP entry in one transaction
 */
export const createMultiLanguage = mutation({
  args: {
    specialtyIds: v.array(v.string()),
    academicYearId: v.string(),
    baseClass: v.optional(v.array(v.number())),
    groupId: v.string(),
    totalCredits: v.string(),
    totalHours: v.string(),
    groupHours: v.optional(v.string()),
    theoreticalHours: v.string(),
    labPracticalHours: v.string(),
    field3Value: v.string(),
    srspHours: v.string(),
    srsHours: v.string(),
    trainingPracticeHours: v.string(),
    individualHours: v.string(),
    individualAdditionalHours: v.optional(v.string()),
    position: v.number(),
    variants: v.array(
      v.object({
        language: v.string(),
        moduleIndex: v.string(),
        moduleName: v.string(),
        learningOutcome: v.string(),
      })
    ),
    distributionEntries: v.optional(
      v.array(
        v.object({
          academicYearId: v.string(),
          semesterId: v.string(),
          hours: v.string(),
          srsHours: v.optional(v.string()),
          srspHours: v.optional(v.string()),
          individualHours: v.optional(v.string()),
          intermediateControlId: v.optional(v.string()),
          finalControlId: v.optional(v.string()),
          examEnabled: v.optional(v.boolean()),
          creditEnabled: v.optional(v.boolean()),
          controlLessonEnabled: v.optional(v.boolean()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { variants, distributionEntries, groupId, ...sharedFields } = args;
    const timestamps = createTimestamps();
    const createdIds: string[] = [];

    for (const variant of variants) {
      const id = await ctx.db.insert("rupEntries", {
        ...sharedFields,
        moduleIndex: variant.moduleIndex,
        moduleName: variant.moduleName,
        learningOutcome: variant.learningOutcome,
        language: variant.language,
        groupId,
        ...timestamps,
      });

      if (distributionEntries) {
        for (const dist of distributionEntries) {
          await ctx.db.insert("distributionEntries", {
            rupEntryId: id,
            academicYearId: dist.academicYearId,
            semesterId: dist.semesterId as any,
            hours: dist.hours,
            srsHours: dist.srsHours,
            srspHours: dist.srspHours,
            individualHours: dist.individualHours,
            intermediateControlId: dist.intermediateControlId,
            finalControlId: dist.finalControlId,
            examEnabled: dist.examEnabled,
            creditEnabled: dist.creditEnabled,
            controlLessonEnabled: dist.controlLessonEnabled,
            ...timestamps,
          });
        }
      }

      createdIds.push(id);
    }

    return createdIds;
  },
});
