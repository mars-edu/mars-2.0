export interface IndividualJournalPayload {
  studentIds: string[];
  weeklySchedules: Array<{
    weekId: number;
    startTime?: string;
    endTime?: string;
    startId?: string;
    endId?: string;
  }>;
}

/**
 * Validate individual-journal payloads for createWithIndividualJournals /
 * updateIndividualJournalsConfig. Returns a human-readable error or null.
 * Exact-hours validation is intentionally client-side (the backend has no
 * lesson-time schedule math) — this checks structural shape only.
 */
export function validateIndividualJournals(
  journals: IndividualJournalPayload[],
  gradingType: "combined" | "separate" | undefined
): string | null {
  if (journals.length === 0) {
    return "Нужен хотя бы один индивидуальный журнал";
  }
  if (gradingType !== "combined" && gradingType !== "separate") {
    return "Не выбран тип оценивания";
  }
  for (const j of journals) {
    if (j.studentIds.length === 0) {
      return "В каждом журнале должен быть хотя бы один студент";
    }
    if (j.weeklySchedules.length === 0) {
      return "В каждом журнале должно быть расписание";
    }
    for (const s of j.weeklySchedules) {
      if (!s.startId || !s.endId) {
        return "У каждого слота должно быть время начала и конца";
      }
    }
  }
  return null;
}
