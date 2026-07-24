import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all cabinets
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cabinets").collect();
  },
});

/**
 * Get cabinet by ID
 */
export const getById = query({
  args: { id: v.id("cabinets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
