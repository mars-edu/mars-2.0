/**
 * Convex Excel Export Service
 *
 * Frontend wrapper for Convex Excel export actions.
 * Handles calling Convex actions and downloading resulting files.
 *
 * This service provides backend-powered Excel generation, offloading
 * the heavy ExcelJS library from the frontend bundle.
 */

import { saveAs } from "file-saver";
import { api } from "../../convex/_generated/api";
import { convex } from "@/lib/convexClient";

// Re-export types for frontend use
export type {
  JournalStudentRow,
  JournalExportPayload,
} from "../../convex/excel/journalExport";

export type {
  WorkloadEntry,
  WorkloadSummaryEntry,
  MonthlyDistributionEntry,
  TeacherWorkloadExportPayload,
} from "../../convex/excel/workloadExport";

export type {
  DisciplineInfo,
  FinalControlForm,
  StudentRow,
  SpecialtyGroup,
  CourseGroup,
  AnalyticsExportPayload,
} from "../../convex/excel/analyticsExport";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert number array from Convex to Uint8Array and save as file
 */
function downloadExcel(buffer: number[], filename: string): void {
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);
}

/**
 * Get the Convex client, throwing if not available
 */
function getConvexClient() {
  if (!convex) {
    throw new Error(
      "Convex client is not available. Make sure VITE_CONVEX_URL is set."
    );
  }
  return convex;
}

// ============================================================================
// Journal Export Payload Type
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

// ============================================================================
// Workload Export Payload Type
// ============================================================================

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
  }>;
}

// ============================================================================
// Analytics Export Payload Type
// ============================================================================

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

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export journal to Excel via Convex action
 */
export async function exportJournalViaConvex(
  payload: JournalExportParams,
  filename: string
): Promise<void> {
  const client = getConvexClient();
  const buffer = await client.action(api.excel.actions.exportJournal, payload);
  downloadExcel(buffer, filename);
}

/**
 * Export teacher workload report to Excel via Convex action
 */
export async function exportTeacherWorkloadViaConvex(
  payload: WorkloadExportParams,
  filename: string
): Promise<void> {
  const client = getConvexClient();
  const buffer = await client.action(
    api.excel.actions.exportTeacherWorkload,
    payload
  );
  downloadExcel(buffer, filename);
}

/**
 * Export analytics report to Excel via Convex action
 */
export async function exportAnalyticsViaConvex(
  payload: AnalyticsExportParams,
  filename: string
): Promise<void> {
  const client = getConvexClient();
  const buffer = await client.action(api.excel.actions.exportAnalytics, payload);
  downloadExcel(buffer, filename);
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import journal from Excel file via Convex action
 */
export async function importJournalViaConvex(
  file: File
): Promise<any> {
  const client = getConvexClient();
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const numberArray = Array.from(uint8Array);

  const result = await client.action(api.excel.actions.importJournal, {
    fileBuffer: numberArray,
  });

  return result;
}

/**
 * Parse educational schedule from Excel file via Convex action
 */
export async function parseEducationalScheduleViaConvex(
  file: File
): Promise<any> {
  const client = getConvexClient();
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const numberArray = Array.from(uint8Array);

  const result = await client.action(api.excel.actions.parseEducationalSchedule, {
    fileBuffer: numberArray,
    fileName: file.name,
  });

  return result;
}

/**
 * Export KTP to Excel using template via Convex action
 */
export async function exportKtpToExcelViaConvex(
  dataRows: (string | number | null)[][],
  templateUrl: string
): Promise<Uint8Array> {
  const client = getConvexClient();

  // Fetch template
  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error("Failed to load template");
  const templateBuffer = await response.arrayBuffer();
  const templateArray = Array.from(new Uint8Array(templateBuffer));

  const result = await client.action(api.excel.actions.exportKtpToExcel, {
    dataRows,
    templateBuffer: templateArray,
  });

  return new Uint8Array(result);
}
