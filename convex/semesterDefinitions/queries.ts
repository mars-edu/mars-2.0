import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all semester definitions (global settings)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("semesterDefinitions").collect();
  },
});

/**
 * Get semester definition by ID
 */
export const getById = query({
  args: { id: v.id("semesterDefinitions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get semester definition by number
 */
export const getByNumber = query({
  args: { number: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("semesterDefinitions")
      .withIndex("by_number", (q) => q.eq("number", args.number))
      .first();
  },
});
