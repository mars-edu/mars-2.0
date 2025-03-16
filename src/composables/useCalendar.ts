import { computed, ref } from "vue";

export interface CalendarEvent {
  title: string;
  time: string;
  type: string;
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
      days.push({
        date: `${date.getFullYear()}-${date.getMonth()}-${dayNumber}`,
        dayNumber,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const isToday =
        today.getDate() === i &&
        today.getMonth() === date.getMonth() &&
        today.getFullYear() === date.getFullYear();

      // Sample events data - in a real app, this would come from an API or store
      const events: CalendarEvent[] = [];

      // New tasks for Mondays
      if (
        (i === 2 || i === 9 || i === 16 || i === 23) &&
        monthIndex.value === 1
      ) {
        events.push({
          title: "История Казахстана",
          time: "09:00",
          type: "task",
        });
      }

      // New language practice tasks
      if (
        (i === 4 || i === 11 || i === 18 || i === 25) &&
        monthIndex.value === 1
      ) {
        events.push({
          title: "Всемирная история",
          time: "16:00",
          type: "language",
        });
      }

      // Additional history tasks
      if (
        (i === 5 || i === 12 || i === 19 || i === 26) &&
        monthIndex.value === 1
      ) {
        events.push({
          title: "Культорология",
          time: "11:30",
          type: "task",
        });
      }

      days.push({
        date: `${date.getFullYear()}-${date.getMonth() + 1}-${i}`,
        dayNumber: i,
        isCurrentMonth: true,
        isToday,
        events,
      });
    }

    // Add days from next month to complete the grid (6 rows x 7 columns = 42 cells)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: `${date.getFullYear()}-${date.getMonth() + 2}-${i}`,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        events: [],
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
