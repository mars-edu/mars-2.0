import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all academic year semesters with their semester definitions
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const semesters = await ctx.db.query("academicYearSemesters").collect();

    // Fetch semester definitions for each semester
    const semestersWithDefinitions = await Promise.all(
      semesters.map(async (semester) => {
        const definition = await ctx.db.get(semester.semesterDefinitionId);
        return {
          ...semester,
          semesterDefinition: definition,
        };
      })
    );

    return semestersWithDefinitions;
  },
});

/**
 * Get academic year semester by ID
 */
export const getById = query({
  args: { id: v.id("academicYearSemesters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get academic year semesters by academic year
 */
export const getByAcademicYear = query({
  args: { academicYearId: v.id("academicYears") },
  handler: async (ctx, args) => {
    const semesters = await ctx.db
      .query("academicYearSemesters")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", args.academicYearId))
      .collect();

    // Fetch semester definitions for each semester
    const semestersWithDefinitions = await Promise.all(
      semesters.map(async (semester) => {
        const definition = await ctx.db.get(semester.semesterDefinitionId);
        return {
          ...semester,
          semesterDefinition: definition,
        };
      })
    );

    return semestersWithDefinitions;
  },
});

/**
 * Get active academic year semesters (current date within semester period)
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const allSemesters = await ctx.db.query("academicYearSemesters").collect();

    return allSemesters.filter((semester) => {
      return semester.startDate <= now && semester.endDate >= now;
    });
  },
});
