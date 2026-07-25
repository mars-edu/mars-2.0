import { mutation } from "../functions";
import { v, ConvexError } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../functions";

/**
 * Scan for live references to a RUP entry across calendarEvents (lessons),
 * ktps (thematic plan), journals (grade books), and
 * scheduledIntermediate/FinalControls. Shared by `remove`, `removeGroup`,
 * and `saveRupEntryGroup` so the reference-check policy (block delete if
 * referenced) stays in one place.
 */
async function scanRefs(
  ctx: MutationCtx,
  id: Id<"rupEntries">
): Promise<Record<string, number>> {
  const idStr = id as unknown as string;
  const [events, ktps, ic, fc, journals] = await Promise.all([
    ctx.db
      .query("calendarEvents")
      .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", idStr))
      .collect(),
    ctx.db
      .query("ktps")
      .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", idStr))
      .collect(),
    ctx.db
      .query("scheduledIntermediateControls")
      .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", idStr))
      .collect(),
    ctx.db
      .query("scheduledFinalControls")
      .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", idStr))
      .collect(),
    ctx.db
      .query("journals")
      .filter((q) => q.eq(q.field("disciplineId"), idStr))
      .collect(),
  ]);

  const refs: Record<string, number> = {};
  if (events.length) refs.calendarEvents = events.length;
  if (ktps.length) refs.ktps = ktps.length;
  if (ic.length) refs.scheduledIntermediateControls = ic.length;
  if (fc.length) refs.scheduledFinalControls = fc.length;
  if (journals.length) refs.journals = journals.length;
  return refs;
}

function mergeRefs(
  total: Record<string, number>,
  refs: Record<string, number>
) {
  for (const [k, n] of Object.entries(refs)) {
    total[k] = (total[k] ?? 0) + n;
  }
}

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
    // Count live references. String-typed foreign keys use their own indexes;
    // journals.disciplineId has no index (falls back to a scan + filter).
    const refs = await scanRefs(ctx, args.id);

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
      mergeRefs(totalRefs, await scanRefs(ctx, v._id));
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
 * Create multiple language variants of a RUP entry in one transaction.
 *
 * @deprecated Create-only, no update/upsert branch — was built but never
 * wired up by the client (`RupEntryPopup.vue` looped N single-entry
 * `create`/`update` calls instead). Use `saveRupEntryGroup` instead, which
 * upserts the whole language-variant group (create + edit) atomically with
 * server-side cross-field validation. Not deleted because ad-hoc callers may
 * still exist; do not add new callers.
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

// Strict hours validator mirrored from the client (`RupEntryPopup.vue`
// `isHours`): integer or one-decimal-group string, no leading +/-, no
// exponent notation, no hex, no whitespace. Empty string is allowed —
// callers decide per-field whether empty is acceptable.
const HOURS_RE = /^\d+(\.\d+)?$/;
function isValidHours(val: string | undefined): boolean {
  return val === undefined || val === "" || HOURS_RE.test(val);
}

/**
 * Save (create or edit) an entire RUP entry language-variant group in ONE
 * atomic mutation. Replaces the client-side N×M loop in
 * `RupEntryPopup.vue::submit()` (N variant upserts + M distribution
 * round-trips), which could partially fail leaving a broken group, and only
 * validated fields on the client. Handles both:
 *   - create: `groupId` omitted → server generates one, all variants inserted.
 *   - edit (upsert): variants carrying `id` are patched, variants without
 *     `id` are inserted (new language added during edit), and
 *     `removedVariantIds` are deleted (language removed during edit).
 */
export const saveRupEntryGroup = mutation({
  args: {
    groupId: v.optional(v.string()),
    specialtyIds: v.array(v.string()),
    academicYearId: v.string(),
    baseClass: v.optional(v.array(v.number())),
    position: v.optional(v.number()),
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
    variants: v.array(
      v.object({
        id: v.optional(v.id("rupEntries")),
        language: v.string(),
        moduleIndex: v.string(),
        moduleName: v.string(),
        learningOutcome: v.string(),
      })
    ),
    removedVariantIds: v.optional(v.array(v.id("rupEntries"))),
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
    const {
      groupId,
      specialtyIds,
      academicYearId,
      baseClass,
      position,
      totalCredits,
      totalHours,
      groupHours,
      theoreticalHours,
      labPracticalHours,
      field3Value,
      srspHours,
      srsHours,
      trainingPracticeHours,
      individualHours,
      individualAdditionalHours,
      variants,
      removedVariantIds,
      distributionEntries,
    } = args;

    // --- 1. Cross-field validation (server-enforced, root #2 of the audit:
    // the client-only zod schema let anything through since v.string() has
    // no format constraint). Throws ConvexError so the client can surface a
    // clear message.
    const hourFields: Record<string, string | undefined> = {
      totalCredits,
      totalHours,
      theoreticalHours,
      labPracticalHours,
      srspHours,
      srsHours,
      trainingPracticeHours,
      individualHours,
      individualAdditionalHours,
      groupHours,
    };
    for (const [field, val] of Object.entries(hourFields)) {
      if (!isValidHours(val)) {
        throw new ConvexError({
          code: "INVALID_HOURS",
          message: `Поле "${field}" должно быть положительным числом`,
          field,
        });
      }
    }

    if (variants.length === 0) {
      throw new ConvexError({
        code: "NO_VARIANTS",
        message: "Нужен хотя бы один языковой вариант",
      });
    }

    if (specialtyIds.length === 0) {
      throw new ConvexError({
        code: "NO_SPECIALTIES",
        message: "Выберите хотя бы одну специальность",
      });
    }

    // --- 2. Resolve group id (new group gets a fresh one).
    const gid = groupId ?? crypto.randomUUID();

    const shared = {
      specialtyIds,
      academicYearId,
      baseClass: baseClass ?? [9],
      groupId: gid,
      totalCredits,
      totalHours,
      groupHours,
      theoreticalHours,
      labPracticalHours,
      field3Value,
      srspHours,
      srsHours,
      trainingPracticeHours,
      individualHours,
      individualAdditionalHours: individualAdditionalHours ?? "",
      position: position ?? 0,
    };

    // --- 3. Delete removed variants FIRST, mirroring `remove`'s reference-check
    // policy: block (throw RUP_ENTRY_HAS_REFERENCES) if any removed variant is
    // still referenced by live user data, aggregated across all of them, so we
    // don't partially delete before hitting a blocker.
    const toRemove = removedVariantIds ?? [];
    if (toRemove.length > 0) {
      const totalRefs: Record<string, number> = {};
      for (const id of toRemove) {
        mergeRefs(totalRefs, await scanRefs(ctx, id));
      }
      if (Object.keys(totalRefs).length > 0) {
        throw new ConvexError({
          code: "RUP_ENTRY_HAS_REFERENCES",
          message: "Запись РУП используется — сначала удалите ссылки",
          references: totalRefs,
        });
      }

      for (const id of toRemove) {
        const dists = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", id))
          .collect();
        for (const d of dists) await ctx.db.delete(d._id);
        await ctx.db.delete(id);
      }
    }

    // --- 4. Upsert variants: patch existing (id present), insert new (id absent).
    const allIds: Id<"rupEntries">[] = [];
    for (const variant of variants) {
      const { id, language, moduleIndex, moduleName, learningOutcome } = variant;
      if (id) {
        await ctx.db.patch(id, {
          ...shared,
          language,
          moduleIndex,
          moduleName,
          learningOutcome,
        });
        allIds.push(id);
      } else {
        const newId = await ctx.db.insert("rupEntries", {
          ...shared,
          language,
          moduleIndex,
          moduleName,
          learningOutcome,
        });
        allIds.push(newId);
      }
    }

    // --- 5. Distributions: per-rupEntry ownership (`by_rupEntry`). If the
    // caller sent a distributionEntries payload, replace each variant's set
    // wholesale with a fresh copy (mirrors `updateWithDistributions`'s
    // insert/patch/delete-diff pattern, simplified to delete-then-insert since
    // the payload here is shared identically across every variant).
    if (distributionEntries) {
      for (const variantId of allIds) {
        const existing = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", variantId))
          .collect();
        for (const d of existing) await ctx.db.delete(d._id);

        for (const dist of distributionEntries) {
          await ctx.db.insert("distributionEntries", {
            rupEntryId: variantId,
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
          });
        }
      }
    }

    return { success: true, groupId: gid, ids: allIds };
  },
});
