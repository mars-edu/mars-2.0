import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all vacations
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vacations").collect();
  },
});

/**
 * Get vacation by ID
 */
export const getById = query({
  args: { id: v.id("vacations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get vacations by academic year
 */
export const getByAcademicYear = query({
  args: { academicYearId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vacations")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", args.academicYearId))
      .collect();
  },
});
