import type { Mark, StudentMark, JournalMarks } from "@/types/marks";

export function cloneMarkTemplate(template: Mark[]): Mark[] {
  return template.map((mark) => JSON.parse(JSON.stringify(mark)) as Mark);
}

export function findMatchingMarkIndex(
  templateMark: Mark,
  existingMarks: Mark[],
  usedIndices: Set<number>
): number {
  const tryMatch = (predicate: (mark: Mark) => boolean) => {
    for (let i = 0; i < existingMarks.length; i += 1) {
      if (usedIndices.has(i)) continue;
      const candidate = existingMarks[i];
      if (predicate(candidate)) return i;
    }
    return -1;
  };

  if (templateMark.type === "date") {
    if (templateMark.isoDate) {
      const idx = tryMatch(
        (mark) => mark.type === "date" && mark.isoDate === templateMark.isoDate
      );
      if (idx !== -1) return idx;
    }
    const label = templateMark.label || templateMark.date;
    if (label) {
      const normalizedLabel = String(label).trim();
      const idx = tryMatch((mark) => {
        if (mark.type !== "date") return false;
        const matchLabel = String(mark.label || mark.date || "").trim();
        return matchLabel === normalizedLabel;
      });
      if (idx !== -1) return idx;
    }
  }

  if (templateMark.type === "session") {
    if (templateMark.scheduledControlId) {
      const idx = tryMatch(
        (mark) =>
          mark.type === "session" &&
          mark.scheduledControlId === templateMark.scheduledControlId
      );
      if (idx !== -1) return idx;
    }
    if (templateMark.sessionId) {
      const idx = tryMatch(
        (mark) => mark.type === "session" && mark.sessionId === templateMark.sessionId
      );
      if (idx !== -1) return idx;
    }
    if (templateMark.label) {
      const normalizedLabel = String(templateMark.label).trim();
      if (normalizedLabel.length) {
        const idx = tryMatch((mark) => {
          if (mark.type !== "session") return false;
          const matchLabel = String(mark.label || "").trim();
          return matchLabel === normalizedLabel;
        });
        if (idx !== -1) return idx;
      }
    }
  }

  return tryMatch((mark) => mark.type === templateMark.type);
}

export function mergeValuesFromExisting(templateMark: Mark, existingMark: Mark): Array<string | null> {
  if (!Array.isArray(templateMark.values)) {
    templateMark.values = [];
  }
  const templateValues = Array.isArray(templateMark.values)
    ? [...templateMark.values]
    : [];
  const existingValues = Array.isArray(existingMark.values)
    ? existingMark.values
    : [];

  const merged = templateValues.map((_, idx) => {
    if (idx < existingValues.length) {
      return existingValues[idx] ?? null;
    }
    return null;
  });

  return merged;
}

export function buildStudentMarks(
  studentId: string,
  markTemplate: Mark[],
  existingStudent?: StudentMark
): StudentMark {
  const templateMarks = cloneMarkTemplate(markTemplate);
  const existingMarks = existingStudent?.marks ?? [];
  const usedIndices = new Set<number>();

  templateMarks.forEach((templateMark) => {
    const matchIndex = findMatchingMarkIndex(
      templateMark,
      existingMarks,
      usedIndices
    );
    if (matchIndex === -1) {
      if (Array.isArray(templateMark.values)) {
        templateMark.values = templateMark.values.map(() => null);
      }
      return;
    }

    usedIndices.add(matchIndex);
    const existingMark = existingMarks[matchIndex];
    const mergedValues = mergeValuesFromExisting(templateMark, existingMark);
    templateMark.values = mergedValues;
  });

  return {
    studentId,
    marks: templateMarks,
  };
}

export function buildJournalMarksMatrix(
  journalId: string,
  studentIds: string[],
  markTemplate: Mark[],
  existingJournal?: JournalMarks
): JournalMarks {
  const uniqueStudentIds = Array.from(
    new Set(studentIds.filter((id): id is string => typeof id === "string" && id.length > 0))
  );

  const nextStudentMarks = uniqueStudentIds.map((studentId) => {
    const existingStudent = existingJournal?.studentMarks.find(
      (sm) => sm.studentId === studentId
    );
    return buildStudentMarks(studentId, markTemplate, existingStudent);
  });

  return {
    journalId,
    studentMarks: nextStudentMarks,
    lastUpdated: new Date().toISOString(),
  };
}
