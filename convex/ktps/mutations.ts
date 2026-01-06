import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a ktp
 */
export const create = mutation({
  args: {
    class9Id: v.string(),
    academicYearId: v.string(),
    semesterId: v.string(),
    eventId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("ktps", {
      ...args,
      semesterId: args.semesterId as any,
      ...timestamps,
    });
  },
});

/**
 * Update a ktp
 */
export const update = mutation({
  args: {
    id: v.id("ktps"),
    class9Id: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    semesterId: v.optional(v.string()),
    eventId: v.optional(v.string()),
    name: v.optional(v.string()),
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
 * Delete a ktp (also deletes its details)
 */
export const remove = mutation({
  args: { id: v.id("ktps") },
  handler: async (ctx, args) => {
    // Delete all details for this ktp
    const details = await ctx.db
      .query("ktpDetails")
      .withIndex("by_ktpId", (q) => q.eq("ktpId", args.id))
      .collect();

    for (const detail of details) {
      await ctx.db.delete(detail._id);
    }

    // Delete the ktp
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Add a ktp detail
 */
export const addDetail = mutation({
  args: {
    ktpId: v.id("ktps"),
    position: v.number(),
    theme: v.string(),
    totalHours: v.optional(v.number()),
    srsp: v.optional(v.number()),
    srs: v.optional(v.number()),
    homework: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("ktpDetails", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a ktp detail
 */
export const updateDetail = mutation({
  args: {
    id: v.id("ktpDetails"),
    position: v.optional(v.number()),
    theme: v.optional(v.string()),
    totalHours: v.optional(v.number()),
    srsp: v.optional(v.number()),
    srs: v.optional(v.number()),
    homework: v.optional(v.string()),
    notes: v.optional(v.string()),
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
 * Delete a ktp detail
 */
export const removeDetail = mutation({
  args: { id: v.id("ktpDetails") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Bulk import ktp details
 */
export const bulkImportDetails = mutation({
  args: {
    ktpId: v.id("ktps"),
    details: v.array(
      v.object({
        position: v.number(),
        theme: v.string(),
        totalHours: v.optional(v.number()),
        srsp: v.optional(v.number()),
        srs: v.optional(v.number()),
        homework: v.string(),
        notes: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();
    const insertedIds = [];

    for (const detail of args.details) {
      const id = await ctx.db.insert("ktpDetails", {
        ktpId: args.ktpId,
        ...detail,
        ...timestamps,
      });
      insertedIds.push(id);
    }

    return { success: true, insertedIds };
  },
});
