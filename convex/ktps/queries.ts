import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get all ktps
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const ktps = await ctx.db.query("ktps").collect();

    // For each ktp, fetch its details
    const ktpsWithDetails = await Promise.all(
      ktps.map(async (ktp) => {
        const details = await ctx.db
          .query("ktpDetails")
          .withIndex("by_ktpId", (q) => q.eq("ktpId", ktp._id))
          .collect();

        // Sort details by position
        details.sort((a, b) => a.position - b.position);

        return {
          ...ktp,
          details,
        };
      })
    );

    return ktpsWithDetails;
  },
});

/**
 * Get ktp by ID
 */
export const getById = query({
  args: { id: v.id("ktps") },
  handler: async (ctx, args) => {
    const ktp = await ctx.db.get(args.id);
    if (!ktp) return null;

    const details = await ctx.db
      .query("ktpDetails")
      .withIndex("by_ktpId", (q) => q.eq("ktpId", args.id))
      .collect();

    // Sort details by position
    details.sort((a, b) => a.position - b.position);

    return {
      ...ktp,
      details,
    };
  },
});

/**
 * Get ktps by RUP entry ID
 */
export const getByRupEntryId = query({
  args: { rupEntryId: v.string() },
  handler: async (ctx, args) => {
    const ktps = await ctx.db
      .query("ktps")
      .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", args.rupEntryId))
      .collect();

    // For each ktp, fetch its details
    const ktpsWithDetails = await Promise.all(
      ktps.map(async (ktp) => {
        const details = await ctx.db
          .query("ktpDetails")
          .withIndex("by_ktpId", (q) => q.eq("ktpId", ktp._id))
          .collect();

        // Sort details by position
        details.sort((a, b) => a.position - b.position);

        return {
          ...ktp,
          details,
        };
      })
    );

    return ktpsWithDetails;
  },
});

/**
 * Get ktps by event ID
 */
export const getByEventId = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const ktps = await ctx.db
      .query("ktps")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();

    // For each ktp, fetch its details
    const ktpsWithDetails = await Promise.all(
      ktps.map(async (ktp) => {
        const details = await ctx.db
          .query("ktpDetails")
          .withIndex("by_ktpId", (q) => q.eq("ktpId", ktp._id))
          .collect();

        // Sort details by position
        details.sort((a, b) => a.position - b.position);

        return {
          ...ktp,
          details,
        };
      })
    );

    return ktpsWithDetails;
  },
});

/**
 * Get ktps by academic year and semester
 */
export const getByAcademicYearAndSemester = query({
  args: {
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
  },
  handler: async (ctx, args) => {
    const ktps = await ctx.db
      .query("ktps")
      .withIndex("by_academicYear_semester", (q) =>
        q.eq("academicYearId", args.academicYearId).eq("semesterId", args.semesterId as any)
      )
      .collect();

    // For each ktp, fetch its details
    const ktpsWithDetails = await Promise.all(
      ktps.map(async (ktp) => {
        const details = await ctx.db
          .query("ktpDetails")
          .withIndex("by_ktpId", (q) => q.eq("ktpId", ktp._id))
          .collect();

        // Sort details by position
        details.sort((a, b) => a.position - b.position);

        return {
          ...ktp,
          details,
        };
      })
    );

    return ktpsWithDetails;
  },
});
