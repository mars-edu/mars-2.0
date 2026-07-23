/**
 * Pure helpers for turning a saved workload into draft journals/calendar events.
 *
 * These encode the planning logic ported from concept-v3's workload→journal
 * wizard (semester filtering, group-count fan-out, student auto-match, group
 * split). The mutation layer orchestrates the DB; all branching logic lives
 * here so it can be unit-tested without a Convex harness.
 */

export interface WorkloadItemLike {
  id: string;
  subjectId: string;
  course: string;
  department: string;
  studentCount: string;
  weeks1: string;
  weeks2: string;
  weeks3?: string;
  hours1: string;
  hours2: string;
  hours3?: string;
  hoursPerGroup1: string;
  hoursPerGroup2: string;
  hoursPerGroup3?: string;
  groupCount1: string;
  groupCount2: string;
  groupCount3?: string;
  totalHours: number;
  index?: string;
  description?: string;
  teacherName?: string;
}

export type SemesterNumber = 1 | 2 | 3;
type SemesterField = "weeks" | "hours" | "hoursPerGroup" | "groupCount";

/** Read a per-semester field (e.g. hoursPerGroup2) defaulting to "0". */
export function semesterValue(
  item: WorkloadItemLike,
  semester: SemesterNumber,
  base: SemesterField
): string {
  const key = `${base}${semester}` as keyof WorkloadItemLike;
  return (item[key] as string | undefined) ?? "0";
}

/**
 * Items that should produce journals for the given semester: real (non-`_ind`)
 * disciplines that carry either planned hours or a planned group count.
 */
export function itemsNeedingJournals(
  items: WorkloadItemLike[],
  semester: SemesterNumber
): WorkloadItemLike[] {
  return items.filter((item) => {
    if (item.id.endsWith("_ind")) return false;
    const hours = parseFloat(semesterValue(item, semester, "hoursPerGroup")) || 0;
    const groups = parseInt(semesterValue(item, semester, "groupCount")) || 0;
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
