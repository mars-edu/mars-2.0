import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create an intermediate control
 */
export const create = mutation({
  args: {
    name: v.string(),
    shortName: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("intermediateControls", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update an intermediate control
 */
export const update = mutation({
  args: {
    id: v.id("intermediateControls"),
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
      ...updateTimestamp(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Delete an intermediate control
 */
export const remove = mutation({
  args: { id: v.id("intermediateControls") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
