import { query } from "../functions";
import { v } from "convex/values";

/**
 * List all education technologies
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("educationTechnologies").collect();
  },
});

/**
 * Get education technology by ID
 */
export const getById = query({
  args: { id: v.id("educationTechnologies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get the default education technology (legacy fallback)
 */
export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("educationTechnologies")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();
  },
});
