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
  course?: string;
  department?: string;
  studentCount?: string;
  semesters: WorkloadSemesterEntryLike[];
  totalHours?: number;
  index?: string;
  description?: string;
  teacherName?: string;
}

/**
 * Hours contributed per group by one semester entry: weeks * hours-per-week.
 */
export function hoursPerGroup(e: WorkloadSemesterEntryLike): number {
  return e.weeks * e.hours;
}

/**
 * Find an item's `semesters[]` entry for a given semester id.
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
 */
export function itemsNeedingJournals(
  items: WorkloadItemLike[],
  semesterId: string
): WorkloadItemLike[] {
  return items.filter((item) => {
    if (item.id.endsWith("_ind")) return false;
    const entry = semesterEntry(item, semesterId);
    if (!entry) return false;
    return hoursPerGroup(entry) > 0 || entry.groupCount > 0;
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
