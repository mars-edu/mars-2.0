import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all positions
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("positions").collect();
  },
});

/**
 * Get position by ID
 */
export const getById = query({
  args: { id: v.id("positions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
