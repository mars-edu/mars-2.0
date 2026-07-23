import { defineTable } from "convex/server";
import { v } from "convex/values";
import { workloadItemValidator } from "./workloadItem";

export const workloadsTables = {
  /**
   * Workload management records
   * Ported from: concept/components/WorkloadView.tsx
   */
  workloads: defineTable({
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.string(), // Keep for display/fallback
    academicYearId: v.string(), // academic year ID reference
    totalHours: v.number(),
    items: v.array(workloadItemValidator),
    // Workflow status (ported from concept SavedWorkload flags)
    journalsCreated: v.optional(v.boolean()),
    // Semester numbers (1/2) that already have journals generated.
    journalsCreatedSemesters: v.optional(v.array(v.number())),
    addedToSchedule: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_teacher", ["teacherId"]),
};
