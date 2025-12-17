import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a specialty
 */
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    codeName: v.string(),
    details: v.optional(v.string()),
    hasModule: v.optional(v.boolean()),
    isHighlighted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();
    return await ctx.db.insert("specialties", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a specialty
 */
export const update = mutation({
  args: {
    id: v.id("specialties"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    codeName: v.optional(v.string()),
    details: v.optional(v.string()),
    hasModule: v.optional(v.boolean()),
    isHighlighted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

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
 * Delete a specialty
 */
export const remove = mutation({
  args: { id: v.id("specialties") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
