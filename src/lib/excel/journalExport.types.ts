// ============================================================================
// Journal Export - Shared Types (Frontend-safe)
// ============================================================================

export interface JournalStudentRow {
  id: string;
  fullName: string;
  attendance?: (string | number | null)[];
  date?: string | null;
  hours?: number | string | null;
  topic?: string | null;
  finalGrade?: string | number | null;
}

export interface JournalExportPayload {
  groupName: string;
  courseLabel: string;
  specialtyLabel?: string;
  academicYearLabel?: string;
  disciplineTitle: string;
  teacherFullName?: string;
  finalControlForm?: string | null;
  students: JournalStudentRow[];
  lessonDates?: string[];
}

