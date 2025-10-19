export type MarkType = "date" | "session";

export interface Mark {
  type: MarkType;
  date?: string;
  values: Array<string | null>;
  label?: string;
  sessionId?: string;
  sessionDateIndices?: number[];
  isoDate?: string;
  controlType?: "intermediate" | "final";
  controlId?: string;
  scheduledControlId?: string;
}

export interface StudentMark {
  studentId: string;
  marks: Mark[];
}

export interface JournalMarks {
  journalId: string;
  studentMarks: StudentMark[];
  lastUpdated: string;
}
