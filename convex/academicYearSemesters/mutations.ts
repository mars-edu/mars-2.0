import { mutation } from "../_generated/server";
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
      createdAt: now,
      updatedAt: now,
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
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Remove an academic year semester
 */
export const remove = mutation({
  args: {
    id: v.id("academicYearSemesters"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
