import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a scheduled final control
 */
export const createFinal = mutation({
  args: {
    finalControlId: v.string(),
    academicYearId: v.string(),
    shortName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rupEntryId: v.optional(v.string()),
    semesterId: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("scheduledFinalControls", {
      ...args,
      semesterId: args.semesterId as any,
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
    academicYearId: v.string(),
    shortName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rupEntryId: v.optional(v.string()),
    semesterId: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("scheduledIntermediateControls", {
      ...args,
      semesterId: args.semesterId as any,
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
    rupEntryId: v.optional(v.string()),
    semesterId: v.optional(v.string()),
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
      ...updateTimestamp(),
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
    rupEntryId: v.optional(v.string()),
    semesterId: v.optional(v.string()),
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
      ...updateTimestamp(),
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
