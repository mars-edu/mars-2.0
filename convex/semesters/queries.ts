import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all semesters
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("semesters").collect();
  },
});

/**
 * Get semester by ID
 */
export const getById = query({
  args: { id: v.id("semesters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get semesters by academic year
 */
export const getByAcademicYear = query({
  args: { academicYearId: v.id("academicYears") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("semesters")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", args.academicYearId))
      .collect();
  },
});

/**
 * Get active semesters
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("semesters")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});
