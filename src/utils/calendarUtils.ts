import { useScheduleStore } from "@/stores/scheduleStore";

/**
 * Interface for a date in the calendar grid.
 */
export interface CalendarDate {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  date: Date;
  hasSchedule?: boolean;
}

/**
 * Checks if a specific date has any scheduled lessons.
 */
export const checkHasSchedule = (date: Date, scheduleStore: ReturnType<typeof useScheduleStore>): boolean => {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return !!scheduleStore.scheduleData[key]?.length;
};

/**
 * Generates an array of 42 dates to fill a 6-week calendar grid.
 */
export const generateCalendarDays = (currentDate: Date, scheduleStore: ReturnType<typeof useScheduleStore>): CalendarDate[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() || 7) - 1;

  const days: CalendarDate[] = [];

  // Previous month days
  if (startOffset > 0) {
    const prevLastDay = new Date(year, month, 0).getDate();
    const prevMonth = month - 1 < 0 ? 11 : month - 1;
    const prevYear = prevMonth === 11 ? year - 1 : year;
    for (let i = prevLastDay - startOffset + 1; i <= prevLastDay; i++) {
      const d = new Date(prevYear, prevMonth, i);
      days.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
        date: d,
        hasSchedule: checkHasSchedule(d, scheduleStore)
      });
    }
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({
      day: i,
      isCurrentMonth: true,
      isToday: today.getDate() === i && today.getMonth() === month && today.getFullYear() === year,
      date: d,
      hasSchedule: checkHasSchedule(d, scheduleStore)
    });
  }

  // Next month days
  const totalSlots = 42;
  const nextMonthCount = totalSlots - days.length;
  for (let i = 1; i <= nextMonthCount; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      day: i,
      isCurrentMonth: false,
      isToday: false,
      date: d,
      hasSchedule: checkHasSchedule(d, scheduleStore)
    });
  }

  return days;
};

/**
 * Checks if two dates are the same (year, month, day).
 */
export const isSameDate = (d1: Date, d2: Date): boolean => {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};
