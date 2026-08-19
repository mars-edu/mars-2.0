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

/**
 * Get unified journal grid data in a single server-side query:
 * - Journal metadata + discipline title
 * - Enriched students list (sorted by name)
 * - Marks grouped by studentId and columnIndex
 * - High-level statistics
 */
export const getJournalGridData = query({
  args: { journalId: v.id("journals") },
  handler: async (ctx, args) => {
    const journal = await ctx.db.get(args.journalId);
    if (!journal) return null;

    const [rupEntry, semester, journalStudentRows, allMarks] = await Promise.all([
      journal.disciplineId ? ctx.db.get(journal.disciplineId) : null,
      journal.semesterId ? ctx.db.get(journal.semesterId) : null,
      ctx.db
        .query("journalStudents")
        .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
        .collect(),
      ctx.db
        .query("marks")
        .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
        .collect(),
    ]);

    // Fetch and enrich student documents
    const studentDocs = await Promise.all(
      journalStudentRows.map(async (row) => {
        const student = await ctx.db
          .query("students")
          .filter((q) => q.eq(q.field("_id"), row.studentId as any))
          .first();
        const fullName = student
          ? [student.surname, student.firstName, student.patronymic].filter(Boolean).join(" ")
          : `Студент ${row.studentId.slice(0, 6)}`;
        return {
          id: row._id,
          studentId: row.studentId,
          name: fullName,
          surname: student?.surname || "",
          firstName: student?.firstName || "",
          patronymic: student?.patronymic || "",
          language: student?.language || "RU",
          specialty: student?.specialty || "",
        };
      })
    );

    // Sort students alphabetically
    studentDocs.sort((a, b) => a.name.localeCompare(b.name, "ru"));

    // Group marks by studentId
    const marksByStudent: Record<string, typeof allMarks> = {};
    for (const mark of allMarks) {
      if (!marksByStudent[mark.studentId]) {
        marksByStudent[mark.studentId] = [];
      }
      marksByStudent[mark.studentId].push(mark);
    }

    // Calculate quick stats
    const validMarks = allMarks.filter((m) => m.value !== null && m.value !== "");
    const numericMarks = validMarks
      .map((m) => parseInt(m.value || "0", 10))
      .filter((n) => !isNaN(n) && n > 0);

    const avgScore =
      numericMarks.length > 0
        ? Math.round((numericMarks.reduce((sum, m) => sum + m, 0) / numericMarks.length) * 10) / 10
        : 0;

    return {
      journal: {
        _id: journal._id,
        calendarEventId: journal.calendarEventId,
        disciplineId: journal.disciplineId,
        disciplineName: rupEntry?.moduleName || rupEntry?.learningOutcome || "Дисциплина",
        moduleIndex: rupEntry?.moduleIndex || "",
        groupName: journal.groupName || "",
        semesterId: journal.semesterId,
        academicYearId: journal.academicYearId,
        isIndividualJournal: journal.isIndividualJournal || false,
        isMixedGroup: journal.isMixedGroup || false,
      },
      students: studentDocs,
      marksByStudent,
      stats: {
        totalStudents: studentDocs.length,
        totalMarks: allMarks.length,
        filledMarks: validMarks.length,
        averageScore: avgScore,
      },
    };
  },
});
