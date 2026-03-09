import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a class9 item
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

    return await ctx.db.insert("class9Items", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a class9 item
 */
export const update = mutation({
  args: {
    id: v.id("class9Items"),
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
      ...updateTimestamp(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a class9 item (also deletes its distribution entries)
 */
export const remove = mutation({
  args: { id: v.id("class9Items") },
  handler: async (ctx, args) => {
    // Delete all distribution entries for this class9 item
    const distributions = await ctx.db
      .query("distributionEntries")
      .withIndex("by_class9Item", (q) => q.eq("class9ItemId", args.id))
      .collect();

    for (const dist of distributions) {
      await ctx.db.delete(dist._id);
    }

    // Delete the class9 item
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Add a distribution entry to a class9 item
 */
export const addDistribution = mutation({
  args: {
    class9ItemId: v.id("class9Items"),
    academicYearId: v.string(),
    semesterId: v.string(),
    hours: v.string(),
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
      ...updateTimestamp(),
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
 * Update a class9 item with its distribution entries (full sync)
 */
export const updateWithDistributions = mutation({
  args: {
    id: v.id("class9Items"),
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

    // Update the main class9 item
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      ...updateTimestamp(),
    });

    // Get existing distribution entries
    const existingDistributions = await ctx.db
      .query("distributionEntries")
      .withIndex("by_class9Item", (q) => q.eq("class9ItemId", id))
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
          class9ItemId: id,
          academicYearId: entry.academicYearId,
          semesterId: entry.semesterId as any,
          hours: entry.hours,
          intermediateControlId: entry.intermediateControlId ?? undefined,
          finalControlId: entry.finalControlId ?? undefined,
          examEnabled: entry.examEnabled,
          creditEnabled: entry.creditEnabled,
          controlLessonEnabled: entry.controlLessonEnabled,
          ...timestamps,
        });
      } else {
        // Existing entry - update it
        await ctx.db.patch(entry.id as any, {
          academicYearId: entry.academicYearId,
          semesterId: entry.semesterId as any,
          hours: entry.hours,
          intermediateControlId: entry.intermediateControlId ?? undefined,
          finalControlId: entry.finalControlId ?? undefined,
          examEnabled: entry.examEnabled,
          creditEnabled: entry.creditEnabled,
          controlLessonEnabled: entry.controlLessonEnabled,
          ...updateTimestamp(),
        });
      }
    }

    return await ctx.db.get(id);
  },
});

/**
 * Create multiple language variants of a class9 item in one transaction
 */
export const createMultiLanguage = mutation({
  args: {
    specialtyIds: v.array(v.string()),
    academicYearId: v.string(),
    baseClass: v.optional(v.array(v.number())),
    groupId: v.string(),
    totalCredits: v.string(),
    totalHours: v.string(),
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
      const id = await ctx.db.insert("class9Items", {
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
            class9ItemId: id,
            academicYearId: dist.academicYearId,
            semesterId: dist.semesterId as any,
            hours: dist.hours,
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
