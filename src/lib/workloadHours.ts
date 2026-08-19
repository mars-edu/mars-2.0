// Pure hours-arithmetic logic extracted verbatim from
// src/pages/WorkloadManagement.vue (Phase 0 of the array-migration).
//
// These functions intentionally preserve the CURRENT behavior of the
// original inline implementations, including known quirks/bugs — see the
// comments below and the characterization tests in
// src/lib/__tests__/workloadHours.spec.ts. Do NOT "fix" anything here
// without updating the tests to match the new intended behavior first.
//
// Phase 3 (array-migration): `item.semesters[]` becomes the source of truth
// when present; the flat `weeks{N}`/`hours{N}`/`hoursPerGroup{N}`/
// `groupCount{N}` fields are kept in sync via `syncFlatFieldsFromSemesters`
// (dual-write) so not-yet-deployed readers and a Phase-3 rollback both see
// consistent numbers. See MIGRATION-workload-array-plan-v4.md §4 Фаза 3.

import type {
  WorkloadItem,
  WorkloadSemesterEntry,
  SemesterNumber,
  FlatWeeksKey,
  FlatHoursKey,
  FlatHoursPerGroupKey,
  FlatGroupCountKey,
} from "@/types/workload";
import type { RupEntry } from "@/types/rup-entry";
import { DEFAULT_SEMESTER_WEEKS } from "@/types/academic-year-semester";

/** A year's semester, as needed to seed/sync a workload item's per-semester data. */
export interface YearSemesterRef {
  semesterId: string;
  number: number;
  weeks?: number;
}

/**
 * Verbatim from WorkloadManagement.vue `formatHours(val)`.
 */
export function formatHours(val: unknown): number | string {
  const n = parseFloat((val as string) || "0");
  return Number.isInteger(n) ? n : n.toFixed(1);
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
 * Mirrors `item.semesters[]` into the legacy flat fields (`weeks{N}`,
 * `hours{N}`, `hoursPerGroup{N}`, `groupCount{N}`) for every ref, keyed by
 * `ref.semesterId` → written under `ref.number`. A semester with no matching
 * array entry writes zeros. This is the dual-write that keeps the flat
 * fields valid for not-yet-deployed readers and for a Phase-3 rollback; it
 * is removed in Phase 5.
 */
export function syncFlatFieldsFromSemesters(item: WorkloadItem, refs: YearSemesterRef[]): void {
  for (const ref of refs) {
    const num = ref.number as SemesterNumber;
    const e = findSemesterEntry(item, ref.semesterId);
    (item as Record<FlatWeeksKey, string | undefined>)[`weeks${num}`] = String(e?.weeks ?? 0);
    (item as Record<FlatHoursKey, string | undefined>)[`hours${num}`] = String(e?.hours ?? 0);
    (item as Record<FlatHoursPerGroupKey, string | undefined>)[`hoursPerGroup${num}`] = String(e ? hoursPerGroup(e) : 0);
    (item as Record<FlatGroupCountKey, string | undefined>)[`groupCount${num}`] = String(e?.groupCount ?? 0);
  }
}

/**
 * Recomputes `item.totalHours` (and, for the legacy path, the per-semester
 * `hoursPerGroup{i}` fields).
 *
 * Source of truth is `item.semesters` when present; falls back to the flat
 * `weeks{i}`/`hours{i}`/`groupCount{i}` fields for legacy rows (and tests)
 * that don't carry an array yet.
 *
 * Rounding order is a payroll-accuracy contract (characterization-tested):
 * accumulate `hoursPerGroup(entry) * entry.groupCount` across ALL entries
 * (including orphan `semesterId`s that no longer resolve to a semester of
 * the year — C1 policy: fail-visible, never silently dropped from the sum),
 * then `Math.round` the SUM once — never per-semester.
 *
 * When `refs` is given, dual-writes the flat fields afterwards via
 * `syncFlatFieldsFromSemesters`.
 */
export function recalcWorkloadItem(
  item: WorkloadItem,
  semesterCount: number,
  refs?: YearSemesterRef[]
): WorkloadItem {
  // `refs` is the caller's opt-in signal that it edits `semesters[]` (the
  // Phase-3 UI): only then is the array the source of truth, and the flat
  // fields get refreshed from it.
  //
  // Without refs the caller is the pre-Phase-3 UI editing flat fields
  // directly. Reading the array there would silently discard the user's edit
  // — seeding populates `semesters[]` from the start now — so the flat fields
  // stay authoritative and the array is simply left alone. It can go stale
  // that way, which is why the backfill migration is idempotent and must be
  // re-run right before the UI half of Phase 3 ships (see the runbook).
  //
  // Deliberately NOT mapping array entries back by position here: column N ↔
  // entry[N-1] is exactly the positional binding this migration exists to
  // remove (defect #2), and without refs there's no semesterId to map by.
  if (refs && refs.length > 0) {
    syncFlatFieldsFromSemesters(item, refs);
  }

  let total = 0;
  for (let i = 1; i <= semesterCount; i++) {
    const num = i as SemesterNumber;
    const weeks = parseFloat(((item as Record<FlatWeeksKey, string | undefined>)[`weeks${num}`] as string) || "0");
    const hours = parseFloat(((item as Record<FlatHoursKey, string | undefined>)[`hours${num}`] as string) || "0");
    const groupCount = parseFloat(((item as Record<FlatGroupCountKey, string | undefined>)[`groupCount${num}`] as string) || "0");

    const hpg = weeks * hours;
    (item as Record<FlatHoursPerGroupKey, string | undefined>)[`hoursPerGroup${num}`] = hpg.toString();
    total += hpg * groupCount;
  }

  // Orphan entries (semesterId no longer in the year) live outside the
  // numbered columns, so add their contribution explicitly — dropping it would
  // silently drift a payroll-adjacent total downward (C1: fail-visible).
  if (refs && refs.length > 0 && item.semesters?.length) {
    const known = new Set(refs.map((r) => r.semesterId));
    for (const e of item.semesters) {
      if (!known.has(e.semesterId)) total += hoursPerGroup(e) * e.groupCount;
    }
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
  /**
   * The selected academic year's semesters (id + 1-based `number` +
   * optional configured `weeks`), sourced from `academicYearSemesterStore`.
   * The seeded item's `semesters[]` gets an explicit entry for EVERY one of
   * these — "semester 3 was never initialized" (audit defect #1) is
   * structurally impossible.
   */
  yearSemesters: YearSemesterRef[];
  idFactory?: () => string;
}

function weeksFor(ref: YearSemesterRef): number {
  return typeof ref.weeks === "number" && ref.weeks > 0 ? ref.weeks : DEFAULT_SEMESTER_WEEKS;
}

/**
 * Building logic extracted (and reworked for the array model, Phase 3) from
 * WorkloadManagement.vue `addSubjectFromRup(rup, opts)`. Does not touch any
 * store — `department` and `specialtyIds` are passed in by the caller.
 * Returns the array of items to push (main row, plus an optional `_ind`
 * row) in the same order the original pushed them.
 *
 * RUP distribution entries are attached to the matching semester **by
 * `entry.semesterId`**, not by array position (audit defect #2, now dead):
 * an entry whose `semesterId` doesn't belong to the selected year's
 * semesters finds no target and is dropped, with a `console.warn` (closes
 * gap B1 — distribution rows belonging to another academic year no longer
 * silently bind to the wrong semester slot).
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
    course: "1", // Fallback, could be derived
    studentCount: "0",
    semesters,
    totalHours: 0,
    index: rup.moduleIndex,
    description: rup.moduleName,
    language: opts.language || rup.language || "ru",
  };

  // Set initial hours from distribution entries if available — bound by
  // semesterId, not by position.
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

  result.push(newItem);
  recalcWorkloadItem(newItem, yearSemesters.length, yearSemesters);

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

    // Per-semester individual hours from the RUP distribution, keyed by
    // semesterId (same binding fix as the main row).
    let filledFromDist = false;
    for (const entry of rup.distributionEntries) {
      if (!yearSemesterIds.has(entry.semesterId)) continue; // already warned above
      const target = indById.get(entry.semesterId);
      if (!target) continue;
      const ih = parseFloat(entry.individualHours || "0") || 0;
      if (ih > 0) {
        filledFromDist = true;
        target.groupCount = 1;
        target.hours = target.weeks > 0 ? ih / target.weeks : 0;
      }
    }

    // Fallback: no per-semester individualHours, but the RUP entry carries a
    // top-level individualAdditionalHours / individualHours. Distribute evenly
    // across the semesters the subject actually runs in (those with
    // distribution hours > 0); if none, spread across all semesters.
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

    recalcWorkloadItem(indItem, yearSemesters.length, yearSemesters);
    result.push(indItem);
  }

  return result;
}
