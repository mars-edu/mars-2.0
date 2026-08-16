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
 * One semester's slice of a workload item — the target model replacing the 24
 * flat `weeks{N}` / `hours{N}` / `hoursPerGroup{N}` / `groupCount{N}` fields.
 *
 * Keyed by `semesterId`, not by position: the flat model encoded the semester
 * as a NUMBER IN THE FIELD NAME, so a row's meaning depended on sort order,
 * and semesters beyond the two hardcoded slots silently lost their hours.
 * Every other table in the schema already references a semester by id.
 *
 * `hoursPerGroup` is deliberately absent — it is `weeks * hours`, and storing
 * a derived value is exactly what let the stored copy drift from its inputs.
 *
 * Array order carries no meaning; display sorts by `semesterDefinition.number`.
 *
 * Phase 1 (this commit) adds it as optional alongside the flat fields — nothing
 * writes it yet. See MIGRATION-workload-array-plan-v4.md for the phase plan.
 */
export const workloadSemesterEntryValidator = v.object({
  semesterId: v.id("academicYearSemesters"),
  weeks: v.number(),
  hours: v.number(), // hours per week
  groupCount: v.number(),
});

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

  /**
   * Target per-semester model (expand phase). Optional while the flat fields
   * above remain the source of truth — nothing writes this yet; Phase 2
   * backfills it, Phase 3 switches readers, Phase 5 drops the flat 24.
   */
  semesters: v.optional(v.array(workloadSemesterEntryValidator)),

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
