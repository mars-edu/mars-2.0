import dayjs from "@/lib/dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import type { Mark } from "@/types/marks";
import type { EducationSchedule } from "@/types/education-schedule";

export type MarkType = "date" | "session";

export const MARK_TYPE_MAP: Record<MarkType, { singleRow: boolean }> = {
  date: { singleRow: false },
  session: { singleRow: true },
};

export const initialValuesForType = (type: MarkType, dynamicRows: number): Array<null> =>
  MARK_TYPE_MAP[type]?.singleRow
    ? [null]
    : Array.from({ length: Math.max(1, dynamicRows) }, () => null);

export const timeToMinutes = (time: string | undefined | null): number | null => {
  if (!time || typeof time !== "string") return null;
  const parts = time.split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

export const normalizeTime = (time?: string): string | undefined => {
  if (!time) return time;
  const parts = time.split(":");
  if (parts.length < 2) return time;
  return `${String(Number(parts[0])).padStart(2, "0")}:${String(Number(parts[1])).padStart(2, "0")}`;
};

export const findScheduleIdByStartTime = (
  schedules: EducationSchedule[],
  startTime: string
): string | undefined => {
  const normalized = normalizeTime(startTime);
  const exact = schedules.find((s) => normalizeTime(s.startTime) === normalized);
  if (exact) return exact.id;
  const targetMin = timeToMinutes(normalized) ?? 0;
  const candidate = schedules
    .map((s) => ({ s, start: timeToMinutes(s.startTime) ?? 0 }))
    .filter((x) => x.start >= targetMin)
    .sort((a, b) => a.start - b.start)[0]?.s;
  return candidate?.id || schedules[0]?.id;
};

export const findScheduleIdByEndTime = (
  schedules: EducationSchedule[],
  endTime: string
): string | undefined => {
  const normalized = normalizeTime(endTime);
  const exact = schedules.find((s) => normalizeTime(s.endTime) === normalized);
  if (exact) return exact.id;
  const targetMin = timeToMinutes(normalized) ?? 24 * 60;
  const candidate = schedules
    .map((s) => ({ s, end: timeToMinutes(s.endTime) ?? 0 }))
    .filter((x) => x.end <= targetMin)
    .sort((a, b) => b.end - a.end)[0]?.s;
  return candidate?.id || schedules[schedules.length - 1]?.id;
};

export const resolveScheduleIds = (
  daySchedule: any,
  schedules: EducationSchedule[]
): { startId?: string; endId?: string } => {
  let startId = daySchedule?.startId as string | undefined;
  let endId = daySchedule?.endId as string | undefined;
  if ((!startId || !endId) && daySchedule) {
    if (!startId && daySchedule?.startTime) {
      startId = findScheduleIdByStartTime(schedules, daySchedule.startTime);
    }
    if (!endId && daySchedule?.endTime) {
      endId = findScheduleIdByEndTime(schedules, daySchedule.endTime);
    }
  }
  return { startId, endId };
};

export const countLessonsInRange = (
  schedules: EducationSchedule[],
  startId?: string,
  endId?: string
): number => {
  if (!schedules.length) return 2;
  if (!startId && !endId) return 2;
  if (startId && !endId) endId = startId;
  if (!startId && endId) startId = endId;
  const start = schedules.find((s) => s.id === startId)?.lessonNumber;
  const end = schedules.find((s) => s.id === endId)?.lessonNumber;
  if (start == null || end == null) return 2;
  return Math.max(1, Math.abs(end - start) + 1);
};

export interface DateMetaItem {
  isoDate?: string;
  day: dayjs.Dayjs | null;
  datePos: number;
}

export function computeInsertAfter(
  dateMeta: DateMetaItem[],
  start: dayjs.Dayjs | null,
  end: dayjs.Dayjs | null,
  fallback: number
): number {
  if (!dateMeta.length) return -1;
  const effectiveStart = start;
  const effectiveEnd = end ?? start;
  const inRange = dateMeta
    .filter((meta) => {
      if (!meta.day) return false;
      const startsOk =
        !effectiveStart || !effectiveStart.isValid()
          ? true
          : !meta.day.isBefore(effectiveStart, "day");
      const endsOk =
        !effectiveEnd || !effectiveEnd.isValid()
          ? true
          : !meta.day.isAfter(effectiveEnd, "day");
      return startsOk && endsOk;
    })
    .map((meta) => meta.datePos);

  if (inRange.length > 0) return Math.max(...inRange);

  if (effectiveStart && effectiveStart.isValid()) {
    const before = dateMeta
      .filter((meta) => meta.day && meta.day.isBefore(effectiveStart, "day"))
      .map((meta) => meta.datePos);
    if (before.length > 0) {
      const maxBefore = Math.max(...before);
      if (before.length === dateMeta.length) return maxBefore + 1000;
      return maxBefore;
    }
    return -1;
  }

  return fallback;
}

export function insertControlMarks(
  marksWithSessions: Mark[],
  controlInsertions: Array<{
    mark: Mark;
    insertAfterDatePos: number;
    sortKey: number;
    secondarySortKey: string;
  }>
): Mark[] {
  const result = [...marksWithSessions];

  controlInsertions
    .sort((a, b) => {
      if (a.insertAfterDatePos !== b.insertAfterDatePos)
        return a.insertAfterDatePos - b.insertAfterDatePos;
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.secondarySortKey.localeCompare(b.secondarySortKey);
    })
    .forEach(({ mark, insertAfterDatePos }) => {
      let insertIndex = 0;
      if (insertAfterDatePos < 0) {
        insertIndex = 0;
      } else {
        let seenDates = -1;
        insertIndex = result.findIndex((m) => {
          if (m.type === "date") {
            seenDates += 1;
            if (seenDates === insertAfterDatePos) return true;
          }
          return false;
        });
        insertIndex = insertIndex === -1 ? result.length : insertIndex + 1;
      }
      result.splice(insertIndex, 0, mark);
    });

  return result;
}
