import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all disciplines
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("disciplines").collect();
  },
});

/**
 * Get discipline by ID
 */
export const getById = query({
  args: { id: v.id("disciplines") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
