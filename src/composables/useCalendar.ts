import { computed, ref } from "vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import isBetween from "dayjs/plugin/isBetween";
import { isEventOnDate } from "@/utils/eventDate";

dayjs.extend(isBetween);

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  color?: string; // hex color code for the event
}

export interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export function useCalendar() {
  const year = ref("2025");
  const monthIndex = ref(1); // February (0-indexed)
  const activeTab = ref("month");
  const todayDate = ref(new Date().getDate().toString());

  const calendarStore = useCalendarStore();
  const educationScheduleStore = useEducationScheduleStore();
  const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

  const setYear = (newYear: string) => {
    year.value = newYear;
  };

  const setMonth = (newMonth: number) => {
    monthIndex.value = newMonth;
  };

  const setActiveTab = (tab: string) => {
    activeTab.value = tab;
  };

  const goToToday = () => {
    const today = new Date();
    year.value = today.getFullYear().toString();
    monthIndex.value = today.getMonth();
    todayDate.value = today.getDate().toString();
  };

  const monthName = computed(() => {
    const months = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];
    return months[monthIndex.value];
  });

  // Helper function to get events for a specific date
  const getEventsForDate = (targetDate: dayjs.Dayjs) => {
    const weekIdOfCurrent = (targetDate.day() + 6) % 7; // Convert Sunday=0 to Monday=0

    return calendarStore.events
      .filter((event) => {
        return isEventOnDate(event as any, targetDate);
      })
      .map((event) => {
        let time = event.startTime || "All day";
        if (event.weeklySchedules && event.weeklySchedules.length > 0) {
          const ws = event.weeklySchedules.find(
            (w) => w.weekId === weekIdOfCurrent
          );
          if (ws) {
            if ((ws as any).startId) {
              const schedules = getActiveYearSchedules.value || [];
              const found = schedules.find((s) => s.id === (ws as any).startId);
              if (found) time = found.startTime;
            } else if ((ws as any).startTime) {
              time = (ws as any).startTime;
            }
          }
        }
        return {
          id: event.id,
          title: calendarStore.getEventTitle(event),
          time,
          color: event.color, // pass through the color from store event
        };
      });
  };

  // Generate calendar days for the month
  const calendarDays = computed<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];
    const date = new Date(parseInt(year.value), monthIndex.value, 1);
    const today = new Date();

    // Get the first day of the month
    const firstDay = new Date(date);
    // Get the last day of the month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Adjust for Monday as first day of week
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Add days from previous month to fill the first week
    const prevMonthLastDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      0
    ).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNumber = prevMonthLastDay - i;
      const prevMonthDate = dayjs(
        new Date(date.getFullYear(), date.getMonth() - 1, dayNumber)
      );

      days.push({
        date: dayjs(
          new Date(date.getFullYear(), date.getMonth() - 1, dayNumber)
        ).format(DATE_STORAGE_FORMAT),
        dayNumber,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(prevMonthDate),
      });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const isToday =
        today.getDate() === i &&
        today.getMonth() === date.getMonth() &&
        today.getFullYear() === date.getFullYear();

      const currentDate = dayjs(
        new Date(parseInt(year.value), monthIndex.value, i)
      );

      days.push({
        date: dayjs(new Date(parseInt(year.value), monthIndex.value, i)).format(
          DATE_STORAGE_FORMAT
        ),
        dayNumber: i,
        isCurrentMonth: true,
        isToday,
        events: getEventsForDate(currentDate),
      });
    }

    // Add days from next month to complete the grid (6 rows x 7 columns = 42 cells)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = dayjs(
        new Date(date.getFullYear(), date.getMonth() + 1, i)
      );

      days.push({
        date: dayjs(
          new Date(date.getFullYear(), date.getMonth() + 1, i)
        ).format(DATE_STORAGE_FORMAT),
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(nextMonthDate),
      });
    }

    return days;
  });

  return {
    year,
    monthIndex,
    activeTab,
    todayDate,
    monthName,
    calendarDays,
    setYear,
    setMonth,
    setActiveTab,
    goToToday,
  };
}
