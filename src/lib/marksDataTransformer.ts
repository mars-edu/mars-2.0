import type { JournalMarks } from "@/types/marks";

export interface RawBackendMark {
  studentId: string;
  columnIndex: number;
  rowIndex: number;
  value?: string | null;
}

/**
 * Merges raw flat marks from Convex into the client-side structured JournalMarks template.
 */
export function mergeBackendMarksIntoTemplate(
  existingJournal: JournalMarks,
  rawMarks: RawBackendMark[]
): boolean {
  // Build a map of backend marks: studentId -> columnIndex -> rowIndex -> value
  const backendMarksMap = new Map<string, Map<number, Map<number, string | null>>>();

  rawMarks.forEach((mark) => {
    if (!backendMarksMap.has(mark.studentId)) {
      backendMarksMap.set(mark.studentId, new Map());
    }
    const studentMap = backendMarksMap.get(mark.studentId)!;
    if (!studentMap.has(mark.columnIndex)) {
      studentMap.set(mark.columnIndex, new Map());
    }
    studentMap.get(mark.columnIndex)!.set(mark.rowIndex, mark.value ?? null);
  });

  let hasChanges = false;

  existingJournal.studentMarks.forEach((student) => {
    const studentBackendMarks = backendMarksMap.get(student.studentId);
    if (!studentBackendMarks) return;

    student.marks.forEach((templateCol, colIdx) => {
      const colBackendMarks = studentBackendMarks.get(colIdx);
      if (!colBackendMarks) return;

      templateCol.values.forEach((_, rowIdx) => {
        if (colBackendMarks.has(rowIdx)) {
          const val = colBackendMarks.get(rowIdx) ?? "";
          if (templateCol.values[rowIdx] !== val) {
            templateCol.values[rowIdx] = val;
            hasChanges = true;
          }
        }
      });
    });
  });

  if (hasChanges) {
    existingJournal.lastUpdated = new Date().toISOString();
  }

  return hasChanges;
}
