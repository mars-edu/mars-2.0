import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get all marks for a journal
 */
export const getJournalMarks = query({
  args: { journalId: v.id("journals") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("marks")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();

    const journal = await ctx.db.get(args.journalId);

    const journalStudents = await ctx.db
      .query("journalStudents")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();

    // Build student marks map for easy access
    const studentMarks: Record<
      string,
      Record<number, Record<number, string | null>>
    > = {};

    for (const mark of marks) {
      const studentId = mark.studentId;
      if (!studentMarks[studentId]) {
        studentMarks[studentId] = {};
      }
      if (!studentMarks[studentId][mark.columnIndex]) {
        studentMarks[studentId][mark.columnIndex] = {};
      }
      studentMarks[studentId][mark.columnIndex][mark.rowIndex] =
        mark.value ?? null;
    }

    return {
      journalId: args.journalId,
      marks,
      studentMarks,
      journal,
      students: journalStudents,
    };
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
 * Get mark history for a journal
 */
export const getMarkHistory = query({
  args: {
    journalId: v.id("journals"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("markHistory")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .order("desc");

    const history = await query.collect();

    // Apply limit if specified
    if (args.limit) {
      return history.slice(0, args.limit);
    }

    return history;
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
    return await ctx.db
      .query("markHistory")
      .withIndex("by_journal_student", (q) =>
        q.eq("journalId", args.journalId).eq("studentId", args.studentId)
      )
      .collect();
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

    // Calculate statistics
    const validMarks = marks.filter((m) => m.value !== null && m.value !== "");
    const numericMarks = validMarks
      .map((m) => parseInt(m.value || "0", 10))
      .filter((n) => !isNaN(n));

    const average =
      numericMarks.length > 0
        ? numericMarks.reduce((a, b) => a + b, 0) / numericMarks.length
        : 0;

    return {
      totalStudents: students.length,
      totalMarks: validMarks.length,
      averageMark: Math.round(average * 100) / 100,
      marksByColumn: marks.reduce(
        (acc, m) => {
          const col = m.columnIndex.toString();
          if (!acc[col]) acc[col] = 0;
          if (m.value) acc[col]++;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },
});
