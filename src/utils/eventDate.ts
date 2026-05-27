import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { DATE_UI_FORMAT, DATE_STORAGE_FORMAT } from "@/constants/calendar";
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

export type WeekScheduleLike = { weekId: number };

export type CalendarEventLike = {
  startDate: unknown;
  endDate: unknown;
  weeklySchedules?: WeekScheduleLike[];
};

export type SemesterInfo = {
  startDate: string;
  endDate: string;
};

export function parseEventDate(raw: unknown): dayjs.Dayjs {
  let value: unknown = raw;
  if (Array.isArray(value) && value.length > 0) value = value[0] as unknown;
  if (typeof value === "string") {
    const v = (value as string).trim();
    // Try strict known formats first to avoid DD/MM vs MM/DD ambiguity
    let d = dayjs(v, DATE_STORAGE_FORMAT, true);
    if (d.isValid()) return d;
    d = dayjs(v, DATE_UI_FORMAT, true);
    if (d.isValid()) return d;
    // Fallback to native parsing as a last resort
    return dayjs(v);
  }
  return dayjs(value as any);
}

export function getWeekIdForDay(d: dayjs.Dayjs): number {
  const jsDay = d.day();
  return (jsDay + 6) % 7; // Convert Sunday=0 to Monday=0
}

export function getEventDays(
  event: CalendarEventLike,
  semesterInfo?: SemesterInfo
): {
  day: dayjs.Dayjs;
  weekId: number;
}[] {
  console.log(
    "[DBG] weeklySchedules type:",
    typeof event.weeklySchedules,
    "isArray:",
    Array.isArray(event.weeklySchedules),
    "value:",
    event.weeklySchedules,
    "length:",
    event.weeklySchedules?.length
  );

  let start = parseEventDate(event.startDate);
  let end = parseEventDate(event.endDate ?? event.startDate);

  console.log("[getEventDays] Input:", {
    eventStartDate: event.startDate,
    eventEndDate: event.endDate,
    startDate: start.format(DATE_STORAGE_FORMAT),
    endDate: end.format(DATE_STORAGE_FORMAT),
    startEqualsEnd: start.isSame(end, "day"),
    hasWeeklySchedules:
      Array.isArray(event.weeklySchedules) && event.weeklySchedules.length > 0,
    semesterInfoProvided: !!semesterInfo,
    semesterInfo: semesterInfo
      ? {
          startDate: semesterInfo.startDate,
          endDate: semesterInfo.endDate,
        }
      : null,
  });

  console.log("[getEventDays] Weekly Schedules:", event.weeklySchedules);
  console.log("[getEventDays] Semester Info:", semesterInfo);

  // FALLBACK: If start and end are the same AND no weekly schedules exist,
  // use semester date range if available
  if (
    start.isSame(end, "day") &&
    (!Array.isArray(event.weeklySchedules) ||
      event.weeklySchedules.length === 0)
  ) {
    console.log(
      "[getEventDays] Detected same-day event without schedules, applying fallback"
    );
    if (semesterInfo) {
      start = parseEventDate(semesterInfo.startDate);
      end = parseEventDate(semesterInfo.endDate);
      console.log("[getEventDays] Fallback applied - using semester dates:", {
        newStart: start.format(DATE_STORAGE_FORMAT),
        newEnd: end.format(DATE_STORAGE_FORMAT),
      });
    } else {
      console.log("[getEventDays] No semester info available for fallback");
    }
  } else {
    console.log("[getEventDays] Fallback condition NOT met:", {
      startEqualsEnd: start.isSame(end, "day"),
      hasWeeklySchedules:
        Array.isArray(event.weeklySchedules) &&
        event.weeklySchedules.length > 0,
      weeklySchedules: event.weeklySchedules,
    });
  }

  const result: { day: dayjs.Dayjs; weekId: number }[] = [];
  const hasWeekly =
    Array.isArray(event.weeklySchedules) && event.weeklySchedules.length > 0;
  const allowedWeeks = hasWeekly
    ? (event.weeklySchedules || []).map((w) => w.weekId)
    : [];

  let cursor = start.clone();
  while (cursor.diff(end, "day") <= 0) {
    const weekId = getWeekIdForDay(cursor);
    if (!hasWeekly || allowedWeeks.includes(weekId)) {
      result.push({ day: cursor.clone(), weekId });
    }
    cursor = cursor.add(1, "day");
  }

  console.log("[getEventDays] Result:", {
    daysCount: result.length,
    firstDay: result[0]?.day.format(DATE_STORAGE_FORMAT),
    lastDay: result[result.length - 1]?.day.format(DATE_STORAGE_FORMAT),
  });

  // SECONDARY FALLBACK: If result is empty but we have semester info and a same-day event with schedules,
  // this means the schedules don't match the event's date. Use semester range instead.
  const originalStart = parseEventDate(event.startDate);
  const originalEnd = parseEventDate(event.endDate ?? event.startDate);
  if (
    result.length === 0 &&
    originalStart.isSame(originalEnd, "day") &&
    hasWeekly &&
    semesterInfo
  ) {
    console.log(
      "[getEventDays] Empty result with same-day event and schedules, applying secondary fallback"
    );
    start = parseEventDate(semesterInfo.startDate);
    end = parseEventDate(semesterInfo.endDate);

    cursor = start.clone();
    while (cursor.diff(end, "day") <= 0) {
      const weekId = getWeekIdForDay(cursor);
      if (allowedWeeks.includes(weekId)) {
        result.push({ day: cursor.clone(), weekId });
      }
      cursor = cursor.add(1, "day");
    }

    console.log("[getEventDays] Secondary Fallback Result:", {
      daysCount: result.length,
      firstDay: result[0]?.day.format(DATE_STORAGE_FORMAT),
      lastDay: result[result.length - 1]?.day.format(DATE_STORAGE_FORMAT),
    });
  }

  return result;
}

export function isEventOnDate(
  event: CalendarEventLike,
  targetDate: dayjs.Dayjs
): boolean {
  const start = parseEventDate(event.startDate);
  const end = parseEventDate(event.endDate ?? event.startDate);
  const inRange = targetDate.isBetween(start, end, "day", "[]");
  if (!inRange) return false;
  const hasWeekly =
    Array.isArray(event.weeklySchedules) && event.weeklySchedules.length > 0;
  if (!hasWeekly) return true;
  const weekId = getWeekIdForDay(targetDate);
  return (event.weeklySchedules || []).some((ws) => ws.weekId === weekId);
}
