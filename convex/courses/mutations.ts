import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a course
 */
export const create = mutation({
  args: {
    number: v.string(),
    name: v.optional(v.string()),
    semesters: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("courses", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a course
 */
export const update = mutation({
  args: {
    id: v.id("courses"),
    number: v.optional(v.string()),
    name: v.optional(v.string()),
    semesters: v.optional(v.array(v.string())),
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
 * Delete a course
 */
export const remove = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
