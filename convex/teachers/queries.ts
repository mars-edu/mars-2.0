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
 * Search teachers by name using Convex full-text search
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) return [];
    return await ctx.db
      .query("teachers")
      .withSearchIndex("search_by_name", (q) =>
        q.search("searchName", args.searchTerm)
      )
      .collect();
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
    let results;

    if (args.searchTerm) {
      // Use Convex text search when a search term is provided
      results = await ctx.db
        .query("teachers")
        .withSearchIndex("search_by_name", (q) => {
          let sq = q.search("searchName", args.searchTerm!);
          if (args.gender) sq = sq.eq("gender", args.gender as "male" | "female");
          if (args.position) sq = sq.eq("position", args.position);
          return sq;
        })
        .collect();

      // employmentYear isn't a filterField, apply post-search
      if (args.employmentYear) {
        results = results.filter((t) => t.employmentYear === args.employmentYear);
      }
    } else {
      // No search term — use regular index-based query
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
      results = await query.collect();
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
