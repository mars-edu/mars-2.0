/**
 * One semester's slice of a workload item — the target model replacing the 24
 * flat `weeks{N}` / `hours{N}` / `hoursPerGroup{N}` / `groupCount{N}` fields.
 * Keyed by `semesterId`, not by position. Mirrors
 * `convex/schema/workloadItem.ts` `workloadSemesterEntryValidator`.
 */
export interface WorkloadSemesterEntry {
  semesterId: string;
  weeks: number;
  hours: number; // hours per week
  groupCount: number;
}

export interface WorkloadItem {
  id: string;
  subjectId: string;
  department: string;
  course: string;
  studentCount: string;
  semesters: WorkloadSemesterEntry[];
  totalHours: number;
  teacherName?: string;
  index?: string;
  description?: string;
  language?: string;
  specialtyIds?: string[];
}

export interface SavedWorkload {
  id?: string; // Convex ID
  teacherId?: string;
  teacherName: string;
  academicYearId: string;
  items: WorkloadItem[];
  totalHours: number;
  journalsCreated?: boolean;
  journalsCreatedSemesters?: number[];
  addedToSchedule?: boolean;
  createdAt?: number;
  updatedAt?: number;
}
