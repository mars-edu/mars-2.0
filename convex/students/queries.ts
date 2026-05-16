import { paginationOptsValidator } from "convex/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all students
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
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
    specialtyLegacyId: v.optional(v.string()),
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
          // Use the primary specialty value as filterField if no legacy ID ambiguity
          if (args.specialty && !args.specialtyLegacyId) {
            sq = sq.eq("specialty", args.specialty);
          }
          if (args.language) sq = sq.eq("language", args.language);
          return sq;
        })
        .collect();

      // Post-filter for cases that can't be in filterFields
      if (args.specialtyLegacyId && args.specialty && args.specialty !== args.specialtyLegacyId) {
        results = results.filter(
          (s) => s.specialty === args.specialty || s.specialty === args.specialtyLegacyId
        );
      }
      if (args.base !== undefined) {
        results = results.filter((s) => s.base === args.base);
      }
      if (args.academicYearId) {
        results = results.filter((s) => s.academicYearId === args.academicYearId);
      }
    } else {
      // No search term — use regular index-based query
      let query = ctx.db.query("students").order("asc");

      if (args.specialty || args.specialtyLegacyId) {
        query = query.filter((q) => {
          const field = q.field("specialty");
          if (
            args.specialty &&
            args.specialtyLegacyId &&
            args.specialty !== args.specialtyLegacyId
          ) {
            return q.or(
              q.eq(field, args.specialty),
              q.eq(field, args.specialtyLegacyId)
            );
          }
          return q.eq(field, args.specialty ?? args.specialtyLegacyId!);
        });
      }
      if (args.language) {
        query = query.filter((q) => q.eq(q.field("language"), args.language));
      }
      if (args.gender) {
        query = query.filter((q) => q.eq(q.field("gender"), args.gender));
      }
      if (args.base !== undefined) {
        query = query.filter((q) => q.eq(q.field("base"), args.base));
      }
      if (args.academicYearId) {
        query = query.filter((q) =>
          q.eq(q.field("academicYearId"), args.academicYearId)
        );
      }
      results = await query.collect();
    }

    // Course filter requires joining with academicYears (always post-query)
    if (args.course !== undefined && args.activeStartYear && args.activeStartYear > 0) {
      const academicYears = await ctx.db.query("academicYears").collect();
      const ayMap = new Map(academicYears.map(ay => [ay._id, ay]));
      const ayLegacyMap = new Map(academicYears.filter(ay => ay.legacyId).map(ay => [ay.legacyId!, ay]));
      results = results.filter((s) => {
        const studentAy = s.academicYearId ? (ayMap.get(s.academicYearId as any) || ayLegacyMap.get(s.academicYearId)) : undefined;
        if (!studentAy) return false;
        const course = args.activeStartYear! - studentAy.startYear + 1;
        return course === args.course;
      });
    }

    const totalCount = results.length;
    const start = (args.page - 1) * args.pageSize;
    const items = results.slice(start, start + args.pageSize);

    return {
      items,
      totalCount,
    };
  },
});

/**
 * Get student by ID
 */
export const getById = query({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get students by specialty
 */
export const getBySpecialty = query({
  args: { specialty: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_specialty", (q) => q.eq("specialty", args.specialty))
      .collect();
  },
});

/**
 * Get students by academic year
 */
export const getByAcademicYear = query({
  args: { academicYearId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_academicYear", (q) =>
        q.eq("academicYearId", args.academicYearId)
      )
      .collect();
  },
});

/**
 * Get students by specialty and academic year
 */
export const getBySpecialtyAndAcademicYear = query({
  args: {
    specialty: v.string(),
    academicYearId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_specialty_academicYear", (q) =>
        q.eq("specialty", args.specialty).eq("academicYearId", args.academicYearId)
      )
      .collect();
  },
});

/**
 * Search students by name using Convex full-text search
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) return [];
    return await ctx.db
      .query("students")
      .withSearchIndex("search_by_name", (q) =>
        q.search("searchName", args.searchTerm)
      )
      .collect();
  },
});

/**
 * Get filtered students
 */
export const getFiltered = query({
  args: {
    specialty: v.optional(v.string()),
    language: v.optional(v.string()),
    gender: v.optional(v.string()),
    base: v.optional(v.number()),
    academicYearId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let students = await ctx.db.query("students").collect();

    if (args.specialty) {
      students = students.filter((s) => s.specialty === args.specialty);
    }
    if (args.language) {
      students = students.filter((s) => s.language === args.language);
    }
    if (args.gender) {
      students = students.filter((s) => s.gender === args.gender);
    }
    if (args.base !== undefined) {
      students = students.filter((s) => s.base === args.base);
    }
    if (args.academicYearId) {
      students = students.filter(
        (s) => s.academicYearId === args.academicYearId
      );
    }

    return students;
  },
});
