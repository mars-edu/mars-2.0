export interface JournalImportMetadata {
  groupName: string;
  courseLabel: string;
  specialtyLabel: string;
  academicYearLabel: string;
  disciplineTitle: string;
  teacherFullName: string;
  lessonDates: string[];
}

export interface JournalImportStudent {
  order: number;
  fullName: string;
  attendance: (string | number | null)[];
  lessonDate?: string;
  hours?: number | string | null;
  topic?: string | null;
  teacherSignature?: string | null;
  accompanistSignature?: string | null;
}

export interface JournalImportResult {
  metadata: JournalImportMetadata;
  students: JournalImportStudent[];
}

export interface JournalImportValidationIssue {
  type: "warning" | "error";
  message: string;
}

export interface JournalImportSummary {
  result: JournalImportResult | null;
  issues: JournalImportValidationIssue[];
}