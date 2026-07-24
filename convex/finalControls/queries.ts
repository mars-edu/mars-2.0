import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all final controls
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("finalControls").collect();
  },
});

/**
 * Get final control by ID
 */
export const getById = query({
  args: { id: v.id("finalControls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
