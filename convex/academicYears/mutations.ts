import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create an academic year
 */
export const create = mutation({
  args: {
    name: v.string(),
    startYear: v.number(),
    endYear: v.number(),
    isActive: v.boolean(),
    academicHourMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    // If this year is being set as active, deactivate all others
    if (args.isActive) {
      const allYears = await ctx.db.query("academicYears").collect();
      for (const year of allYears) {
        if (year.isActive) {
          await ctx.db.patch(year._id, {
            isActive: false,
            });
        }
      }
    }

    return await ctx.db.insert("academicYears", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update an academic year
 */
export const update = mutation({
  args: {
    id: v.id("academicYears"),
    name: v.optional(v.string()),
    startYear: v.optional(v.number()),
    endYear: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    academicHourMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If setting as active, deactivate all others
    if (updates.isActive) {
      const allYears = await ctx.db.query("academicYears").collect();
      for (const year of allYears) {
        if (year._id !== id && year.isActive) {
          await ctx.db.patch(year._id, {
            isActive: false,
            });
        }
      }
    }

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
 * Set active academic year
 */
export const setActive = mutation({
  args: { id: v.id("academicYears") },
  handler: async (ctx, args) => {
    // Deactivate all years
    const allYears = await ctx.db.query("academicYears").collect();
    for (const year of allYears) {
      await ctx.db.patch(year._id, {
        isActive: year._id === args.id,
        });
    }

    return await ctx.db.get(args.id);
  },
});

/**
 * Delete an academic year
 */
export const remove = mutation({
  args: { id: v.id("academicYears") },
  handler: async (ctx, args) => {
    const year = await ctx.db.get(args.id);
    if (year?.isActive) {
      throw new Error("Cannot delete active academic year");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
