import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all bases
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bases").collect();
  },
});

/**
 * Get base by ID
 */
export const getById = query({
  args: { id: v.id("bases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
