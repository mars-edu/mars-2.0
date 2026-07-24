import { mutation } from "../functions";
import { v } from "convex/values";

/**
 * Create a new academic year semester
 */
export const create = mutation({
  args: {
    academicYearId: v.id("academicYears"),
    semesterDefinitionId: v.id("semesterDefinitions"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("academicYearSemesters", {
      academicYearId: args.academicYearId,
      semesterDefinitionId: args.semesterDefinitionId,
      startDate: args.startDate,
      endDate: args.endDate,
      });
  },
});

/**
 * Update an existing academic year semester
 */
export const update = mutation({
  args: {
    id: v.id("academicYearSemesters"),
    semesterDefinitionId: v.optional(v.id("semesterDefinitions")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    await ctx.db.patch(id, {
      ...updates,
      });

    return id;
  },
});

/**
 * Remove an academic year semester (also deletes its distribution entries)
 */
export const remove = mutation({
  args: {
    id: v.id("academicYearSemesters"),
  },
  handler: async (ctx, args) => {
    // Delete all distribution entries for this semester
    const distributions = await ctx.db
      .query("distributionEntries")
      .withIndex("by_semester", (q) => q.eq("semesterId", args.id))
      .collect();

    for (const dist of distributions) {
      await ctx.db.delete(dist._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
