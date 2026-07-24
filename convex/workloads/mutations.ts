import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
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
    academicYearId: v.string(),
    totalHours: v.number(),
    items: v.array(workloadItemValidator),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    
    if (id) {
      // Update existing
      await ctx.db.patch(id, {
        ...data,
        ...updateTimestamp(),
      });
      return id;
    } else {
      // Create new
      return await ctx.db.insert("workloads", {
        ...data,
        ...createTimestamps(),
      });
    }
  },
});

/**
 * Delete a workload
 */
export const remove = mutation({
  args: { id: v.id("workloads") },
  handler: async (ctx, args) => {
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
    semester: v.number(),
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

    // Resolve the academic-year semester record (sorted by startDate → 1,2,3).
    const semesters = await ctx.db
      .query("academicYearSemesters")
      .withIndex("by_academicYear", (q) =>
        q.eq("academicYearId", workload.academicYearId as Id<"academicYears">)
      )
      .collect();
    semesters.sort((a, b) => a.startDate.localeCompare(b.startDate));
    const semesterRecord = semesters[args.semester - 1];
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
        rupEntryId: g.subjectId,
        teacherId: workload.teacherId as string | undefined,
        startDate: semesterRecord.startDate,
        endDate: semesterRecord.endDate,
        participants: studentIds,
        semester: semesterRecord._id,
        useCustomPeriod: false,
        weeklySchedules: g.weeklySchedules,
        ...createTimestamps(),
      });

      const journalId = await ctx.db.insert("journals", {
        calendarEventId,
        disciplineId: g.subjectId,
        groupName: g.groupName,
        academicYearId: workload.academicYearId,
        semesterId: semesterRecord._id,
        workloadId: args.workloadId as string,
        ...createTimestamps(),
      });
      journalsCreated++;

      for (const studentId of studentIds) {
        await ctx.db.insert("journalStudents", {
          journalId,
          studentId,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Track which semesters have journals (union add / remove for this run).
    const prevSemesters = (workload.journalsCreatedSemesters ?? []).filter(
      (s) => s !== args.semester
    );
    const createdSemesters =
      journalsCreated > 0 ? [...prevSemesters, args.semester] : prevSemesters;
    createdSemesters.sort((a, b) => a - b);

    await ctx.db.patch(args.workloadId, {
      journalsCreated: createdSemesters.length > 0,
      journalsCreatedSemesters: createdSemesters,
      ...updateTimestamp(),
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
      ...updateTimestamp(),
    });
    return { success: true };
  },
});
