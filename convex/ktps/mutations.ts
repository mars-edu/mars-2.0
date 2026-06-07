import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";
import { validateReorder } from "./lib";

/**
 * Create a ktp
 */
export const create = mutation({
  args: {
    rupEntryId: v.string(),
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    eventId: v.optional(v.string()),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("ktps", {
      ...args,
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
    rupEntryId: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    semesterId: v.optional(v.id("academicYearSemesters")),
    eventId: v.optional(v.string()),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
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
    theoretical: v.optional(v.number()),
    practical: v.optional(v.number()),
    individual: v.optional(v.number()),
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
    theoretical: v.optional(v.number()),
    practical: v.optional(v.number()),
    individual: v.optional(v.number()),
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
    const detail = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);

    // Renumber remaining siblings so positions stay contiguous 1..n
    if (detail) {
      const siblings = await ctx.db
        .query("ktpDetails")
        .withIndex("by_ktpId", (q) => q.eq("ktpId", detail.ktpId))
        .collect();
      siblings.sort((a, b) => a.position - b.position);
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].position !== i + 1) {
          await ctx.db.patch(siblings[i]._id, {
            position: i + 1,
            ...updateTimestamp(),
          });
        }
      }
    }

    return { success: true };
  },
});

/**
 * Atomically reorder all details of a ktp.
 * orderedIds must be an exact permutation of the ktp's current detail ids.
 * Positions are rewritten 1..n in the given order.
 */
export const reorderDetails = mutation({
  args: {
    ktpId: v.id("ktps"),
    orderedIds: v.array(v.id("ktpDetails")),
  },
  handler: async (ctx, args) => {
    const details = await ctx.db
      .query("ktpDetails")
      .withIndex("by_ktpId", (q) => q.eq("ktpId", args.ktpId))
      .collect();

    const error = validateReorder(
      details.map((d) => d._id),
      args.orderedIds
    );
    if (error) {
      throw new Error(error);
    }

    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], {
        position: i + 1,
        ...updateTimestamp(),
      });
    }

    return { success: true, reordered: args.orderedIds.length };
  },
});

/**
 * Delete all ktp details (keeps the ktp record)
 */
export const clearDetails = mutation({
  args: { ktpId: v.id("ktps") },
  handler: async (ctx, args) => {
    const details = await ctx.db
      .query("ktpDetails")
      .withIndex("by_ktpId", (q) => q.eq("ktpId", args.ktpId))
      .collect();

    for (const detail of details) {
      await ctx.db.delete(detail._id);
    }

    await ctx.db.patch(args.ktpId, {
      ...updateTimestamp(),
    });

    return { success: true, deleted: details.length };
  },
});

/**
 * Bulk import ktp details
 */
export const bulkImportDetails = mutation({
  args: {
    ktpId: v.id("ktps"),
    replace: v.optional(v.boolean()),
    details: v.array(
      v.object({
        position: v.number(),
        theme: v.string(),
        totalHours: v.optional(v.number()),
        srsp: v.optional(v.number()),
        srs: v.optional(v.number()),
        theoretical: v.optional(v.number()),
        practical: v.optional(v.number()),
        individual: v.optional(v.number()),
        homework: v.string(),
        notes: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.replace) {
      const existing = await ctx.db
        .query("ktpDetails")
        .withIndex("by_ktpId", (q) => q.eq("ktpId", args.ktpId))
        .collect();
      for (const detail of existing) {
        await ctx.db.delete(detail._id);
      }
    }

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
