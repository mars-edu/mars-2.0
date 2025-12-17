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
 * Search students by name
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const students = await ctx.db.query("students").collect();

    const term = args.searchTerm.toLowerCase();
    return students.filter((s) => {
      const fullName =
        `${s.surname} ${s.firstName} ${s.patronymic}`.toLowerCase();
      return (
        fullName.includes(term) ||
        s.surname.toLowerCase().includes(term) ||
        s.firstName.toLowerCase().includes(term)
      );
    });
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
