import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all sessions
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sessions").collect();
  },
});

/**
 * Get session by ID
 */
export const getById = query({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get sessions by academic year
 */
export const getByAcademicYear = query({
  args: { academicYearId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", args.academicYearId))
      .collect();
  },
});

/**
 * Get sessions by semester
 */
export const getBySemester = query({
  args: { semesterId: v.id("academicYearSemesters") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_semester", (q) => q.eq("semesterId", args.semesterId))
      .collect();
  },
});
