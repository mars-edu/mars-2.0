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

export function getEventDays(event: CalendarEventLike): {
  day: dayjs.Dayjs;
  weekId: number;
}[] {
  const start = parseEventDate(event.startDate);
  const end = parseEventDate(event.endDate ?? event.startDate);
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
