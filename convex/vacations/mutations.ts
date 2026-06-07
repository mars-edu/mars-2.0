import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a vacation
 */
export const create = mutation({
  args: {
    shortName: v.string(),
    fullName: v.string(),
    academicYearId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    semesterId: v.optional(v.id("academicYearSemesters")),
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
      ...updateTimestamp(),
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
