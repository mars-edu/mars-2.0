import { query } from "../functions";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Get all marks for a journal
 */
export const getMarksByJournal = query({
  args: { journalId: v.id("journals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marks")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();
  },
});

/**
 * Alias for getMarksByJournal
 */
export const getJournalMarks = query({
  args: { journalId: v.id("journals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marks")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();
  },
});

/**
 * Get all marks for a student across all journals
 */
export const getAllByStudentId = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marks")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
  },
});

/**
 * Get marks for a specific student in a journal
 */
export const getStudentMarks = query({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marks")
      .withIndex("by_journal_student", (q) =>
        q.eq("journalId", args.journalId).eq("studentId", args.studentId)
      )
      .collect();
  },
});

/**
 * Get mark for a specific cell (journal, student, column, row)
 */
export const getMarkByCell = query({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
    columnIndex: v.number(),
    rowIndex: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marks")
      .withIndex("by_journal_student_column_row", (q) =>
        q
          .eq("journalId", args.journalId)
          .eq("studentId", args.studentId)
          .eq("columnIndex", args.columnIndex)
          .eq("rowIndex", args.rowIndex)
      )
      .first();
  },
});

/**
 * Get mark history for a journal (with optional user details and limit)
 */
export const getJournalHistory = query({
  args: {
    journalId: v.id("journals"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("markHistory")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      history.slice(0, args.limit ?? history.length).map(async (h) => {
        const user = await ctx.db.get(h.changedBy);
        return {
          ...h,
          changedByName: user
            ? `${user.lastName} ${user.firstName}${user.middleName ? " " + user.middleName : ""}`
            : "Пользователь",
        };
      })
    );

    return enriched;
  },
});

/**
 * Get mark history for a specific cell in a journal
 */
export const getCellMarkHistory = query({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
    columnIndex: v.number(),
    rowIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("markHistory")
      .withIndex("by_journal_student", (q) =>
        q.eq("journalId", args.journalId).eq("studentId", args.studentId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("columnIndex"), args.columnIndex),
          q.eq(q.field("rowIndex"), args.rowIndex)
        )
      )
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      history.map(async (h) => {
        const user = await ctx.db.get(h.changedBy);
        return {
          ...h,
          changedByName: user
            ? `${user.lastName} ${user.firstName}${user.middleName ? " " + user.middleName : ""}`
            : "Пользователь",
        };
      })
    );

    return enriched;
  },
});

/**
 * Get mark history for a specific student
 */
export const getStudentMarkHistory = query({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("markHistory")
      .withIndex("by_journal_student", (q) =>
        q.eq("journalId", args.journalId).eq("studentId", args.studentId)
      )
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      history.map(async (h) => {
        const user = await ctx.db.get(h.changedBy);
        return {
          ...h,
          changedByName: user
            ? `${user.lastName} ${user.firstName}${user.middleName ? " " + user.middleName : ""}`
            : "Пользователь",
        };
      })
    );

    return enriched;
  },
});

/**
 * Get journal statistics
 */
export const getJournalStats = query({
  args: { journalId: v.id("journals") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("marks")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();

    const students = await ctx.db
      .query("journalStudents")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();

    const validMarks = marks.filter((m) => m.value !== null && m.value !== "");
    const numericMarks = validMarks
      .map((m) => parseInt(m.value || "0", 10))
      .filter((n) => !isNaN(n) && n > 0);

    const averageMark =
      numericMarks.length > 0
        ? numericMarks.reduce((sum, m) => sum + m, 0) / numericMarks.length
        : 0;

    return {
      totalMarks: marks.length,
      filledMarks: validMarks.length,
      studentCount: students.length,
      averageMark: Math.round(averageMark * 10) / 10,
    };
  },
});

/**
 * Alias for getJournalHistory
 */
export const getMarkHistory = getJournalHistory;
