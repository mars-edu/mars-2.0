import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a discipline
 */
export const create = mutation({
  args: {
    moduleIndex: v.string(),
    moduleName: v.string(),
    learningOutcome: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("disciplines", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a discipline
 */
export const update = mutation({
  args: {
    id: v.id("disciplines"),
    moduleIndex: v.optional(v.string()),
    moduleName: v.optional(v.string()),
    learningOutcome: v.optional(v.string()),
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
 * Delete a discipline
 */
export const remove = mutation({
  args: { id: v.id("disciplines") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
