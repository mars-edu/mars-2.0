import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create an education schedule
 */
export const create = mutation({
  args: {
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    order: v.number(),
    academicYearId: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("educationSchedules", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update an education schedule
 */
export const update = mutation({
  args: {
    id: v.id("educationSchedules"),
    name: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      ...updateTimestamp(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Delete an education schedule
 */
export const remove = mutation({
  args: { id: v.id("educationSchedules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Copy education schedules from one academic year to another
 * Deletes all existing schedules in the target year before copying
 */
export const copySchedulesFromYear = mutation({
  args: {
    sourceAcademicYearId: v.string(),
    targetAcademicYearId: v.string(),
  },
  handler: async (ctx, args) => {
    const { sourceAcademicYearId, targetAcademicYearId } = args;

    // Get source schedules
    const sourceSchedules = await ctx.db
      .query("educationSchedules")
      .filter((q) => q.eq(q.field("academicYearId"), sourceAcademicYearId))
      .collect();

    if (sourceSchedules.length === 0) {
      throw new Error("No schedules found in source academic year");
    }

    // Delete existing schedules in target year
    const existingTargetSchedules = await ctx.db
      .query("educationSchedules")
      .filter((q) => q.eq(q.field("academicYearId"), targetAcademicYearId))
      .collect();

    for (const schedule of existingTargetSchedules) {
      await ctx.db.delete(schedule._id);
    }

    // Copy schedules to target year
    const timestamps = createTimestamps();
    const copiedScheduleIds = [];

    for (const schedule of sourceSchedules) {
      const newId = await ctx.db.insert("educationSchedules", {
        name: schedule.name,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        order: schedule.order,
        academicYearId: targetAcademicYearId,
        ...timestamps,
      });
      copiedScheduleIds.push(newId);
    }

    return {
      success: true,
      copiedCount: copiedScheduleIds.length,
      ids: copiedScheduleIds,
    };
  },
});

/**
 * Reorder education schedules
 */
export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("educationSchedules"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        order: update.order,
        ...updateTimestamp(),
      });
    }
    return { success: true };
  },
});
