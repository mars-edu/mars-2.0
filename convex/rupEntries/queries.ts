import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all RUP entries
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("rupEntries").collect();

    // For each item, fetch its distribution entries
    const itemsWithDistributions = await Promise.all(
      items.map(async (item) => {
        const distributions = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", item._id))
          .collect();

        return {
          ...item,
          distributionEntries: distributions,
        };
      })
    );

    return itemsWithDistributions;
  },
});

/**
 * Get RUP entry by ID
 */
export const getById = query({
  args: { id: v.id("rupEntries") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    const distributions = await ctx.db
      .query("distributionEntries")
      .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", args.id))
      .collect();

    return {
      ...item,
      distributionEntries: distributions,
    };
  },
});

/**
 * Get RUP entrys by academic year
 */
export const getByAcademicYear = query({
  args: { academicYearId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("rupEntries")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", args.academicYearId))
      .collect();

    // For each item, fetch its distribution entries
    const itemsWithDistributions = await Promise.all(
      items.map(async (item) => {
        const distributions = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", item._id))
          .collect();

        return {
          ...item,
          distributionEntries: distributions,
        };
      })
    );

    return itemsWithDistributions;
  },
});

/**
 * Get RUP entrys by academic year and specialty
 */
export const getByAcademicYearAndSpecialty = query({
  args: {
    academicYearId: v.string(),
    specialtyIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("rupEntries")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", args.academicYearId))
      .collect();

    // Filter by specialtyIds if provided
    let filteredItems = items;
    if (args.specialtyIds && args.specialtyIds.length > 0) {
      filteredItems = items.filter((item) =>
        args.specialtyIds!.some((id) => item.specialtyIds.includes(id))
      );
    }

    // Sort by position
    filteredItems.sort((a, b) => a.position - b.position);

    // For each item, fetch its distribution entries
    const itemsWithDistributions = await Promise.all(
      filteredItems.map(async (item) => {
        const distributions = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", item._id))
          .collect();

        return {
          ...item,
          distributionEntries: distributions,
        };
      })
    );

    return itemsWithDistributions;
  },
});

/**
 * Get RUP entrys by groupId (all language variants in a group)
 */
export const getByGroupId = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("rupEntries")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const itemsWithDistributions = await Promise.all(
      items.map(async (item) => {
        const distributions = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", item._id))
          .collect();

        return {
          ...item,
          distributionEntries: distributions,
        };
      })
    );

    return itemsWithDistributions;
  },
});
