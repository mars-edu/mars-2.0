import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a position
 */
export const create = mutation({
  args: {
    name: v.string(),
    shortName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("positions", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a position
 */
export const update = mutation({
  args: {
    id: v.id("positions"),
    name: v.optional(v.string()),
    shortName: v.optional(v.string()),
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
 * Delete a position
 */
export const remove = mutation({
  args: { id: v.id("positions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
