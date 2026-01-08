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
import type { JournalImportSummary } from "@/lib/excel/imports";
import type {
  AnalyticsExportParams,
  JournalExportParams,
  WorkloadExportParams,
} from "./convex-excel-export.types";

// Re-export types for frontend use
export type {
  JournalStudentRow,
  JournalExportPayload,
} from "@/lib/excel/journalExport";

export type {
  WorkloadEntry,
  WorkloadSummaryEntry,
  MonthlyDistributionEntry,
  TeacherWorkloadExportPayload,
} from "@/lib/excel/workloadExport";

export type {
  DisciplineInfo,
  FinalControlForm,
  StudentRow,
  SpecialtyGroup,
  CourseGroup,
  AnalyticsExportPayload,
} from "@/lib/excel/analyticsExport";

export type {
  AnalyticsExportParams,
  JournalExportParams,
  WorkloadExportParams,
} from "./convex-excel-export.types";

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
  const buffer = await convex.action(api.excel.actions.exportJournal, payload);
  downloadExcel(buffer, filename);
}

/**
 * Export teacher workload report to Excel via Convex action
 */
export async function exportTeacherWorkloadViaConvex(
  payload: WorkloadExportParams,
  filename: string
): Promise<void> {
  const buffer = await convex.action(
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
  const buffer = await convex.action(api.excel.actions.exportAnalytics, payload);
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
): Promise<JournalImportSummary> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const numberArray = Array.from(uint8Array);

  const result = await convex.action(api.excel.actions.importJournal, {
    fileBuffer: numberArray,
  });

  return result as JournalImportSummary;
}

/**
 * Parse educational schedule from Excel file via Convex action
 */
export async function parseEducationalScheduleViaConvex(
  file: File
): Promise<any> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const numberArray = Array.from(uint8Array);

  const result = await convex.action(api.excel.actions.parseEducationalSchedule, {
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
  // Fetch template
  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error("Failed to load template");
  const templateBuffer = await response.arrayBuffer();
  const templateArray = Array.from(new Uint8Array(templateBuffer));

  const result = await convex.action(api.excel.actions.exportKtpToExcel, {
    dataRows,
    templateBuffer: templateArray,
  });

  return new Uint8Array(result);
}
