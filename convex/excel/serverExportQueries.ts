/**
 * Server-side export queries (internal only)
 * Lightweight queries for the server-side bulk export action.
 * Returns minimal data needed for Excel generation.
 */

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Resolve journal by calendarEventId
 */
export const getJournalByCalendarEvent = internalQuery({
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
 * Get marks for export — returns only the structured map, no raw documents.
 * Much lighter than getJournalMarks which returns full mark documents + journal + students.
 */
export const getMarksForExport = internalQuery({
  args: { journalId: v.id("journals") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("marks")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();

    // Build compact studentMarks map: studentId -> columnIndex -> rowIndex -> value
    const studentMarks: Record<
      string,
      Record<number, Record<number, string | null>>
    > = {};

    for (const mark of marks) {
      const sid = mark.studentId;
      if (!studentMarks[sid]) studentMarks[sid] = {};
      if (!studentMarks[sid][mark.columnIndex])
        studentMarks[sid][mark.columnIndex] = {};
      studentMarks[sid][mark.columnIndex][mark.rowIndex] = mark.value ?? null;
    }

    return { studentMarks };
  },
});
