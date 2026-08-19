import { mutation } from "../functions";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { createTimestamps, updateTimestamp } from "../lib/validators";
import { workloadItemValidator } from "../schema/workloadItem";

/**
 * Save a workload (create or update)
 */
export const save = mutation({
  args: {
    id: v.optional(v.id("workloads")),
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.string(),
    academicYearId: v.id("academicYears"),
    totalHours: v.number(),
    items: v.array(workloadItemValidator),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    
    if (id) {
      // Update existing
      await ctx.db.patch(id, {
        ...data,
        });
      return id;
    } else {
      // Create new
      return await ctx.db.insert("workloads", {
        ...data,
        });
    }
  },
});

/**
 * Delete a workload
 */
/**
 * Delete a workload. BLOCKS if journals generated from it still exist
 * (workloads own the journals via `by_workload` back-ref) — silently
 * cascading would destroy teachers' grade books. Caller must explicitly
 * detach/delete the journals first (or use the wizard's regenerate flow).
 */
export const remove = mutation({
  args: { id: v.id("workloads") },
  handler: async (ctx, args) => {
    const workloadIdStr = args.id as unknown as string;
    const journals = await ctx.db
      .query("journals")
      .withIndex("by_workload", (q) => q.eq("workloadId", workloadIdStr))
      .collect();
    if (journals.length > 0) {
      throw new ConvexError({
        code: "WORKLOAD_HAS_JOURNALS",
        message: "Нагрузка используется — сначала удалите созданные из неё журналы",
        references: { journals: journals.length },
      });
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Create journals from a saved workload using groups the user assembled in the
 * interactive wizard. Each group carries its explicitly chosen students and a
 * weekly schedule (validated client-side: scheduled hours == planned
 * hoursPerGroup). Faithful port of concept's workload→journal wizard, mapped to
 * mars's calendarEvent + weeklySchedules model.
 *
 * Idempotent: existing journals (and their events + student links) generated
 * from this workload are dropped first, so re-running replaces rather than
 * duplicates.
 */
export const createJournalsFromWorkloadGroups = mutation({
  args: {
    workloadId: v.id("workloads"),
    // Canonical path (Phase 3+): the wizard resolves and passes the semester
    // record's id directly — no ordinal, no sorting.
    semesterId: v.optional(v.id("academicYearSemesters")),
    // Legacy path: the ordinal (1-based) into the year's semesters, sorted by
    // `semesterDefinition.number`. Kept optional and accepted alongside
    // `semesterId` so the mutation stays callable by the still-deployed old
    // frontend while GitHub Actions is blocked on billing (Convex backend
    // ships ahead of the frontend bundle). Remove once Phase 4/5 retires the
    // old frontend for good.
    semester: v.optional(v.number()),
    groups: v.array(
      v.object({
        subjectId: v.string(),
        groupName: v.optional(v.string()),
        studentIds: v.array(v.string()),
        weeklySchedules: v.array(
          v.object({
            weekId: v.number(),
            startId: v.optional(v.string()),
            endId: v.optional(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const workload = await ctx.db.get(args.workloadId);
    if (!workload) throw new Error("Нагрузка не найдена");

    // Resolve the academic-year semester record.
    let semesterRecord: Doc<"academicYearSemesters"> | null = null;
    if (args.semesterId !== undefined) {
      // Canonical path: the wizard already knows the semester's id — no
      // sorting, no ordinal, no ambiguity.
      semesterRecord = await ctx.db.get(args.semesterId);
    } else if (args.semester !== undefined) {
      // Legacy ordinal fallback (still-deployed old frontend). Ordering is
      // the canonical `semesterDefinition.number` join — NOT the old
      // startDate.localeCompare sort, which is the same defect-#2 sibling
      // fixed everywhere else in this migration. On prod, with exactly two
      // semesters per year, both orderings agree, so no data rekey is needed.
      const semesters = await ctx.db
        .query("academicYearSemesters")
        .withIndex("by_academicYear", (q) =>
          q.eq("academicYearId", workload.academicYearId as Id<"academicYears">)
        )
        .collect();
      const withNumbers = await Promise.all(
        semesters.map(async (s) => ({
          semester: s,
          number: (await ctx.db.get(s.semesterDefinitionId))?.number ?? 0,
        }))
      );
      withNumbers.sort((a, b) => a.number - b.number);
      semesterRecord = withNumbers[args.semester - 1]?.semester ?? null;
    } else {
      throw new ConvexError({
        code: "MISSING_SEMESTER",
        message: "Не указан семестр: требуется semesterId либо semester",
      });
    }
    if (!semesterRecord) throw new Error("Семестр не найден для учебного года");

    // Idempotency: drop journals previously generated from this workload FOR
    // THIS SEMESTER only (plus their calendar events and student links) — so
    // regenerating semester 1 does not wipe semester 2's journals.
    const existing = (
      await ctx.db
        .query("journals")
        .withIndex("by_workload", (q) =>
          q.eq("workloadId", args.workloadId as string)
        )
        .collect()
    ).filter((j) => j.semesterId === semesterRecord._id);
    for (const j of existing) {
      const links = await ctx.db
        .query("journalStudents")
        .withIndex("by_journal", (q) => q.eq("journalId", j._id))
        .collect();
      for (const link of links) await ctx.db.delete(link._id);
      // Cascade marks + history so regeneration does not orphan graded rows
      // (mirrors the canonical journals.remove delete path).
      const oldMarks = await ctx.db
        .query("marks")
        .withIndex("by_journal", (q) => q.eq("journalId", j._id))
        .collect();
      for (const m of oldMarks) await ctx.db.delete(m._id);
      const oldHistory = await ctx.db
        .query("markHistory")
        .withIndex("by_journal", (q) => q.eq("journalId", j._id))
        .collect();
      for (const h of oldHistory) await ctx.db.delete(h._id);
      if (j.calendarEventId) {
        try {
          await ctx.db.delete(j.calendarEventId as Id<"calendarEvents">);
        } catch {
          /* event already gone */
        }
      }
      await ctx.db.delete(j._id);
    }

    let journalsCreated = 0;
    for (const g of args.groups) {
      // Dedup defensively: duplicate (journalId, studentId) rows would break
      // downstream .unique() queries on by_journal_student.
      const studentIds = [...new Set(g.studentIds)];
      const calendarEventId = await ctx.db.insert("calendarEvents", {
        rupEntryId: g.subjectId as Id<"rupEntries">,
        teacherId: workload.teacherId as string | undefined,
        startDate: semesterRecord.startDate,
        endDate: semesterRecord.endDate,
        participants: studentIds,
        semester: semesterRecord._id,
        useCustomPeriod: false,
        weeklySchedules: g.weeklySchedules,
        });

      const journalId = await ctx.db.insert("journals", {
        calendarEventId,
        disciplineId: g.subjectId as Id<"rupEntries">,
        groupName: g.groupName,
        academicYearId: workload.academicYearId,
        semesterId: semesterRecord._id,
        workloadId: args.workloadId as string,
        });
      journalsCreated++;

      for (const studentId of studentIds) {
        await ctx.db.insert("journalStudents", {
          journalId,
          studentId,
          });
      }
    }

    // Track which semesters have journals (union add / remove for this run).
    // `journalsCreatedSemesters` stays `number[]` keyed by the canonical
    // `semesterDefinition.number` (plan §4.3.6) — resolved via the definition
    // join, not stored as semesterIds, regardless of which arg shape the
    // caller used to identify the semester.
    const semesterDefinition = await ctx.db.get(semesterRecord.semesterDefinitionId);
    const semesterNumber = semesterDefinition?.number;
    if (semesterNumber === undefined) {
      throw new Error("Не удалось определить номер семестра");
    }
    const prevSemesters = (workload.journalsCreatedSemesters ?? []).filter(
      (s) => s !== semesterNumber
    );
    const createdSemesters =
      journalsCreated > 0 ? [...prevSemesters, semesterNumber] : prevSemesters;
    createdSemesters.sort((a, b) => a - b);

    await ctx.db.patch(args.workloadId, {
      journalsCreated: createdSemesters.length > 0,
      journalsCreatedSemesters: createdSemesters,
      });

    return { journalsCreated };
  },
});

/**
 * Toggle the "added to schedule" workflow flag on a workload.
 */
export const setAddedToSchedule = mutation({
  args: { id: v.id("workloads"), value: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      addedToSchedule: args.value,
      });
    return { success: true };
  },
});
