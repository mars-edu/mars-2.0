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
