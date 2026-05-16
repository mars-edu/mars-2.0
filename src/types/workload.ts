export interface WorkloadItem {
  id: string;
  subjectId: string;
  department: string;
  course: string;
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
  totalHours: string;
  teacherName?: string;
  index?: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface SavedWorkload {
  id?: string; // Convex ID
  teacherId?: string;
  teacherName: string;
  academicYearId: string;
  items: WorkloadItem[];
  totalHours: number;
  createdAt?: number;
  updatedAt?: number;
}
