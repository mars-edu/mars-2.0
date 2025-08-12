import { computed, ref } from "vue";
import { useCalendarStore } from "@/stores/calendarStore";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
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
    const parseToDayjs = (dateValue: any) => {
      if (Array.isArray(dateValue) && dateValue.length > 0) {
        return dayjs(dateValue[0]);
      }
      if (typeof dateValue === "string") {
        return dayjs(dateValue, "DD/MM/YYYY");
      }
      return dayjs(dateValue);
    };

    const weekIdOfCurrent = (targetDate.day() + 6) % 7; // Convert Sunday=0 to Monday=0

    return calendarStore.events
      .filter((event) => {
        const eventStartDate = parseToDayjs(event.startDate);
        const eventEndDate = parseToDayjs(event.endDate ?? event.startDate);

        // Check if date range matches
        const inRange = targetDate.isBetween(
          eventStartDate,
          eventEndDate,
          "day",
          "[]"
        );

        if (!inRange) return false;

        // If weeklySchedules defined, ensure current weekday is selected
        if (event.weeklySchedules && event.weeklySchedules.length > 0) {
          return event.weeklySchedules.some(
            (ws) => ws.weekId === weekIdOfCurrent
          );
        }

        // Otherwise show for all days in range
        return true;
      })
      .map((event) => {
        let time = event.startTime || "All day";
        if (event.weeklySchedules && event.weeklySchedules.length > 0) {
          const ws = event.weeklySchedules.find(
            (w) => w.weekId === weekIdOfCurrent
          );
          if (ws && ws.startTime) time = ws.startTime;
        }
        return {
          id: event.id,
          title: calendarStore.getEventTitle(event),
          time,
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
        date: `${date.getFullYear()}-${date.getMonth()}-${dayNumber}`,
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
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${i}`,
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
        date: `${date.getFullYear()}-${date.getMonth() + 2}-${i}`,
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
