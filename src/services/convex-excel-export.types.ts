// ============================================================================
// Convex Excel Export Types
// ============================================================================

export interface JournalExportParams {
  groupName: string;
  courseLabel: string;
  specialtyLabel?: string;
  academicYearLabel?: string;
  disciplineTitle: string;
  teacherFullName?: string;
  finalControlForm?: string | null;
  students: Array<{
    id: string;
    fullName: string;
    attendance?: (string | number | null)[];
    date?: string | null;
    hours?: number | string | null;
    topic?: string | null;
    finalGrade?: string | number | null;
  }>;
  lessonDates?: string[];
}

export interface WorkloadExportParams {
  institutionName: string;
  teacherFullName: string;
  academicYear: string;
  month: string;
  entries: Array<{
    rowNumber: number;
    moduleIndex: string;
    subjectName: string;
    groupName: string;
    dailyHours: (number | null)[];
    monthTotal: number;
    plannedHours: number;
    actualHours: number;
    cumulativeHours: number;
    remainingHours: number;
  }>;
  summaryEntries: Array<{
    groupName: string;
    moduleIndex: string;
    subjectName: string;
    plannedHours: number;
    actualHours: number;
    facultativePlanned?: number;
    facultativeActual?: number;
    consultationsPlanned?: number;
    consultationsActual?: number;
    examsPlanned?: number;
    examsActual?: number;
    totalHours: number;
  }>;
  monthlyDistribution: Array<{
    groupName: string;
    monthlyHours: Record<string, number>;
    total: number;
  }>;
  months?: Array<{
    key: string;
    name: string;
    year: number;
    month: number;
  }>;
  /** Multi-month workload data for Form 1 */
  allMonthsWorkload?: Array<{
    monthInfo: {
      key: string;
      name: string;
      year: number;
      month: number;
    };
    entries: Array<{
      rowNumber: number;
      moduleIndex: string;
      subjectName: string;
      groupName: string;
      dailyHours: (number | null)[];
      monthTotal: number;
      plannedHours: number;
      actualHours: number;
      cumulativeHours: number;
      remainingHours: number;
    }>;
    totalHours: number;
  }>;
}

export interface AnalyticsExportParams {
  courseGroups: Array<{
    course: string;
    specialtyGroups: Array<{
      specialtyName: string;
      disciplinesSemester: Array<{ id: string; title: string }>;
      disciplinesWithoutFinal: Array<{ id: string; title: string }>;
      disciplinesByForm: Record<string, Array<{ id: string; title: string }>>;
      rows: Array<{
        index: number;
        fullName: string;
        semester: Record<string, string | number>;
        withoutFinal: Record<string, string | number>;
        finals: Record<string, Record<string, string | number>>;
        overallAverage?: string | number;
      }>;
    }>;
  }>;
  finalForms: Array<{ id: string; shortName: string }>;
}

