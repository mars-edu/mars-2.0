import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a cabinet
 */
export const create = mutation({
  args: {
    name: v.string(),
    capacity: v.number(),
    type: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();
    return await ctx.db.insert("cabinets", {
      ...args,
      isActive: args.isActive ?? true,
      ...timestamps,
    });
  },
});

/**
 * Update a cabinet
 */
export const update = mutation({
  args: {
    id: v.id("cabinets"),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

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
 * Delete a cabinet
 */
export const remove = mutation({
  args: { id: v.id("cabinets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
