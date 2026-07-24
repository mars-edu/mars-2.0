import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all workloads
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workloads").collect();
  },
});

/**
 * Get workloads by academic year
 */
export const getByAcademicYear = query({
  args: { academicYearId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workloads")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", args.academicYearId))
      .collect();
  },
});

/**
 * Get workloads by teacher
 */
export const getByTeacher = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workloads")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();
  },
});

/**
 * Get workload by ID
 */
export const getById = query({
  args: { id: v.id("workloads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
