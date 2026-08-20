import { paginationOptsValidator } from "convex/server";
import { query } from "../functions";
import { v } from "convex/values";
import { formatFullName } from "../lib/formatters";

/**
 * Get all students
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    return students.map((s) => ({
      ...s,
      fullName: formatFullName(s),
    }));
  },
});

/**
 * Get students with pagination and optional filters
 */
export const listPaginated = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    specialty: v.optional(v.string()),
    language: v.optional(v.string()),
    gender: v.optional(v.string()),
    base: v.optional(v.number()),
    academicYearId: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    course: v.optional(v.number()),
    activeStartYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.searchTerm) {
      // Use Convex text search when a search term is provided
      results = await ctx.db
        .query("students")
        .withSearchIndex("search_by_name", (q) => {
          let sq = q.search("searchName", args.searchTerm!);
          if (args.gender) sq = sq.eq("gender", args.gender as "male" | "female");
          if (args.specialty) {
            sq = sq.eq("specialty", args.specialty);
          }
          if (args.language) sq = sq.eq("language", args.language);
          return sq;
        })
        .collect();

      // base and academicYearId aren't filterFields, apply post-search
      if (args.base) {
        results = results.filter((s) => s.base === args.base);
      }
      if (args.academicYearId) {
        results = results.filter(
          (s) => s.academicYearId === args.academicYearId
        );
      }
    } else {
      // No search term — use regular index-based query
      let query;
      if (args.specialty && args.academicYearId) {
        query = ctx.db
          .query("students")
          .withIndex("by_specialty_academicYear", (q) =>
            q
              .eq("specialty", args.specialty!)
              .eq("academicYearId", args.academicYearId!)
          );
      } else if (args.specialty) {
        query = ctx.db
          .query("students")
          .withIndex("by_specialty", (q) => q.eq("specialty", args.specialty!));
      } else if (args.academicYearId) {
        query = ctx.db
          .query("students")
          .withIndex("by_academicYear", (q) =>
            q.eq("academicYearId", args.academicYearId!)
          );
      } else {
        query = ctx.db.query("students").order("asc");
      }

      if (args.language) {
        query = query.filter((q) => q.eq(q.field("language"), args.language));
      }
      if (args.gender) {
        query = query.filter((q) => q.eq(q.field("gender"), args.gender));
      }
      if (args.base) {
        query = query.filter((q) => q.eq(q.field("base"), args.base));
      }
      results = await query.collect();
    }

    // Filter by calculated course if requested
    if (args.course !== undefined && args.activeStartYear !== undefined) {
      const allYears = await ctx.db.query("academicYears").collect();
      const yearMap = new Map(allYears.map((y) => [y._id as string, y.startYear]));

      results = results.filter((student) => {
        if (!student.academicYearId) return false;
        const studentStartYear = yearMap.get(student.academicYearId);
        if (!studentStartYear) return false;
        const diff = args.activeStartYear! - studentStartYear + 1;
        const calculatedCourse = Math.max(0, diff);
        return calculatedCourse === args.course;
      });
    }

    const totalCount = results.length;
    const start = (args.page - 1) * args.pageSize;
    const items = results.slice(start, start + args.pageSize).map((s) => ({
      ...s,
      fullName: formatFullName(s),
    }));

    return {
      items,
      totalCount,
    };
  },
});

/**
 * Search students by name using Convex full-text search
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) return [];
    const students = await ctx.db
      .query("students")
      .withSearchIndex("search_by_name", (q) =>
        q.search("searchName", args.searchTerm)
      )
      .collect();
    return students.map((s) => ({
      ...s,
      fullName: formatFullName(s),
    }));
  },
});

/**
 * Get student by ID
 */
export const getById = query({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    if (!student) return null;
    return {
      ...student,
      fullName: formatFullName(student),
    };
  },
});

/**
 * Get students by academic year ID
 */
export const getByAcademicYearId = query({
  args: { academicYearId: v.id("academicYears") },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_academicYear", (q) =>
        q.eq("academicYearId", args.academicYearId)
      )
      .collect();
    return students.map((s) => ({
      ...s,
      fullName: formatFullName(s),
    }));
  },
});

/**
 * Get students by specialty
 */
export const getBySpecialty = query({
  args: { specialty: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db
      .query("students")
      .withIndex("by_specialty", (q) => q.eq("specialty", args.specialty))
      .collect();
    return students.map((s) => ({
      ...s,
      fullName: formatFullName(s),
    }));
  },
});
