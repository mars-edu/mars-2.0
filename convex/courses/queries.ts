import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all courses
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

/**
 * Get course by ID
 */
export const getById = query({
  args: { id: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
