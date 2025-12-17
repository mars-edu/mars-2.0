import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all journals
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("journals").collect();
  },
});

/**
 * Get journal by ID
 */
export const getById = query({
  args: { id: v.id("journals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get journal by calendar event
 */
export const getByCalendarEvent = query({
  args: { calendarEventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journals")
      .withIndex("by_calendarEvent", (q) =>
        q.eq("calendarEventId", args.calendarEventId)
      )
      .unique();
  },
});

/**
 * Get journals by academic year and semester
 */
export const getByAcademicYearSemester = query({
  args: {
    academicYearId: v.string(),
    semesterId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journals")
      .withIndex("by_academicYear_semester", (q) =>
        q
          .eq("academicYearId", args.academicYearId)
          .eq("semesterId", args.semesterId)
      )
      .collect();
  },
});

/**
 * Get students in a journal
 */
export const getStudents = query({
  args: { journalId: v.id("journals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journalStudents")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();
  },
});

/**
 * Get mixed group journals
 */
export const getMixedGroupJournals = query({
  args: {},
  handler: async (ctx) => {
    const journals = await ctx.db.query("journals").collect();
    return journals.filter((j) => j.isMixedGroup === true);
  },
});

/**
 * Get individual journals
 */
export const getIndividualJournals = query({
  args: {},
  handler: async (ctx) => {
    const journals = await ctx.db.query("journals").collect();
    return journals.filter((j) => j.isIndividualJournal === true);
  },
});
