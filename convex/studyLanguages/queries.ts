import { query } from "../functions";
import { v } from "convex/values";

/**
 * List all study languages
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("studyLanguages").collect();
  },
});

/**
 * Get study language by ID
 */
export const getById = query({
  args: { id: v.id("studyLanguages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get study language by its `code` (e.g. "ru" / "kk" / "en") — the join key
 * used across rupEntries.language, students.language, calendarEvents.languages[].
 */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studyLanguages")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});
