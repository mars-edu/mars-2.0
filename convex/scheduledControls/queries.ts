import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all scheduled final controls
 */
export const listFinal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("scheduledFinalControls").collect();
  },
});

/**
 * Get all scheduled intermediate controls
 */
export const listIntermediate = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("scheduledIntermediateControls").collect();
  },
});

/**
 * Get scheduled final control by ID
 */
export const getFinalById = query({
  args: { id: v.id("scheduledFinalControls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get scheduled intermediate control by ID
 */
export const getIntermediateById = query({
  args: { id: v.id("scheduledIntermediateControls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get scheduled final controls by RUP entry ID
 */
export const getFinalByRupEntryId = query({
  args: { rupEntryId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledFinalControls")
      .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", args.rupEntryId))
      .collect();
  },
});

/**
 * Get scheduled intermediate controls by RUP entry ID
 */
export const getIntermediateByRupEntryId = query({
  args: { rupEntryId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledIntermediateControls")
      .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", args.rupEntryId))
      .collect();
  },
});

/**
 * Get scheduled final controls by semester
 */
export const getFinalBySemester = query({
  args: { semesterId: v.id("academicYearSemesters") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledFinalControls")
      .withIndex("by_semester", (q) => q.eq("semesterId", args.semesterId))
      .collect();
  },
});

/**
 * Get scheduled intermediate controls by semester
 */
export const getIntermediateBySemester = query({
  args: { semesterId: v.id("academicYearSemesters") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduledIntermediateControls")
      .withIndex("by_semester", (q) => q.eq("semesterId", args.semesterId))
      .collect();
  },
});
