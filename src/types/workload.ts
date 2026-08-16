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
  weeks1?: string;
  weeks2?: string;
  weeks3?: string;
  weeks4?: string;
  weeks5?: string;
  weeks6?: string;
  hours1?: string;
  hours2?: string;
  hours3?: string;
  hours4?: string;
  hours5?: string;
  hours6?: string;
  hoursPerGroup1?: string;
  hoursPerGroup2?: string;
  hoursPerGroup3?: string;
  hoursPerGroup4?: string;
  hoursPerGroup5?: string;
  hoursPerGroup6?: string;
  groupCount1?: string;
  groupCount2?: string;
  groupCount3?: string;
  groupCount4?: string;
  groupCount5?: string;
  groupCount6?: string;
  /**
   * Target per-semester model (Phase 3: dual-write alongside the flat
   * fields above). Source of truth once present — see
   * `recalcWorkloadItem` / `syncFlatFieldsFromSemesters` in
   * `src/lib/workloadHours.ts`.
   */
  semesters?: WorkloadSemesterEntry[];
  totalHours: number;
  teacherName?: string;
  index?: string;
  description?: string;
  language?: string;
  specialtyIds?: string[];
  [key: string]: string | string[] | number | WorkloadSemesterEntry[] | undefined;
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
