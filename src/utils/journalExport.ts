/**
 * Journal Export Utilities
 *
 * Shared logic for generating journal export data (lessonDates and student rows)
 * Used by both JournalDetails (single export) and journals.vue (bulk export)
 */

import dayjs from "dayjs";
import type { Mark } from "@/types/marks";
import { DATE_STORAGE_FORMAT, DATE_UI_FORMAT } from "@/constants/calendar";
import type { Student } from "@/types/student";
import type { Journal } from "@/types/journal";
import type { CalendarEvent } from "@/types/calendar";
import type { AcademicYear } from "@/types/academic-year";
import type { RupEntry, DistributionEntry } from "@/types/rup-entry";

export interface ExportColumn {
  type: string;
  label: string;
  isoDate: string | null;
}

export interface ExportStudentRow {
  id: string;
  fullName: string;
  attendance: (string | number | null)[];
  finalGrade?: string | number | null;
}

/**
 * Format mark header label for export
 * - For date marks: formats as DD.MM.YYYY
 * - For session marks: uses mark.label
 */
export function formatExportHeaderLabel(mark: Mark): string {
  if (mark.type === "date") {
    const iso = mark.isoDate;
    if (iso) {
      const parsed = dayjs(iso, DATE_STORAGE_FORMAT, true);
      if (parsed.isValid()) {
        return parsed.format(DATE_UI_FORMAT);
      }
    }
    // Fallback: use mark.date but strip newlines
    const dateStr = mark.date || mark.label || "";
    return typeof dateStr === "string" ? dateStr.replace(/\n/g, " ").trim() : "";
  }

  // For session marks, use label
  return mark.label || "";
}

/**
 * Generate export columns from marks template
 */
export function generateExportColumns(marksTemplate: Mark[]): ExportColumn[] {
  return marksTemplate.map((mark) => ({
    type: mark.type,
    label: formatExportHeaderLabel(mark),
    isoDate: mark.isoDate ?? null,
  }));
}

/**
 * Extract lesson dates (formatted headers) from marks template
 */
export function extractLessonDates(marksTemplate: Mark[]): string[] {
  return marksTemplate.map((mark) => formatExportHeaderLabel(mark));
}

/**
 * Format attendance value for export
 * - For date marks: combines multiple values with " / " separator
 * - For session marks: returns first value
 */
export function formatAttendanceValue(mark: Mark | undefined): string | number {
  if (!mark) return "";

  if (mark.type === "date") {
    // Combine all values for the date (multiple lessons per day)
    const combined = (mark.values || [])
      .map((value) => (value === null || value === "" ? "" : String(value).trim()))
      .filter((value) => value.length > 0);
    return combined.join(" / ");
  }

  // For session marks, just get the first value
  const value = mark.values?.[0];
  return value == null || value === "" ? "" : String(value);
}

/**
 * Extract final grade from student marks
 * Looks for session mark with controlType === "final"
 */
export function extractFinalGrade(studentMarks: Mark[]): string | undefined {
  const finalMark = studentMarks.find(
    (m) => m.type === "session" && m.controlType === "final"
  );

  if (finalMark && finalMark.values?.[0]) {
    const val = finalMark.values[0];
    if (val !== null && val !== "") {
      return String(val);
    }
  }

  return undefined;
}

/**
 * Prepare journal export metadata (shared between single and bulk export)
 */
export interface JournalExportMetadata {
  groupName: string;
  courseLabel: string;
  specialtyLabel?: string;
  academicYearLabel: string;
  disciplineTitle: string;
  teacherFullName: string;
  finalControlForm: string | null;
  filename: string;
}

export interface PrepareMetadataParams {
  journal: Journal;
  event: CalendarEvent | undefined;
  students: Student[];
  academicYear: AcademicYear | null;
  selectedAcademicYearId: string | null;
  rupEntries: RupEntry[];
  academicYearSemesters: any[];
  scheduledFinalControls: any[];
  finalControls: any[];
  getSpecialtyByCode: (code: string) => { code: string; name: string } | undefined;
  getTeacherFullName: (id: string) => string;
  getDisciplineTitle: (journal: Journal) => string;
  getJournalTitle: (journal: Journal) => string;
}

export function prepareJournalExportMetadata(
  params: PrepareMetadataParams
): JournalExportMetadata {
  const {
    journal,
    event,
    students,
    academicYear,
    rupEntries,
    academicYearSemesters,
    scheduledFinalControls,
    finalControls,
    getSpecialtyByCode,
    getTeacherFullName,
    getDisciplineTitle,
    getJournalTitle,
  } = params;

  const primaryStudentId = journal.students?.[0];
  const primaryStudent = primaryStudentId
    ? students.find((s) => s.id === primaryStudentId)
    : undefined;
  const specialty = primaryStudent?.specialty
    ? getSpecialtyByCode(primaryStudent.specialty)
    : undefined;

  const academicYearLabel = academicYear
    ? `${academicYear.startYear}/${academicYear.endYear}`
    : "";

  const teacherName = event?.teacherId ? getTeacherFullName(event.teacherId) : "";

  const disciplineTitle = getDisciplineTitle(journal);
  const groupTitle = getJournalTitle(journal);

  // Get final control form from distribution entry
  let finalControlForm: string | null = null;
  const rupEntryItem = rupEntries.find((c) => c.id === journal.disciplineId);
  if (rupEntryItem && academicYear) {
    const semester = academicYearSemesters.find(
      (s: any) => s.semesterNumber === (event?.semester ?? 1)
    );
    if (semester) {
      const distributionEntry = rupEntryItem.distributionEntries.find(
        (entry: DistributionEntry) =>
          entry.academicYearId === academicYear.id && entry.semesterId === semester.id
      );
      if (distributionEntry?.finalControlId) {
        const scheduledControl = scheduledFinalControls.find(
          (sc: any) => sc.id === distributionEntry.finalControlId
        );
        if (scheduledControl) {
          const finalControl = finalControls.find(
            (fc: any) => fc.id === scheduledControl.finalControlId
          );
          finalControlForm = finalControl?.name ?? null;
        }
      }
    }
  }

  const filename = `${disciplineTitle}_${groupTitle}`
    .replace(/[^a-zA-Zа-яА-Я0-9_\-\.]/g, "_")
    .concat(".xlsx");

  return {
    groupName: groupTitle,
    courseLabel: journal.courseNumber?.toString() ?? "",
    specialtyLabel: specialty ? `${specialty.code} - ${specialty.name}` : undefined,
    academicYearLabel,
    disciplineTitle,
    teacherFullName: teacherName,
    finalControlForm,
    filename,
  };
}
