import { v } from "convex/values";

/**
 * Maximum number of per-semester hour columns a workload item can carry.
 *
 * The workload table stores per-semester data as FLAT numbered fields
 * (weeks1..weeksN, hours1..hoursN, hoursPerGroup1..N, groupCount1..N).
 * Semesters 1-2 are always present; 3..MAX are optional.
 *
 * `semesterCount` on the workload page is driven by how many
 * `academicYearSemesters` a year has. If that ever exceeds this cap, the page
 * must refuse to save (see the guard in WorkloadManagement.vue) rather than
 * emit extra keys the validator would reject with ArgumentValidationError.
 *
 * NOTE: this flat-field shape is a known limitation — the proper model is a
 * per-semester array. Raising the cap here is purely additive (the new fields
 * are optional), so existing records stay valid and NO data migration is
 * required.
 */
export const MAX_WORKLOAD_SEMESTERS = 6;

/**
 * Shared validator for a single workload line item. Used by BOTH the
 * `workloads` schema table and the `workloads.save` mutation so the two can
 * never drift apart (they were previously duplicated literals limited to
 * semesters 1-3, which crashed saves for years with 4+ semesters).
 */
export const workloadItemValidator = v.object({
  id: v.string(),
  subjectId: v.string(), // Convex ID of the rupEntry or other source
  department: v.string(),
  course: v.string(),
  studentCount: v.string(),

  weeks1: v.string(),
  weeks2: v.string(),
  weeks3: v.optional(v.string()),
  weeks4: v.optional(v.string()),
  weeks5: v.optional(v.string()),
  weeks6: v.optional(v.string()),

  hours1: v.string(),
  hours2: v.string(),
  hours3: v.optional(v.string()),
  hours4: v.optional(v.string()),
  hours5: v.optional(v.string()),
  hours6: v.optional(v.string()),

  hoursPerGroup1: v.string(),
  hoursPerGroup2: v.string(),
  hoursPerGroup3: v.optional(v.string()),
  hoursPerGroup4: v.optional(v.string()),
  hoursPerGroup5: v.optional(v.string()),
  hoursPerGroup6: v.optional(v.string()),

  groupCount1: v.string(),
  groupCount2: v.string(),
  groupCount3: v.optional(v.string()),
  groupCount4: v.optional(v.string()),
  groupCount5: v.optional(v.string()),
  groupCount6: v.optional(v.string()),

  // TRANSITIONAL union (Pattern A expand-contract, see docs/migration-playbook.md):
  // prod holds legacy string totalHours; new writes are number. Run
  // migrations/workloads:totalHoursToNumber, then narrow to v.number().
  // (Long-term this derived field should not be stored at all — playbook Правило #0.)
  totalHours: v.union(v.string(), v.number()),
  teacherName: v.optional(v.string()),
  index: v.optional(v.string()),
  description: v.optional(v.string()),
  language: v.optional(v.string()),
  specialtyIds: v.optional(v.array(v.string())),
});
