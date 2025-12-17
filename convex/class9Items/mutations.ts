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
