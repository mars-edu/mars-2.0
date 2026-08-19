import { v } from "convex/values";

/**
 * One semester's slice of a workload item — the target model replacing the 24
 * flat `weeks{N}` / `hours{N}` / `hoursPerGroup{N}` / `groupCount{N}` fields.
 *
 * Keyed by `semesterId`, not by position.
 * `hoursPerGroup` is derived on the fly as `weeks * hours`.
 * Array order carries no meaning; display sorts by `semesterDefinition.number`.
 */
export const workloadSemesterEntryValidator = v.object({
  semesterId: v.id("academicYearSemesters"),
  weeks: v.number(),
  hours: v.number(), // hours per week
  groupCount: v.number(),
});

/**
 * Shared validator for a single workload line item. Used by BOTH the
 * `workloads` schema table and the `workloads.save` mutation.
 */
export const workloadItemValidator = v.object({
  id: v.string(),
  subjectId: v.string(), // Convex ID of the rupEntry or other source
  department: v.string(),
  course: v.string(),
  studentCount: v.string(),

  semesters: v.array(workloadSemesterEntryValidator),
  totalHours: v.number(),

  teacherName: v.optional(v.string()),
  index: v.optional(v.string()),
  description: v.optional(v.string()),
  language: v.optional(v.string()),
  specialtyIds: v.optional(v.array(v.string())),
});
