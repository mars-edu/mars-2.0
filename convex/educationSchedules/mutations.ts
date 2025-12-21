import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create an education schedule
 */
export const create = mutation({
  args: {
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    order: v.number(),
    academicYearId: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("educationSchedules", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update an education schedule
 */
export const update = mutation({
  args: {
    id: v.id("educationSchedules"),
    name: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    order: v.optional(v.number()),
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
 * Delete an education schedule
 */
export const remove = mutation({
  args: { id: v.id("educationSchedules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
