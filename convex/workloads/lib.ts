/**
 * Pure helpers for turning a saved workload into draft journals/calendar events.
 *
 * These encode the planning logic ported from concept-v3's workload→journal
 * wizard (semester filtering, group-count fan-out, student auto-match, group
 * split). The mutation layer orchestrates the DB; all branching logic lives
 * here so it can be unit-tested without a Convex harness.
 */

/** Mirrors `src/types/workload.ts` `WorkloadSemesterEntry` / the Convex validator. */
export interface WorkloadSemesterEntryLike {
  semesterId: string;
  weeks: number;
  hours: number; // hours per week
  groupCount: number;
}

export interface WorkloadItemLike {
  id: string;
  subjectId: string;
  course: string;
  department: string;
  studentCount: string;
  weeks1?: string;
  weeks2?: string;
  weeks3?: string;
  hours1?: string;
  hours2?: string;
  hours3?: string;
  hoursPerGroup1?: string;
  hoursPerGroup2?: string;
  hoursPerGroup3?: string;
  groupCount1?: string;
  groupCount2?: string;
  groupCount3?: string;
  /** Target per-semester model (Phase 3 dual-read); see the plan. */
  semesters?: WorkloadSemesterEntryLike[];
  totalHours: number;
  index?: string;
  description?: string;
  teacherName?: string;
}

export type SemesterNumber = 1 | 2 | 3;
type SemesterField = "weeks" | "hours" | "hoursPerGroup" | "groupCount";

/** Read a per-semester flat field (e.g. hoursPerGroup2) defaulting to "0". */
export function semesterValue(
  item: WorkloadItemLike,
  semester: SemesterNumber,
  base: SemesterField
): string {
  const key = `${base}${semester}` as keyof WorkloadItemLike;
  return (item[key] as string | undefined) ?? "0";
}

/**
 * Hours contributed per group by one semester entry: weeks * hours-per-week.
 */
export function hoursPerGroup(e: WorkloadSemesterEntryLike): number {
  return e.weeks * e.hours;
}

/**
 * Find an item's `semesters[]` entry for a given semester id (undefined if
 * absent, e.g. a legacy row without an array yet, or a semester the item
 * simply has no hours in).
 */
export function semesterEntry(
  item: WorkloadItemLike,
  semesterId: string
): WorkloadSemesterEntryLike | undefined {
  return item.semesters?.find((s) => s.semesterId === semesterId);
}

/**
 * Items that should produce journals for the given semester: real (non-`_ind`)
 * disciplines that carry either planned hours or a planned group count.
 *
 * Dual-read (Phase 3, dies in Phase 5): prefers `item.semesters` keyed by
 * `semesterId` when present; falls back to the legacy flat fields keyed by
 * ordinal for rows that haven't been migrated to the array yet.
 */
export function itemsNeedingJournals(
  items: WorkloadItemLike[],
  semesterId: string,
  semesterNumber?: SemesterNumber
): WorkloadItemLike[] {
  return items.filter((item) => {
    if (item.id.endsWith("_ind")) return false;

    if (item.semesters && item.semesters.length > 0) {
      const entry = semesterEntry(item, semesterId);
      if (!entry) return false;
      return hoursPerGroup(entry) > 0 || entry.groupCount > 0;
    }

    if (semesterNumber === undefined) return false;
    const hours = parseFloat(semesterValue(item, semesterNumber, "hoursPerGroup")) || 0;
    const groups = parseInt(semesterValue(item, semesterNumber, "groupCount")) || 0;
    return hours > 0 || groups > 0;
  });
}

/** Round-robin split of ids into `groupCount` buckets (empty list if count <= 0). */
export function splitIntoGroups<T>(ids: T[], groupCount: number): T[][] {
  if (groupCount <= 0) return [];
  const groups: T[][] = Array.from({ length: groupCount }, () => []);
  ids.forEach((id, index) => {
    groups[index % groupCount].push(id);
  });
  return groups;
}

interface StudentLike {
  id: string;
  specialty: string;
  status?: string;
  language?: string;
}

/**
 * Active students whose specialty is one of the discipline's specialties.
 * A missing status counts as active. When `language` is given, students are
 * further narrowed to that language (mars rupEntries carry a discipline
 * language); when omitted, language is not considered.
 */
export function filterEligibleStudents<T extends StudentLike>(
  students: T[],
  specialtyIds: string[],
  language?: string
): T[] {
  if (specialtyIds.length === 0) return [];
  const allowed = new Set(specialtyIds);
  return students.filter(
    (s) =>
      allowed.has(s.specialty) &&
      (s.status === undefined || s.status === "active") &&
      (language === undefined || s.language === language)
  );
}
