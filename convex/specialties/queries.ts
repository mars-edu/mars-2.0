import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all specialties
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("specialties").collect();
  },
});

/**
 * Get specialty by ID
 */
export const getById = query({
  args: { id: v.id("specialties") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get specialty by code
 */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("specialties")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});
