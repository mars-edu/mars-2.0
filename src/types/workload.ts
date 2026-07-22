export interface WorkloadItem {
  id: string;
  subjectId: string;
  department: string;
  course: string;
  studentCount: string;
  weeks1: string;
  weeks2: string;
  weeks3?: string;
  weeks4?: string;
  weeks5?: string;
  weeks6?: string;
  hours1: string;
  hours2: string;
  hours3?: string;
  hours4?: string;
  hours5?: string;
  hours6?: string;
  hoursPerGroup1: string;
  hoursPerGroup2: string;
  hoursPerGroup3?: string;
  hoursPerGroup4?: string;
  hoursPerGroup5?: string;
  hoursPerGroup6?: string;
  groupCount1: string;
  groupCount2: string;
  groupCount3?: string;
  groupCount4?: string;
  groupCount5?: string;
  groupCount6?: string;
  totalHours: number;
  teacherName?: string;
  index?: string;
  description?: string;
  language?: string;
  specialtyIds?: string[];
  [key: string]: string | string[] | number | undefined;
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
