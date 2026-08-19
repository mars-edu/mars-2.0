/**
 * Pure conflict detection engine for calendar and schedule planning.
 * Detects teacher overlaps, student group overlaps, and time slot collisions.
 */
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";

dayjs.extend(customParseFormat);

export interface BellSlot {
  id: string;
  name?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  order?: number;
}

export interface WeeklyScheduleSlot {
  weekId: number; // 0=Monday, ..., 6=Sunday
  startId?: string;
  endId?: string;
  startTime?: string;
  endTime?: string;
  russianWeekDay?: string;
}

export interface SchedulableEvent {
  id: string;
  title?: string;
  teacherId?: string;
  teacherName?: string;
  participants?: string[];
  startDate: string;
  endDate: string;
  weeklySchedules?: WeeklyScheduleSlot[];
  isIndividualJournal?: boolean;
}

export type ConflictType = "teacher" | "student";

export interface ScheduleConflict {
  type: ConflictType;
  conflictingEventId: string;
  conflictingEventTitle: string;
  weekId: number;
  russianWeekDay: string;
  timeRange: string;
  targetId: string;
  targetName?: string;
  message: string;
}

const RUSSIAN_WEEK_DAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export function getRussianWeekDay(weekId: number): string {
  return RUSSIAN_WEEK_DAYS[weekId] || `День ${weekId}`;
}

export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

export function doTimeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const sA = parseTimeToMinutes(startA);
  const eA = parseTimeToMinutes(endA);
  const sB = parseTimeToMinutes(startB);
  const eB = parseTimeToMinutes(endB);

  if (eA <= sA || eB <= sB) return false;
  return sA < eB && sB < eA;
}

export function normalizeDateToIso(dateStr: string): string {
  if (!dateStr) return "";
  // Check if DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    return dayjs(dateStr, "DD.MM.YYYY").format("YYYY-MM-DD");
  }
  // Check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 10);
  }
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("YYYY-MM-DD") : dateStr;
}

export function doDateRangesOverlap(
  startDateA: string,
  endDateA: string,
  startDateB: string,
  endDateB: string
): boolean {
  const sA = normalizeDateToIso(startDateA);
  const eA = normalizeDateToIso(endDateA);
  const sB = normalizeDateToIso(startDateB);
  const eB = normalizeDateToIso(endDateB);

  if (!sA || !eA || !sB || !eB) return false;
  return sA <= eB && sB <= eA;
}

export function resolveSlotTimes(
  slot: WeeklyScheduleSlot,
  bellSlotsMap?: Map<string, BellSlot>
): { startTime: string; endTime: string } | null {
  if (slot.startTime && slot.endTime) {
    return { startTime: slot.startTime, endTime: slot.endTime };
  }

  if (bellSlotsMap && slot.startId && slot.endId) {
    const startBell = bellSlotsMap.get(slot.startId);
    const endBell = bellSlotsMap.get(slot.endId);
    if (startBell && endBell) {
      return { startTime: startBell.startTime, endTime: endBell.endTime };
    }
  }

  return null;
}

export interface ConflictCheckOptions {
  bellSlots?: BellSlot[];
  studentNamesMap?: Map<string, string>;
  teacherNamesMap?: Map<string, string>;
  excludeEventId?: string;
}

/**
 * Detects schedule conflicts for a draft or existing event against all existing events.
 */
export function detectScheduleConflicts(
  target: Partial<SchedulableEvent>,
  existingEvents: SchedulableEvent[],
  options?: ConflictCheckOptions
): ScheduleConflict[] {
  if (!target.startDate || !target.endDate) return [];
  const targetSlots = target.weeklySchedules || [];
  if (targetSlots.length === 0) return [];

  const bellSlotsMap = options?.bellSlots
    ? new Map(options.bellSlots.map((b) => [b.id, b]))
    : undefined;

  const conflicts: ScheduleConflict[] = [];

  for (const event of existingEvents) {
    // Skip self when updating
    if (event.id === target.id || (options?.excludeEventId && event.id === options.excludeEventId)) {
      continue;
    }

    // Skip individual journals as they represent private tutoring sub-slots
    if (event.isIndividualJournal) continue;

    // Check date overlap
    if (!doDateRangesOverlap(target.startDate, target.endDate, event.startDate, event.endDate)) {
      continue;
    }

    const eventSlots = event.weeklySchedules || [];
    if (eventSlots.length === 0) continue;

    // Check overlap on each day of week
    for (const tSlot of targetSlots) {
      const tTimes = resolveSlotTimes(tSlot, bellSlotsMap);
      if (!tTimes) continue;

      for (const eSlot of eventSlots) {
        if (tSlot.weekId !== eSlot.weekId) continue;

        const eTimes = resolveSlotTimes(eSlot, bellSlotsMap);
        if (!eTimes) continue;

        if (!doTimeRangesOverlap(tTimes.startTime, tTimes.endTime, eTimes.startTime, eTimes.endTime)) {
          continue;
        }

        const weekDayName = tSlot.russianWeekDay || getRussianWeekDay(tSlot.weekId);
        const timeRangeStr = `${tTimes.startTime} – ${tTimes.endTime}`;
        const eventTitle = event.title || "Занятие";

        // 1. Teacher Conflict
        if (target.teacherId && event.teacherId && target.teacherId === event.teacherId) {
          const teacherName =
            options?.teacherNamesMap?.get(target.teacherId) ||
            target.teacherName ||
            event.teacherName ||
            "Преподаватель";

          conflicts.push({
            type: "teacher",
            conflictingEventId: event.id,
            conflictingEventTitle: eventTitle,
            weekId: tSlot.weekId,
            russianWeekDay: weekDayName,
            timeRange: timeRangeStr,
            targetId: target.teacherId,
            targetName: teacherName,
            message: `${teacherName} уже ведет «${eventTitle}» в ${weekDayName} (${timeRangeStr})`,
          });
        }

        // 2. Student Participants Conflict
        const targetStudents = target.participants || [];
        const eventStudents = event.participants || [];
        if (targetStudents.length > 0 && eventStudents.length > 0) {
          const overlappingStudentIds = targetStudents.filter((sId) => eventStudents.includes(sId));
          for (const studentId of overlappingStudentIds) {
            const studentName = options?.studentNamesMap?.get(studentId) || `Студент ${studentId.slice(0, 6)}`;
            conflicts.push({
              type: "student",
              conflictingEventId: event.id,
              conflictingEventTitle: eventTitle,
              weekId: tSlot.weekId,
              russianWeekDay: weekDayName,
              timeRange: timeRangeStr,
              targetId: studentId,
              targetName: studentName,
              message: `${studentName} уже записан(а) на «${eventTitle}» в ${weekDayName} (${timeRangeStr})`,
            });
          }
        }
      }
    }
  }

  return conflicts;
}
