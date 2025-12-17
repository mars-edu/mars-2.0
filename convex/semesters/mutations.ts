import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a semester
 */
export const create = mutation({
  args: {
    name: v.string(),
    shortName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    number: v.optional(v.number()),
    academicYearId: v.id("academicYears"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("semesters", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a semester
 */
export const update = mutation({
  args: {
    id: v.id("semesters"),
    name: v.optional(v.string()),
    shortName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    number: v.optional(v.number()),
    academicYearId: v.optional(v.id("academicYears")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
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
 * Delete a semester
 */
export const remove = mutation({
  args: { id: v.id("semesters") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
