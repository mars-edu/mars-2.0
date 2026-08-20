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

/**
 * Get enriched list of journals with resolved discipline, teacher, semester, and student count.
 * Completely eliminates N+1 queries and client-side store joins.
 */
export const listEnriched = query({
  args: {
    academicYearId: v.optional(v.id("academicYears")),
    semesterId: v.optional(v.id("academicYearSemesters")),
    teacherId: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let journals;
    if (args.academicYearId && args.semesterId) {
      journals = await ctx.db
        .query("journals")
        .withIndex("by_academicYear_semester", (q) =>
          q.eq("academicYearId", args.academicYearId!).eq("semesterId", args.semesterId!)
        )
        .collect();
    } else {
      journals = await ctx.db.query("journals").collect();
    }

    // Pre-fetch references in memory
    const [allRupEntries, allTeachers, allSemesters, allCalendarEvents, allJournalStudents] =
      await Promise.all([
        ctx.db.query("rupEntries").collect(),
        ctx.db.query("teachers").collect(),
        ctx.db.query("academicYearSemesters").collect(),
        ctx.db.query("calendarEvents").collect(),
        ctx.db.query("journalStudents").collect(),
      ]);

    const rupMap = new Map(allRupEntries.map((r) => [r._id, r]));
    const teacherMap = new Map(allTeachers.map((t) => [t._id as string, t]));
    const semesterMap = new Map(allSemesters.map((s) => [s._id, s]));
    const eventMap = new Map(allCalendarEvents.map((e) => [e._id, e]));

    const studentCountMap = new Map<string, number>();
    for (const js of allJournalStudents) {
      studentCountMap.set(js.journalId, (studentCountMap.get(js.journalId) || 0) + 1);
    }

    const enriched = journals.map((j) => {
      const rup = j.disciplineId ? rupMap.get(j.disciplineId) : null;
      const event = j.calendarEventId ? eventMap.get(j.calendarEventId as any) : null;
      const teacherId = event?.teacherId;
      const teacher = teacherId ? teacherMap.get(teacherId) : null;
      const semester = j.semesterId ? semesterMap.get(j.semesterId) : null;

      const teacherFullName = teacher
        ? [teacher.surname, teacher.firstName, teacher.patronymic].filter(Boolean).join(" ")
        : "";

      return {
        _id: j._id,
        calendarEventId: j.calendarEventId,
        disciplineId: j.disciplineId,
        disciplineName: rup?.moduleName || rup?.learningOutcome || "Дисциплина",
        moduleIndex: rup?.moduleIndex || "",
        groupName: j.groupName || "",
        course: (rup?.baseClass && rup.baseClass.length > 0 ? String(rup.baseClass[0]) : "1"),
        teacherId: teacherId || "",
        teacherName: teacherFullName,
        academicYearId: j.academicYearId,
        semesterId: j.semesterId,
        studentCount: studentCountMap.get(j._id) || 0,
        isIndividualJournal: j.isIndividualJournal || false,
        isMixedGroup: j.isMixedGroup || false,
        mergedJournalIds: j.mergedJournalIds || event?.mergedJournalIds || [],
        parentIndividualJournalId: j.parentIndividualJournalId || event?.parentIndividualJournalId,
        color: event?.color,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      };
    });

    let filtered = enriched;
    if (args.teacherId && args.teacherId !== "all") {
      filtered = filtered.filter((j) => j.teacherId === args.teacherId);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.disciplineName.toLowerCase().includes(q) ||
          j.groupName.toLowerCase().includes(q) ||
          j.teacherName.toLowerCase().includes(q)
      );
    }

    return filtered;
  },
});
