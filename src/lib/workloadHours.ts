// Pure hours-arithmetic logic extracted verbatim from
// src/pages/WorkloadManagement.vue (Phase 0 of the array-migration).
//
// These functions intentionally preserve the CURRENT behavior of the
// original inline implementations, including known quirks/bugs — see the
// comments below and the characterization tests in
// src/lib/__tests__/workloadHours.spec.ts. Do NOT "fix" anything here
// without updating the tests to match the new intended behavior first.

import type { WorkloadItem } from "@/types/workload";
import type { RupEntry } from "@/types/rup-entry";
import { DEFAULT_SEMESTER_WEEKS } from "@/types/academic-year-semester";

/**
 * Verbatim from WorkloadManagement.vue `formatHours(val)`.
 */
export function formatHours(val: unknown): number | string {
  const n = parseFloat((val as string) || "0");
  return Number.isInteger(n) ? n : n.toFixed(1);
}

/**
 * Verbatim body of WorkloadManagement.vue `recalculateItem(id)`, minus the
 * store lookup (caller passes the item directly). Mutates `item` in place
 * and returns it.
 */
export function recalcWorkloadItem(item: WorkloadItem, semesterCount: number): WorkloadItem {
  let total = 0;
  for (let i = 1; i <= semesterCount; i++) {
    const weeks = parseFloat((item[`weeks${i}`] as string) || "0");
    const hours = parseFloat((item[`hours${i}`] as string) || "0");
    const groupCount = parseFloat((item[`groupCount${i}`] as string) || "0");

    const hoursPerGroup = weeks * hours;
    item[`hoursPerGroup${i}`] = hoursPerGroup.toString();
    total += hoursPerGroup * groupCount;
  }

  item.totalHours = Math.round(total);
  return item;
}

/**
 * Verbatim from WorkloadManagement.vue `totalCurrentWorkloadHours` computed.
 */
export function computeWorkloadTotal(items: WorkloadItem[]): number {
  // Number() coerces legacy string totalHours during the union transition
  // (Pattern A) so the footer sums numerically instead of concatenating.
  return items.reduce((sum, item) => sum + (Number(item.totalHours) || 0), 0);
}

/**
 * Verbatim from WorkloadManagement.vue `hasIndividual(rup)` (pure — reads
 * only rup fields).
 */
export function hasIndividual(rup: RupEntry): boolean {
  return individualTotal(rup) > 0;
}

/**
 * Verbatim from WorkloadManagement.vue `individualTotal(rup)` (private
 * helper used by hasIndividual).
 */
function individualTotal(rup: RupEntry): number {
  const distSum = (rup.distributionEntries || []).reduce(
    (sum, d) => sum + (parseFloat(d.individualHours || "0") || 0),
    0
  );
  if (distSum > 0) return distSum;
  const additional = parseFloat(rup.individualAdditionalHours || "0") || 0;
  if (additional > 0) return additional;
  return parseFloat(rup.individualHours || "0") || 0;
}

export interface SeedWorkloadItemsOpts {
  department: string;
  language?: string;
  individual?: boolean;
  specialtyIds: string[];
  semesterCount: number;
  /**
   * Teaching weeks per semester number (1-based): `{ 1: 18, 2: 20, 3: 18 }`.
   * Sourced from `academicYearSemesters.weeksCount` by the caller. Missing
   * entries fall back to DEFAULT_SEMESTER_WEEKS — previously semesters 1/2
   * were hardcoded to 18/20 and 3+ got nothing, which silently zeroed their
   * hours (audit defect #1).
   */
  semesterWeeks?: Record<number, number>;
  idFactory?: () => string;
}

/** Weeks for a semester number: explicit config → shared default. */
function weeksForSemester(
  semNum: number,
  semesterWeeks?: Record<number, number>
): string {
  const configured = semesterWeeks?.[semNum];
  return String(
    typeof configured === "number" && configured > 0
      ? configured
      : DEFAULT_SEMESTER_WEEKS
  );
}

/**
 * Building logic extracted verbatim from
 * WorkloadManagement.vue `addSubjectFromRup(rup, opts)`. Does not touch any
 * store — `department` (formerly `getSpecialtyCodes(chosenSpecs)`) and
 * `specialtyIds` are passed in by the caller. Returns the array of items to
 * push (main row, plus an optional `_ind` row) in the same order the
 * original pushed them.
 */
export function seedWorkloadItemsFromRup(rup: RupEntry, opts: SeedWorkloadItemsOpts): WorkloadItem[] {
  const idFactory = opts.idFactory ?? (() => crypto.randomUUID());
  const semesterCount = opts.semesterCount;
  const result: WorkloadItem[] = [];

  const newItem: WorkloadItem = {
    id: idFactory(),
    subjectId: rup.id,
    department: opts.department,
    specialtyIds: opts.specialtyIds,
    course: "1", // Fallback, could be derived
    studentCount: "0",
    // weeks1/weeks2 are required by the WorkloadItem type; seeded from config
    // like every other semester (the loop below covers 3+ and re-applies these).
    weeks1: weeksForSemester(1, opts.semesterWeeks),
    weeks2: weeksForSemester(2, opts.semesterWeeks),
    hours1: "0",
    hours2: "0",
    hoursPerGroup1: "0",
    hoursPerGroup2: "0",
    groupCount1: "1",
    groupCount2: "1",
    totalHours: 0,
    index: rup.moduleIndex,
    description: rup.moduleName,
    language: opts.language || rup.language || "ru",
  };

  // Weeks for EVERY semester of the year, from the semesters' configured
  // weeksCount. Previously only weeks1/weeks2 existed (hardcoded 18/20), so a
  // third semester's hours were recalculated against weeks3 = 0 and silently
  // vanished (audit defect #1).
  for (let i = 1; i <= semesterCount; i++) {
    newItem[`weeks${i}`] = weeksForSemester(i, opts.semesterWeeks);
    if (newItem[`hours${i}`] === undefined) newItem[`hours${i}`] = "0";
    if (newItem[`hoursPerGroup${i}`] === undefined) newItem[`hoursPerGroup${i}`] = "0";
    if (newItem[`groupCount${i}`] === undefined) newItem[`groupCount${i}`] = "1";
  }

  // Set initial hours from distribution entries if available
  rup.distributionEntries.forEach((entry, idx) => {
    const semNum = idx + 1;
    if (semNum <= semesterCount) {
      newItem[`hoursPerGroup${semNum}`] = entry.hours || "0";
      const weeks = parseFloat(newItem[`weeks${semNum}`] as string) || 1;
      newItem[`hours${semNum}`] = (parseFloat(entry.hours || "0") / weeks).toString();
    }
  });

  result.push(newItem);
  recalcWorkloadItem(newItem, semesterCount);

  // Paired individual-hours child row (excluded from journal wizard & counts).
  if (opts.individual && hasIndividual(rup)) {
    const indItem: WorkloadItem = {
      id: `${newItem.id}_ind`,
      subjectId: rup.id,
      department: "Индивидуальные",
      course: newItem.course,
      studentCount: newItem.studentCount,
      weeks1: weeksForSemester(1, opts.semesterWeeks),
      weeks2: weeksForSemester(2, opts.semesterWeeks),
      hours1: "0",
      hours2: "0",
      hoursPerGroup1: "0",
      hoursPerGroup2: "0",
      groupCount1: "0",
      groupCount2: "0",
      totalHours: 0,
      index: rup.moduleIndex,
      description: "",
      language: newItem.language,
    };
    for (let i = 1; i <= semesterCount; i++) {
      indItem[`weeks${i}`] = weeksForSemester(i, opts.semesterWeeks);
      if (indItem[`hours${i}`] === undefined) indItem[`hours${i}`] = "0";
      if (indItem[`hoursPerGroup${i}`] === undefined) indItem[`hoursPerGroup${i}`] = "0";
      if (indItem[`groupCount${i}`] === undefined) indItem[`groupCount${i}`] = "0";
    }
    // Per-semester individual hours from the RUP distribution.
    let filledFromDist = false;
    rup.distributionEntries.forEach((entry, idx) => {
      const semNum = idx + 1;
      if (semNum > semesterCount) return;
      const ih = parseFloat(entry.individualHours || "0") || 0;
      if (ih > 0) {
        filledFromDist = true;
        indItem[`hoursPerGroup${semNum}`] = String(ih);
        indItem[`groupCount${semNum}`] = "1";
        const weeks = parseFloat((indItem[`weeks${semNum}`] as string) || "1") || 1;
        indItem[`hours${semNum}`] = (ih / weeks).toString();
      }
    });
    // Fallback: no per-semester individualHours, but the RUP entry carries a
    // top-level individualAdditionalHours / individualHours. Distribute evenly
    // across the semesters the subject actually runs in (those with hours > 0).
    if (!filledFromDist) {
      const fallback =
        parseFloat(rup.individualAdditionalHours || "0") || parseFloat(rup.individualHours || "0") || 0;
      if (fallback > 0) {
        const activeSemesters: number[] = [];
        rup.distributionEntries.forEach((entry, idx) => {
          const semNum = idx + 1;
          if (semNum > semesterCount) return;
          if ((parseFloat(entry.hours || "0") || 0) > 0) activeSemesters.push(semNum);
        });
        // If no distribution rows have hours (edge case), spread across all semesters.
        const targetSemesters = activeSemesters.length
          ? activeSemesters
          : Array.from({ length: semesterCount }, (_, i) => i + 1);
        const per = fallback / targetSemesters.length;
        for (const semNum of targetSemesters) {
          indItem[`hoursPerGroup${semNum}`] = String(per);
          indItem[`groupCount${semNum}`] = "1";
          const weeks = parseFloat((indItem[`weeks${semNum}`] as string) || "1") || 1;
          indItem[`hours${semNum}`] = (per / weeks).toString();
        }
      }
    }
    let indTotal = 0;
    for (let i = 1; i <= semesterCount; i++) {
      indTotal += parseFloat((indItem[`hoursPerGroup${i}`] as string) || "0") * parseFloat((indItem[`groupCount${i}`] as string) || "0");
    }
    indItem.totalHours = Math.round(indTotal);
    result.push(indItem);
  }

  return result;
}
