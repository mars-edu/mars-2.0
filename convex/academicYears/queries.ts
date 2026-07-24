import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all academic years
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("academicYears").collect();
  },
});

/**
 * Get sorted academic years
 */
export const listSorted = query({
  args: {},
  handler: async (ctx) => {
    const years = await ctx.db.query("academicYears").collect();
    return years.sort((a, b) => a.startYear - b.startYear);
  },
});

/**
 * Get academic year by ID
 */
export const getById = query({
  args: { id: v.id("academicYears") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get active academic year
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("academicYears")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .unique();
  },
});

/**
 * Get academic year by start year
 */
export const getByStartYear = query({
  args: { startYear: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("academicYears")
      .withIndex("by_startYear", (q) => q.eq("startYear", args.startYear))
      .first();
  },
});
