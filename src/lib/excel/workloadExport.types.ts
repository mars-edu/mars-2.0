// ============================================================================
// Teacher Workload Export - Types
// ============================================================================

export interface WorkloadEntry {
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
}

export interface WorkloadSummaryEntry {
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
}

export interface MonthlyDistributionEntry {
  groupName: string;
  september: number;
  october: number;
  november: number;
  december: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  total: number;
}

export interface MonthInfo {
  key: string;
  name: string;
  year: number;
  month: number;
}

export interface MonthWorkloadData {
  monthInfo: MonthInfo;
  entries: WorkloadEntry[];
  totalHours: number;
}

export interface TeacherWorkloadExportPayload {
  institutionName: string;
  teacherFullName: string;
  academicYear: string;
  // month + entries are legacy single-month artefacts — Form-1 now renders
  // every month from allMonthsWorkload. Kept optional for the excel exporter's
  // still-existing header cell (F8, "Месяц ...") until multi-month header lands.
  month?: string;
  entries?: WorkloadEntry[];
  summaryEntries: WorkloadSummaryEntry[];
  monthlyDistribution: MonthlyDistributionEntry[];
  months?: MonthInfo[];
  allMonthsWorkload?: MonthWorkloadData[];
}

