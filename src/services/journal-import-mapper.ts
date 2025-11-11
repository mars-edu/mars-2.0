/**
 * Journal Import Mapper
 * Maps imported Excel data to journal structure for updating
 */

import type { JournalImportResult, JournalImportStudent } from "@/types/journal-import";
import type { Mark, StudentMark } from "@/types/marks";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

// ============================================================================
// Types
// ============================================================================

export interface StudentMatch {
  importedName: string;
  importedOrder: number;
  studentId: string | null;
  matched: boolean;
}

export interface DateMatch {
  importedDate: string;
  isoDate: string;
  markIndex: number | null;
  matched: boolean;
}

export interface ImportMapping {
  studentMatches: StudentMatch[];
  dateMatches: DateMatch[];
  unmatchedStudents: string[];
  unmatchedDates: string[];
  matchedStudentCount: number;
  matchedDateCount: number;
}

export interface ImportUpdatePayload {
  studentId: string;
  markUpdates: Array<{
    markIndex: number;
    valueIndex: number;
    value: string | null;
  }>;
}

export interface PreparedImport {
  updates: ImportUpdatePayload[];
  warnings: string[];
  stats: {
    totalStudents: number;
    matchedStudents: number;
    totalDates: number;
    matchedDates: number;
    totalUpdates: number;
  };
}

// ============================================================================
// Student Matching
// ============================================================================

/**
 * Match imported student names to existing journal students
 * Strategy: Exact match by fullName
 */
export function matchStudentsToJournal(
  importedStudents: JournalImportStudent[],
  journalStudentIds: string[],
  getStudentById: (id: string) => { fullName: string } | null
): StudentMatch[] {
  const matches: StudentMatch[] = [];

  for (const imported of importedStudents) {
    const importedName = normalizeStudentName(imported.fullName);
    let matchedId: string | null = null;

    // Try exact match first
    for (const studentId of journalStudentIds) {
      const student = getStudentById(studentId);
      if (!student) continue;

      const journalName = normalizeStudentName(student.fullName);
      if (journalName === importedName) {
        matchedId = studentId;
        break;
      }
    }

    matches.push({
      importedName: imported.fullName,
      importedOrder: imported.order,
      studentId: matchedId,
      matched: matchedId !== null,
    });
  }

  return matches;
}

/**
 * Normalize student name for matching (trim, lowercase, collapse whitespace)
 */
function normalizeStudentName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// ============================================================================
// Date Matching
// ============================================================================

/**
 * Match imported dates to journal Mark entries
 * Strategy: Parse date and match by isoDate field
 */
export function matchDatesToMarks(
  importedDates: string[],
  existingMarks: Mark[]
): DateMatch[] {
  const matches: DateMatch[] = [];

  for (const importedDate of importedDates) {
    const isoDate = parseDateToISO(importedDate);
    let matchedIndex: number | null = null;

    if (isoDate) {
      // Find matching mark by isoDate
      matchedIndex = existingMarks.findIndex(
        (mark) => mark.type === "date" && mark.isoDate === isoDate
      );
    }

    matches.push({
      importedDate,
      isoDate: isoDate || "",
      markIndex: matchedIndex !== -1 ? matchedIndex : null,
      matched: matchedIndex !== -1,
    });
  }

  return matches;
}

/**
 * Parse various date formats to ISO date string (YYYY-MM-DD)
 * Supports: DD.MM.YY, DD.MM.YYYY, YYYY-MM-DD
 */
function parseDateToISO(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;

  const cleaned = dateStr.trim();
  if (!cleaned) return null;

  // Try parsing with various formats
  const formats = ["DD.MM.YY", "DD.MM.YYYY", "YYYY-MM-DD", "DD/MM/YY", "DD/MM/YYYY"];

  for (const format of formats) {
    const parsed = dayjs(cleaned, format, true);
    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DD");
    }
  }

  return null;
}

// ============================================================================
// Mapping & Preparation
// ============================================================================

/**
 * Create mapping between imported data and journal structure
 */
export function createImportMapping(
  importResult: JournalImportResult,
  journalStudentIds: string[],
  existingMarks: Mark[],
  getStudentById: (id: string) => { fullName: string } | null
): ImportMapping {
  const studentMatches = matchStudentsToJournal(
    importResult.students,
    journalStudentIds,
    getStudentById
  );

  const dateMatches = matchDatesToMarks(
    importResult.metadata.lessonDates,
    existingMarks
  );

  const unmatchedStudents = studentMatches
    .filter((m) => !m.matched)
    .map((m) => m.importedName);

  const unmatchedDates = dateMatches
    .filter((m) => !m.matched)
    .map((m) => m.importedDate);

  return {
    studentMatches,
    dateMatches,
    unmatchedStudents,
    unmatchedDates,
    matchedStudentCount: studentMatches.filter((m) => m.matched).length,
    matchedDateCount: dateMatches.filter((m) => m.matched).length,
  };
}

/**
 * Prepare update payload for marks store
 */
export function prepareMarksUpdate(
  importResult: JournalImportResult,
  mapping: ImportMapping,
  overwriteMode: boolean
): PreparedImport {
  const updates: ImportUpdatePayload[] = [];
  const warnings: string[] = [];
  let totalUpdates = 0;

  // Process each student
  for (let i = 0; i < mapping.studentMatches.length; i++) {
    const studentMatch = mapping.studentMatches[i];
    if (!studentMatch.matched || !studentMatch.studentId) {
      continue; // Skip unmatched students
    }

    const importedStudent = importResult.students[i];
    if (!importedStudent) continue;

    const markUpdates: ImportUpdatePayload["markUpdates"] = [];

    // Process attendance values
    for (let dateIdx = 0; dateIdx < mapping.dateMatches.length; dateIdx++) {
      const dateMatch = mapping.dateMatches[dateIdx];
      if (!dateMatch.matched || dateMatch.markIndex === null) {
        continue; // Skip unmatched dates
      }

      const importedValue = importedStudent.attendance[dateIdx];

      // Skip if no value in import (unless overwrite mode)
      if (!overwriteMode && (importedValue === null || importedValue === "" || importedValue === undefined)) {
        continue;
      }

      // Normalize value
      const normalizedValue = normalizeValue(importedValue);

      markUpdates.push({
        markIndex: dateMatch.markIndex,
        valueIndex: 0, // First value in the values array (single row per mark)
        value: normalizedValue,
      });
      totalUpdates++;
    }

    // TODO: Handle final grade import
    // This requires matching to session marks, which is more complex
    // For now, we'll just import attendance data

    if (markUpdates.length > 0) {
      updates.push({
        studentId: studentMatch.studentId,
        markUpdates,
      });
    }
  }

  // Add warnings
  if (mapping.unmatchedStudents.length > 0) {
    warnings.push(
      `Пропущено ${mapping.unmatchedStudents.length} студентов (не найдены в журнале): ${mapping.unmatchedStudents.slice(0, 3).join(", ")}${mapping.unmatchedStudents.length > 3 ? "..." : ""}`
    );
  }

  if (mapping.unmatchedDates.length > 0) {
    warnings.push(
      `Пропущено ${mapping.unmatchedDates.length} дат (не найдены в журнале): ${mapping.unmatchedDates.slice(0, 3).join(", ")}${mapping.unmatchedDates.length > 3 ? "..." : ""}`
    );
  }

  return {
    updates,
    warnings,
    stats: {
      totalStudents: importResult.students.length,
      matchedStudents: mapping.matchedStudentCount,
      totalDates: importResult.metadata.lessonDates.length,
      matchedDates: mapping.matchedDateCount,
      totalUpdates,
    },
  };
}

/**
 * Normalize cell value for storage
 */
function normalizeValue(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const str = String(value).trim();
  if (str === "" || str === "0") return null;

  return str;
}

/**
 * Apply updates to marks store (batch update helper)
 */
export async function applyUpdatesToMarks(
  journalId: string,
  preparedImport: PreparedImport,
  getStudentMarks: (journalId: string, studentId: string) => Mark[] | null,
  updateStudentMark: (
    journalId: string,
    studentId: string,
    markIndex: number,
    valueIndex: number,
    value: string | null
  ) => Promise<boolean>
): Promise<void> {
  for (const update of preparedImport.updates) {
    const { studentId, markUpdates } = update;

    // Verify student has marks in journal
    const marks = getStudentMarks(journalId, studentId);
    if (!marks) {
      console.warn(`Student ${studentId} has no marks in journal ${journalId}`);
      continue;
    }

    // Apply each mark update
    for (const markUpdate of markUpdates) {
      const { markIndex, valueIndex, value } = markUpdate;

      // Validate mark index
      if (markIndex < 0 || markIndex >= marks.length) {
        console.warn(`Invalid mark index ${markIndex} for student ${studentId}`);
        continue;
      }

      await updateStudentMark(journalId, studentId, markIndex, valueIndex, value);
    }
  }
}
