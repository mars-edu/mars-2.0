// ============================================================================
// Excel Import/Export - Shared Types (Frontend-safe)
// ============================================================================

export interface JournalImportStudent {
  order: number;
  fullName: string;
  attendance: (string | number | null)[];
  finalControlForm: string | null;
  finalGrade: string | null;
  lessonDate?: string;
  hours?: string;
  topic?: string;
  teacherSignature?: string;
  accompanistSignature?: string;
}

export interface JournalImportMetadata {
  groupName: string;
  courseLabel: string;
  specialtyLabel: string;
  academicYearLabel: string;
  disciplineTitle: string;
  teacherFullName: string;
  lessonDates: string[];
}

export interface JournalImportResult {
  metadata: JournalImportMetadata;
  students: JournalImportStudent[];
}

export interface JournalImportValidationIssue {
  type: "error" | "warning";
  message: string;
}

export interface JournalImportSummary {
  result: JournalImportResult | null;
  issues: JournalImportValidationIssue[];
}

export interface ParsedLesson {
  lessonNumber: number;
  subject: string;
  hours: number | string;
  lessonType: string;
  homework: string;
  notes: string;
}

export interface ParseResult {
  metadata: {
    fileName: string;
    sheetName: string;
    totalLessons: number;
    headerRow: number;
    headers: string[];
    parsedAt: string;
  };
  lessons: ParsedLesson[];
}

