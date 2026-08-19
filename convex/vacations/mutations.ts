import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a vacation
 */
export const create = mutation({
  args: {
    shortName: v.string(),
    fullName: v.string(),
    academicYearId: v.id("academicYears"),
    startDate: v.string(),
    endDate: v.string(),
    semesterId: v.id("academicYearSemesters"),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("vacations", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a vacation
 */
export const update = mutation({
  args: {
    id: v.id("vacations"),
    shortName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    semesterId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a vacation
 */
export const remove = mutation({
  args: { id: v.id("vacations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Copy vacations from one semester to another
 */
export const copyFromSemester = mutation({
  args: {
    sourceSemesterId: v.id("academicYearSemesters"),
    targetSemesterId: v.id("academicYearSemesters"),
    targetAcademicYearId: v.id("academicYears"),
  },
  handler: async (ctx, args) => {
    const { sourceSemesterId, targetSemesterId, targetAcademicYearId } = args;

    const sourceItems = await ctx.db
      .query("vacations")
      .withIndex("by_semester", (q) => q.eq("semesterId", sourceSemesterId))
      .collect();

    if (sourceItems.length === 0) {
      throw new Error("No vacations found in source semester");
    }

    const existing = await ctx.db
      .query("vacations")
      .withIndex("by_semester", (q) => q.eq("semesterId", targetSemesterId))
      .collect();

    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    const timestamps = createTimestamps();
    const copiedIds = [];

    for (const item of sourceItems) {
      const newId = await ctx.db.insert("vacations", {
        shortName: item.shortName,
        fullName: item.fullName,
        academicYearId: targetAcademicYearId,
        semesterId: targetSemesterId,
        startDate: item.startDate,
        endDate: item.endDate,
        ...timestamps,
      });
      copiedIds.push(newId);
    }

    return { success: true, copiedCount: copiedIds.length, ids: copiedIds };
  },
});
