import { computed, ref } from "vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useJournalStore } from "@/stores/journalStore";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import isBetween from "dayjs/plugin/isBetween";
import { isEventOnDate } from "@/utils/eventDate";

dayjs.extend(isBetween);

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  group?: string; // course and group info like "2 курс // 2 ДСФ"
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
  const now = new Date();
  const year = ref(now.getFullYear().toString());
  const monthIndex = ref(now.getMonth());
  const activeTab = ref("month");
  const todayDate = ref(now.getDate().toString());
  const searchQuery = ref("");

  const calendarStore = useCalendarStore();
  const educationScheduleStore = useEducationScheduleStore();
  const journalStore = useJournalStore();

  const setYear = (newYear: string) => {
    year.value = newYear;
  };

  const setMonth = (newMonth: number) => {
    monthIndex.value = newMonth;
  };

  const setActiveTab = (tab: string) => {
    activeTab.value = tab;
  };

  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
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

    return calendarStore.filteredEvents
      .filter((event) => {
        return isEventOnDate(event as any, targetDate);
      })
      .map((event) => {
        let time = event.startTime || "...";

        // Prefer weekly schedule slots if present. Use direct ID lookup instead of
        // "active year" schedules to avoid showing "..." while active year loads.
        if (Array.isArray(event.weeklySchedules) && event.weeklySchedules.length > 0) {
          const ws = event.weeklySchedules.find((w) => w.weekId === weekIdOfCurrent);
          if (ws) {
            const start =
              (ws as any).startTime ||
              ((ws as any).startId
                ? educationScheduleStore.getScheduleById((ws as any).startId)?.startTime
                : "");
            const end =
              (ws as any).endTime ||
              ((ws as any).endId
                ? educationScheduleStore.getScheduleById((ws as any).endId)?.endTime
                : "");

            if (start || end) {
              time = [start, end].filter(Boolean).join("-");
            }
          }
        }

        // Get group information from journal
        let group: string | undefined = undefined;
        const journal = journalStore.getJournalById(event.id);
        if (journal) {
          group = journalStore.getJournalSubtitle(journal);
        }

        return {
          id: event.id,
          title: calendarStore.getEventTitle(event),
          time,
          group,
          color: event.color, // pass through the color from store event
        };
      })
      .filter((eventInfo) => {
        if (!searchQuery.value) return true;
        const q = searchQuery.value.toLowerCase();
        return (
          eventInfo.title.toLowerCase().includes(q) ||
          (eventInfo.group && eventInfo.group.toLowerCase().includes(q))
        );
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
    setSearchQuery,
  };
}
