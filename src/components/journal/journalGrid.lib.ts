/**
 * Pure helpers extracted from JournalTab.vue.
 *
 * Everything here is side-effect-free and reactivity-free: each function's
 * output depends only on its arguments (plus frozen module constants), which
 * makes it unit-testable in isolation. Keep it that way — no store/ref reads.
 */
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { DATE_STORAGE_FORMAT, DATE_UI_FORMAT } from "@/constants/calendar";
import type { EducationSchedule } from "@/stores/educationScheduleStore";

dayjs.extend(customParseFormat);

// ── Mark types ──────────────────────────────────────────────────────────────

export const MARK_TYPES = [
  { type: "date", defaultLabel: null, singleRow: false },
  { type: "session", defaultLabel: null, singleRow: true },
] as const;

export type MarkType = (typeof MARK_TYPES)[number]["type"];

export const MARK_TYPE_MAP: Readonly<
  Record<MarkType, (typeof MARK_TYPES)[number]>
> = Object.freeze(
  Object.fromEntries(MARK_TYPES.map((d) => [d.type, d])) as any
);

export const initialValuesForType = (type: MarkType, dynamicRows: number) =>
  MARK_TYPE_MAP[type]?.singleRow
    ? [null]
    : Array.from({ length: Math.max(1, dynamicRows) }, () => null);

export const headerLabelFor = (mark: any): string => {
  if (mark.type === "date") return mark.date || "";
  if (mark.label) return mark.label;
  const def = MARK_TYPE_MAP[mark.type as MarkType];
  return (def?.defaultLabel ?? "") as string;
};

export const exportHeaderLabelFor = (mark: any): string => {
  if (mark.type === "date") {
    const iso = mark?.isoDate;
    if (iso) {
      const parsed = dayjs(iso, DATE_STORAGE_FORMAT, true);
      if (parsed.isValid()) {
        return parsed.format(DATE_UI_FORMAT);
      }
    }
    const label = headerLabelFor(mark);
    return typeof label === "string" ? label.replace(/\n/g, " ").trim() : "";
  }
  const label = headerLabelFor(mark);
  return typeof label === "string" ? label.replace(/\n/g, " ").trim() : "";
};

// ── Letter / badge grading ───────────────────────────────────────────────────

export const LETTER_GRADE_BUCKETS: Array<{ letter: string; min: number }> = [
  { letter: "A", min: 95 },
  { letter: "A-", min: 90 },
  { letter: "B+", min: 85 },
  { letter: "B", min: 80 },
  { letter: "B-", min: 75 },
  { letter: "C+", min: 70 },
  { letter: "C", min: 65 },
  { letter: "C-", min: 60 },
  { letter: "D+", min: 55 },
  { letter: "D", min: 50 },
  { letter: "F", min: 0 },
];

export const scoreToLetter = (score: number): string => {
  for (const bucket of LETTER_GRADE_BUCKETS) {
    if (score >= bucket.min) return bucket.letter;
  }
  return "F";
};

export const getScoreBadgeClass = (score: string): string => {
  if (score === "—") {
    return "bg-gray-400";
  }

  const numScore = parseFloat(score);

  if (numScore >= 4.5) {
    return "bg-emerald-500"; // Green for excellent (5-4.5)
  } else if (numScore >= 3.5) {
    return "bg-gradient-to-r from-yellow-400 to-emerald-500"; // Yellow-green gradient for good (4.4-3.5)
  } else if (numScore >= 2.5) {
    return "bg-yellow-500"; // Yellow for satisfactory (3.4-2.5)
  } else {
    return "bg-red-500"; // Red for poor (below 2.5)
  }
};

// ── Schedule-time resolution ─────────────────────────────────────────────────

export const timeToMinutes = (time: string | undefined | null) => {
  if (!time || typeof time !== "string") return null;
  const parts = time.split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

export const normalizeTime = (time?: string) => {
  if (!time) return time;
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const hh = String(Number(parts[0])).padStart(2, "0");
  const mm = String(Number(parts[1])).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const findScheduleIdByStartTime = (
  schedules: EducationSchedule[],
  startTime: string
) => {
  const normalized = normalizeTime(startTime);
  const exact = schedules.find(
    (s) => normalizeTime(s.startTime) === normalized
  );
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
) => {
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
