// Pure hours-arithmetic logic for workload items.
//
// Keyed strictly by `semesterId` via `item.semesters[]` (Phase 5 of array migration).
// See MIGRATION-workload-array-plan-v4.md.

import type { WorkloadItem, WorkloadSemesterEntry } from "@/types/workload";
import type { RupEntry } from "@/types/rup-entry";
import { DEFAULT_SEMESTER_WEEKS } from "@/types/academic-year-semester";

/** A year's semester, as needed to seed a workload item's per-semester data. */
export interface YearSemesterRef {
  semesterId: string;
  number: number;
  weeks?: number;
}

/**
 * Format hours for display (removes trailing .0 for integers).
 */
export function formatHours(val: unknown): number | string {
  const n = parseFloat((val as string) || "0");
  if (!Number.isFinite(n) || isNaN(n)) return 0;
  return Number.isInteger(n) ? n : (Math.round(n * 10) / 10).toString();
}

/** Find an item's array entry for a given semester (undefined if absent). */
export function findSemesterEntry(
  item: WorkloadItem,
  semesterId: string
): WorkloadSemesterEntry | undefined {
  return item.semesters?.find((s) => s.semesterId === semesterId);
}

/** Hours contributed per group by one semester entry: weeks * hours-per-week. */
export function hoursPerGroup(e: WorkloadSemesterEntry): number {
  return e.weeks * e.hours;
}

/**
 * Recomputes `item.totalHours` by summing `hoursPerGroup(entry) * entry.groupCount`
 * across all entries in `item.semesters`.
 *
 * Rounding order: accumulate exact hours across ALL entries, then Math.round
 * the SUM once — never per-semester.
 */
export function recalcWorkloadItem(item: WorkloadItem): WorkloadItem {
  let total = 0;
  if (item.semesters) {
    for (const e of item.semesters) {
      total += hoursPerGroup(e) * e.groupCount;
    }
  }
  item.totalHours = Math.round(total);
  return item;
}

/**
 * Total hours for an entire workload.
 */
export function computeWorkloadTotal(items: WorkloadItem[]): number {
  return items.reduce((sum, item) => sum + (Number(item.totalHours) || 0), 0);
}

/**
 * True if RUP entry has individual hours.
 */
export function hasIndividual(rup: RupEntry): boolean {
  return individualTotal(rup) > 0;
}

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
  yearSemesters: YearSemesterRef[];
  idFactory?: () => string;
}

function weeksFor(ref: YearSemesterRef): number {
  return typeof ref.weeks === "number" && ref.weeks > 0 ? ref.weeks : DEFAULT_SEMESTER_WEEKS;
}

/**
 * Building logic for adding subjects from RUP.
 *
 * RUP distribution entries are attached to the matching semester by `entry.semesterId`.
 */
export function seedWorkloadItemsFromRup(rup: RupEntry, opts: SeedWorkloadItemsOpts): WorkloadItem[] {
  const idFactory = opts.idFactory ?? (() => crypto.randomUUID());
  const yearSemesters = [...opts.yearSemesters].sort((a, b) => a.number - b.number);
  const yearSemesterIds = new Set(yearSemesters.map((r) => r.semesterId));
  const result: WorkloadItem[] = [];

  const mainId = idFactory();
  const semesters: WorkloadSemesterEntry[] = yearSemesters.map((ref) => ({
    semesterId: ref.semesterId,
    weeks: weeksFor(ref),
    hours: 0,
    groupCount: 1,
  }));
  const byId = new Map(semesters.map((s) => [s.semesterId, s]));

  const newItem: WorkloadItem = {
    id: mainId,
    subjectId: rup.id,
    department: opts.department,
    specialtyIds: opts.specialtyIds,
    course: "1",
    studentCount: "0",
    semesters,
    totalHours: 0,
    index: rup.moduleIndex,
    description: rup.moduleName,
    language: opts.language || rup.language || "ru",
  };

  // Set initial hours from distribution entries bound by semesterId
  for (const entry of rup.distributionEntries) {
    if (!yearSemesterIds.has(entry.semesterId)) {
      console.warn(
        `[workloadHours] seedWorkloadItemsFromRup: dropping distributionEntries entry (id=${entry.id}) — ` +
          `semesterId=${entry.semesterId} does not belong to the selected year`
      );
      continue;
    }
    const target = byId.get(entry.semesterId);
    if (!target) continue;
    const hrs = parseFloat(entry.hours || "0") || 0;
    target.hours = target.weeks > 0 ? hrs / target.weeks : 0;
  }

  recalcWorkloadItem(newItem);
  result.push(newItem);

  // Paired individual-hours child row (excluded from journal wizard & counts).
  if (opts.individual && hasIndividual(rup)) {
    const indSemesters: WorkloadSemesterEntry[] = yearSemesters.map((ref) => ({
      semesterId: ref.semesterId,
      weeks: weeksFor(ref),
      hours: 0,
      groupCount: 0,
    }));
    const indById = new Map(indSemesters.map((s) => [s.semesterId, s]));

    const indItem: WorkloadItem = {
      id: `${mainId}_ind`,
      subjectId: rup.id,
      department: "Индивидуальные",
      course: newItem.course,
      studentCount: newItem.studentCount,
      semesters: indSemesters,
      totalHours: 0,
      index: rup.moduleIndex,
      description: "",
      language: newItem.language,
    };

    let filledFromDist = false;
    for (const entry of rup.distributionEntries) {
      if (!yearSemesterIds.has(entry.semesterId)) continue;
      const target = indById.get(entry.semesterId);
      if (!target) continue;
      const ih = parseFloat(entry.individualHours || "0") || 0;
      if (ih > 0) {
        filledFromDist = true;
        target.groupCount = 1;
        target.hours = target.weeks > 0 ? ih / target.weeks : 0;
      }
    }

    if (!filledFromDist) {
      const fallback =
        parseFloat(rup.individualAdditionalHours || "0") || parseFloat(rup.individualHours || "0") || 0;
      if (fallback > 0) {
        const activeIds = new Set<string>();
        for (const entry of rup.distributionEntries) {
          if (!yearSemesterIds.has(entry.semesterId)) continue;
          if ((parseFloat(entry.hours || "0") || 0) > 0) activeIds.add(entry.semesterId);
        }
        const targets = activeIds.size
          ? indSemesters.filter((s) => activeIds.has(s.semesterId))
          : indSemesters;
        const per = targets.length ? fallback / targets.length : 0;
        for (const t of targets) {
          t.groupCount = 1;
          t.hours = t.weeks > 0 ? per / t.weeks : 0;
        }
      }
    }

    recalcWorkloadItem(indItem);
    result.push(indItem);
  }

  return result;
}
