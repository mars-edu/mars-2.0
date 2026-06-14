import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { createTimestamps, updateTimestamp } from "../lib/validators";
import {
  itemsNeedingJournals,
  semesterValue,
  splitIntoGroups,
  filterEligibleStudents,
  type SemesterNumber,
} from "./lib";

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
    items: v.array(
      v.object({
        id: v.string(),
        subjectId: v.string(),
        department: v.string(),
        course: v.string(),
        studentCount: v.string(),
        weeks1: v.string(),
        weeks2: v.string(),
        weeks3: v.optional(v.string()),
        hours1: v.string(),
        hours2: v.string(),
        hours3: v.optional(v.string()),
        hoursPerGroup1: v.string(),
        hoursPerGroup2: v.string(),
        hoursPerGroup3: v.optional(v.string()),
        groupCount1: v.string(),
        groupCount2: v.string(),
        groupCount3: v.optional(v.string()),
        totalHours: v.string(),
        teacherName: v.optional(v.string()),
        index: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
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
 * Bulk-create draft journals (and their backing calendar events) from a saved
 * workload for one semester. Ported from concept's workload→journal wizard:
 *  - one journal per planned group (groupCount) for every real discipline line
 *  - students auto-matched by the discipline's specialties (+ language) and
 *    split round-robin across the groups
 *  - events are created as drafts (no weekly schedule) — the teacher fills the
 *    timetable later in the calendar, which is where mars computes lesson hours.
 * Marks the workload as journalsCreated. Branching logic lives in ./lib.
 */
export const createJournalsFromWorkload = mutation({
  args: {
    workloadId: v.id("workloads"),
    semester: v.number(),
  },
  handler: async (ctx, args) => {
    const workload = await ctx.db.get(args.workloadId);
    if (!workload) throw new Error("Нагрузка не найдена");

    const semester = args.semester as SemesterNumber;

    // Resolve the academic-year semester record (sorted by startDate → 1,2,3).
    const semesters = await ctx.db
      .query("academicYearSemesters")
      .withIndex("by_academicYear", (q) =>
        q.eq("academicYearId", workload.academicYearId as Id<"academicYears">)
      )
      .collect();
    semesters.sort((a, b) => a.startDate.localeCompare(b.startDate));
    const semesterRecord = semesters[semester - 1];
    if (!semesterRecord) throw new Error("Семестр не найден для учебного года");

    // Students of this academic year, fetched once and matched per discipline.
    const yearStudents = await ctx.db
      .query("students")
      .withIndex("by_academicYear", (q) =>
        q.eq("academicYearId", workload.academicYearId)
      )
      .collect();
    const studentLikes = yearStudents.map((s) => ({
      id: s._id as string,
      specialty: s.specialty,
      status: s.status,
      language: s.language,
    }));

    // rupEntries reference specialties by Convex _id, but students reference
    // them by legacyId. Build a _id → legacyId map so we can match on both.
    const specialties = await ctx.db.query("specialties").collect();
    const legacyBySpecialtyId = new Map<string, string | undefined>(
      specialties.map((s) => [s._id as string, s.legacyId])
    );

    let eventsCreated = 0;
    let journalsCreated = 0;

    for (const item of itemsNeedingJournals(workload.items, semester)) {
      // subjectId is normally a rupEntries id; tolerate legacy/non-rup ids.
      let rupEntry: any = null;
      try {
        rupEntry = await ctx.db.get(item.subjectId as Id<"rupEntries">);
      } catch {
        rupEntry = null;
      }
      const specialtyIds: string[] = rupEntry?.specialtyIds ?? [];
      const language = rupEntry?.language;
      const groupName = rupEntry?.moduleName ?? item.description ?? "";

      // Match students by either id form (Convex _id or legacy UUID).
      const specialtyKeys: string[] = [];
      for (const sid of specialtyIds) {
        specialtyKeys.push(sid);
        const legacy = legacyBySpecialtyId.get(sid);
        if (legacy) specialtyKeys.push(legacy);
      }

      const eligible = filterEligibleStudents(
        studentLikes,
        specialtyKeys,
        language
      ).map((s) => s.id);

      const groupCount =
        parseInt(semesterValue(item, semester, "groupCount")) || 1;
      const groups = splitIntoGroups(eligible, groupCount);

      for (let g = 0; g < groups.length; g++) {
        const participants = groups[g];

        const calendarEventId = await ctx.db.insert("calendarEvents", {
          rupEntryId: item.subjectId,
          teacherId: workload.teacherId as string | undefined,
          startDate: semesterRecord.startDate,
          endDate: semesterRecord.endDate,
          participants,
          semester: semesterRecord._id,
          useCustomPeriod: false,
          ...createTimestamps(),
        });
        eventsCreated++;

        const journalId = await ctx.db.insert("journals", {
          calendarEventId,
          disciplineId: item.subjectId,
          groupName: groups.length > 1 ? `${groupName} — гр. ${g + 1}` : groupName,
          academicYearId: workload.academicYearId,
          semesterId: semesterRecord._id,
          ...createTimestamps(),
        });
        journalsCreated++;

        for (const studentId of participants) {
          await ctx.db.insert("journalStudents", {
            journalId,
            studentId,
            createdAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.workloadId, {
      journalsCreated: true,
      ...updateTimestamp(),
    });

    return { eventsCreated, journalsCreated };
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
