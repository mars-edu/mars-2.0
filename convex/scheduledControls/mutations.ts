import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a scheduled final control
 */
export const createFinal = mutation({
  args: {
    finalControlId: v.string(),
    academicYearId: v.id("academicYears"),
    shortName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rupEntryId: v.optional(v.id("rupEntries")),
    semesterId: v.id("academicYearSemesters"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("scheduledFinalControls", {
      ...args,
      semesterId: args.semesterId,
      ...timestamps,
    });
  },
});

/**
 * Create a scheduled intermediate control
 */
export const createIntermediate = mutation({
  args: {
    intermediateControlId: v.string(),
    academicYearId: v.id("academicYears"),
    shortName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rupEntryId: v.optional(v.id("rupEntries")),
    semesterId: v.id("academicYearSemesters"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("scheduledIntermediateControls", {
      ...args,
      semesterId: args.semesterId,
      ...timestamps,
    });
  },
});

/**
 * Update a scheduled final control
 */
export const updateFinal = mutation({
  args: {
    id: v.id("scheduledFinalControls"),
    finalControlId: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    shortName: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    rupEntryId: v.optional(v.id("rupEntries")),
    semesterId: v.optional(v.id("academicYearSemesters")),
    date: v.optional(v.string()),
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
 * Update a scheduled intermediate control
 */
export const updateIntermediate = mutation({
  args: {
    id: v.id("scheduledIntermediateControls"),
    intermediateControlId: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    shortName: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    rupEntryId: v.optional(v.id("rupEntries")),
    semesterId: v.optional(v.id("academicYearSemesters")),
    date: v.optional(v.string()),
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
 * Delete a scheduled final control
 */
export const removeFinal = mutation({
  args: { id: v.id("scheduledFinalControls") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Delete a scheduled intermediate control
 */
export const removeIntermediate = mutation({
  args: { id: v.id("scheduledIntermediateControls") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Copy scheduled final controls from one semester to another
 */
export const copyFinalFromSemester = mutation({
  args: {
    sourceSemesterId: v.id("academicYearSemesters"),
    targetSemesterId: v.id("academicYearSemesters"),
    targetAcademicYearId: v.id("academicYears"),
  },
  handler: async (ctx, args) => {
    const { sourceSemesterId, targetSemesterId, targetAcademicYearId } = args;

    const sourceItems = await ctx.db
      .query("scheduledFinalControls")
      .withIndex("by_semester", (q) => q.eq("semesterId", sourceSemesterId))
      .collect();

    if (sourceItems.length === 0) {
      throw new Error("No final controls found in source semester");
    }

    const existing = await ctx.db
      .query("scheduledFinalControls")
      .withIndex("by_semester", (q) => q.eq("semesterId", targetSemesterId))
      .collect();

    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    const timestamps = createTimestamps();
    const copiedIds = [];

    for (const item of sourceItems) {
      const newId = await ctx.db.insert("scheduledFinalControls", {
        finalControlId: item.finalControlId,
        shortName: item.shortName,
        academicYearId: targetAcademicYearId,
        semesterId: targetSemesterId,
        startDate: item.startDate,
        endDate: item.endDate,
        rupEntryId: item.rupEntryId,
        date: item.date,
        ...timestamps,
      });
      copiedIds.push(newId);
    }

    return { success: true, copiedCount: copiedIds.length, ids: copiedIds };
  },
});

/**
 * Copy scheduled intermediate controls from one semester to another
 */
export const copyIntermediateFromSemester = mutation({
  args: {
    sourceSemesterId: v.id("academicYearSemesters"),
    targetSemesterId: v.id("academicYearSemesters"),
    targetAcademicYearId: v.id("academicYears"),
  },
  handler: async (ctx, args) => {
    const { sourceSemesterId, targetSemesterId, targetAcademicYearId } = args;

    const sourceItems = await ctx.db
      .query("scheduledIntermediateControls")
      .withIndex("by_semester", (q) => q.eq("semesterId", sourceSemesterId))
      .collect();

    if (sourceItems.length === 0) {
      throw new Error("No intermediate controls found in source semester");
    }

    const existing = await ctx.db
      .query("scheduledIntermediateControls")
      .withIndex("by_semester", (q) => q.eq("semesterId", targetSemesterId))
      .collect();

    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    const timestamps = createTimestamps();
    const copiedIds = [];

    for (const item of sourceItems) {
      const newId = await ctx.db.insert("scheduledIntermediateControls", {
        intermediateControlId: item.intermediateControlId,
        shortName: item.shortName,
        academicYearId: targetAcademicYearId,
        semesterId: targetSemesterId,
        startDate: item.startDate,
        endDate: item.endDate,
        rupEntryId: item.rupEntryId,
        date: item.date,
        ...timestamps,
      });
      copiedIds.push(newId);
    }

    return { success: true, copiedCount: copiedIds.length, ids: copiedIds };
  },
});
