export type MarkType = "date" | "pk" | "e" | "i" | "session" | "ku" | "z";

export interface Mark {
  type: MarkType;
  date?: string;
  values: Array<string | null>;
  label?: string;
  sessionId?: string;
  sessionDateIndices?: number[];
  isoDate?: string;
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
