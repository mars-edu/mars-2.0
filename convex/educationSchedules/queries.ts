import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all education schedules
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const schedules = await ctx.db.query("educationSchedules").collect();
    return schedules.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get education schedule by ID
 */
export const getById = query({
  args: { id: v.id("educationSchedules") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get education schedules sorted by order
 */
export const listSorted = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("educationSchedules")
      .withIndex("by_order")
      .collect();
  },
});
