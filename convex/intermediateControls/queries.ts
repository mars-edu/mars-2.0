import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all intermediate controls
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("intermediateControls").collect();
  },
});

/**
 * Get intermediate control by ID
 */
export const getById = query({
  args: { id: v.id("intermediateControls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
