import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all teachers
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teachers").collect();
  },
});

/**
 * Get a teacher by ID
 */
export const getById = query({
  args: { id: v.id("teachers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get a teacher by user ID
 */
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teachers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

/**
 * Get teachers by position
 */
export const getByPosition = query({
  args: { position: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teachers")
      .withIndex("by_position", (q) => q.eq("position", args.position))
      .collect();
  },
});

/**
 * Search teachers by name
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const teachers = await ctx.db.query("teachers").collect();

    const term = args.searchTerm.toLowerCase();
    return teachers.filter((t) => {
      const fullName =
        `${t.surname} ${t.firstName} ${t.patronymic}`.toLowerCase();
      return (
        fullName.includes(term) ||
        t.surname.toLowerCase().includes(term) ||
        t.firstName.toLowerCase().includes(term)
      );
    });
  },
});

/**
 * Get teachers with pagination and optional filters
 */
export const listPaginated = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    position: v.optional(v.string()),
    employmentYear: v.optional(v.number()),
    gender: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("teachers").order("asc");

    if (args.position) {
      query = query.filter((q) => q.eq(q.field("position"), args.position));
    }
    if (args.employmentYear) {
      query = query.filter((q) =>
        q.eq(q.field("employmentYear"), args.employmentYear)
      );
    }
    if (args.gender) {
      query = query.filter((q) => q.eq(q.field("gender"), args.gender));
    }

    const results = await query.collect();

    // Apply search filter if present
    let filteredResults = results;
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      filteredResults = results.filter((t) => {
        const fullName =
          `${t.surname} ${t.firstName} ${t.patronymic}`.toLowerCase();
        return (
          fullName.includes(term) ||
          t.surname.toLowerCase().includes(term) ||
          t.firstName.toLowerCase().includes(term)
        );
      });
    }

    const totalCount = filteredResults.length;
    const start = (args.page - 1) * args.pageSize;
    const items = filteredResults.slice(start, start + args.pageSize);

    return {
      items,
      totalCount,
    };
  },
});
