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
import type { Id } from "../../convex/_generated/dataModel";
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
  MonthInfo,
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
// Export Functions
// ============================================================================

/**
 * Export journal to Excel via Convex action
 */
export async function exportJournalViaConvex(
  payload: JournalExportParams,
  filename: string
): Promise<void> {
  const storageId = await convex.action(api.excel.actions.exportJournal, payload);
  const url = await convex.query(api.files.queries.getFileUrl, { storageId });

  if (!url) {
    throw new Error("Failed to get file URL from storage");
  }

  const response = await fetch(url);
  const blob = await response.blob();
  saveAs(blob, filename);
}

/**
 * Export teacher workload report to Excel via Convex action
 */
export async function exportTeacherWorkloadViaConvex(
  payload: WorkloadExportParams,
  filename: string
): Promise<void> {
  const storageId = await convex.action(
    api.excel.actions.exportTeacherWorkload,
    payload
  );
  const url = await convex.query(api.files.queries.getFileUrl, { storageId });

  if (!url) {
    throw new Error("Failed to get file URL from storage");
  }

  const response = await fetch(url);
  const blob = await response.blob();
  saveAs(blob, filename);
}

/**
 * Export analytics report to Excel via Convex action
 */
export async function exportAnalyticsViaConvex(
  payload: AnalyticsExportParams,
  filename: string
): Promise<void> {
  const storageId = await convex.action(api.excel.actions.exportAnalytics, payload);
  const url = await convex.query(api.files.queries.getFileUrl, { storageId });

  if (!url) {
    throw new Error("Failed to get file URL from storage");
  }

  const response = await fetch(url);
  const blob = await response.blob();
  saveAs(blob, filename);
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
  // Upload file to Convex storage first
  const uploadUrl = await convex.mutation(
    api.files.mutations.generateUploadUrl,
    {}
  );
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`File upload failed: ${uploadResponse.statusText}`);
  }

  const { storageId: fileStorageId } = await uploadResponse.json() as { storageId: Id<"_storage"> };

  const result = await convex.action(api.excel.actions.parseEducationalSchedule, {
    fileStorageId,
    fileName: file.name,
  });

  return result;
}

/**
 * Parse KTP from Word (.docx) file via Convex action
 */
export async function parseKtpDocxTemplateViaConvex(file: File): Promise<any> {
  // Upload file to Convex storage first
  const uploadUrl = await convex.mutation(
    api.files.mutations.generateUploadUrl,
    {}
  );
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type":
        file.type ||
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`File upload failed: ${uploadResponse.statusText}`);
  }

  const { storageId: fileStorageId } = (await uploadResponse.json()) as {
    storageId: Id<"_storage">;
  };

  const result = await convex.action(api.excel.actions.parseKtpDocxTemplate, {
    fileStorageId,
    fileName: file.name,
  });

  return result;
}

/**
 * Export KTP to Excel using template via Convex action
 */
export async function exportKtpToExcelViaConvex(
  dataRows: (string | number | null)[][],
  templateUrl: string,
  learningOutcome?: string | null
): Promise<void> {
  // Fetch template
  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error("Failed to load template");
  const templateBlob = await response.blob();

  // Upload template to Convex storage
  const uploadUrl = await convex.mutation(
    api.files.mutations.generateUploadUrl,
    {}
  );
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": templateBlob.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    body: templateBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Template upload failed: ${uploadResponse.statusText}`);
  }

  const { storageId: templateStorageId } = await uploadResponse.json() as { storageId: Id<"_storage"> };

  // Call the export action with the template storage ID
  const { storageId, filename } = await convex.action(api.excel.actions.exportKtpToExcel, {
    dataRows,
    templateStorageId,
    learningOutcome: learningOutcome || undefined,
  });

  const url = await convex.query(api.files.queries.getFileUrl, { storageId });

  if (!url) {
    throw new Error("Failed to get file URL from storage");
  }

  const fileResponse = await fetch(url);
  const blob = await fileResponse.blob();
  saveAs(blob, filename);
}
