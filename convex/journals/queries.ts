import { query } from "../functions";
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
    academicYearId: v.id("academicYears"),
    semesterId: v.id("academicYearSemesters"),
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

/**
 * Get journals by student ID
 */
export const getByStudentId = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('journalStudents')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .collect();
    const journals = await Promise.all(
      rows.map((r) => ctx.db.get(r.journalId)),
    );
    return journals.filter(Boolean);
  },
});

/**
 * True if any mark exists in any wizard-child individual journal of the
 * given main group event. Used as the edit-lock pre-check.
 */
export const hasMarksInIndividualJournals = query({
  args: { mainEventId: v.string() },
  handler: async (ctx, args) => {
    const children = await ctx.db
      .query("calendarEvents")
      .withIndex("by_sourceGroupEventId", (q) =>
        q.eq("sourceGroupEventId", args.mainEventId)
      )
      .collect();
    for (const child of children) {
      const journal = await ctx.db
        .query("journals")
        .withIndex("by_calendarEvent", (q) => q.eq("calendarEventId", child._id))
        .unique();
      if (!journal) continue;
      const anyMark = await ctx.db
        .query("marks")
        .withIndex("by_journal", (q) => q.eq("journalId", journal._id))
        .first();
      if (anyMark) return true;
    }
    return false;
  },
});
