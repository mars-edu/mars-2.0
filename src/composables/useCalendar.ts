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

  // ── Pre-resolve event metadata ─────────────────────────────────────────────
  // Recomputes only when filteredEvents, educationScheduleStore, or journalStore
  // change — NOT on year/monthIndex or searchQuery changes.
  // Cost: O(N_events) store reads, executed once per event-list update.
  type ResolvedEventInfo = {
    title: string;
    group?: string;
    /** weekId (Mon=0 … Sun=6) → "HH:mm-HH:mm" time string */
    weekTimeMap: Map<number, string>;
    defaultTime: string;
    color?: string;
  };

  const resolvedEventInfoMap = computed<Map<string, ResolvedEventInfo>>(() => {
    const map = new Map<string, ResolvedEventInfo>();

    for (const event of calendarStore.filteredEvents) {
      const weekTimeMap = new Map<number, string>();

      if (Array.isArray(event.weeklySchedules) && event.weeklySchedules.length > 0) {
        for (const ws of event.weeklySchedules as any[]) {
          const start =
            ws.startTime ||
            (ws.startId
              ? educationScheduleStore.getScheduleById(ws.startId)?.startTime
              : "");
          const end =
            ws.endTime ||
            (ws.endId
              ? educationScheduleStore.getScheduleById(ws.endId)?.endTime
              : "");
          if (start || end) {
            weekTimeMap.set(ws.weekId, [start, end].filter(Boolean).join("-"));
          }
        }
      }

      const journal = journalStore.getJournalById(event.id);
      const group = journal ? journalStore.getJournalSubtitle(journal) : undefined;

      map.set(event.id, {
        title: calendarStore.getEventTitle(event),
        group,
        weekTimeMap,
        defaultTime: event.startTime || "...",
        color: event.color,
      });
    }

    return map;
  });

  // ── Calendar grid (unfiltered) ─────────────────────────────────────────────
  // Recomputes when year/monthIndex change or when the event list changes.
  // Uses resolvedEventInfoMap so inner-loop work is pure date arithmetic (O(1)
  // map lookup) — no store reads per calendar cell.
  const calendarDaysBase = computed<CalendarDay[]>(() => {
    const infoMap = resolvedEventInfoMap.value;
    const events = calendarStore.filteredEvents;

    const getEventsForDate = (targetDate: dayjs.Dayjs): CalendarEvent[] => {
      const weekIdOfCurrent = (targetDate.day() + 6) % 7; // Mon=0 … Sun=6

      return events
        .filter((event) => isEventOnDate(event as any, targetDate))
        .flatMap((event): CalendarEvent[] => {
          const info = infoMap.get(event.id);
          if (!info) return [];
          const time = info.weekTimeMap.get(weekIdOfCurrent) ?? info.defaultTime;
          return [{
            id: event.id,
            title: info.title,
            time,
            group: info.group,
            color: info.color,
          }];
        });
    };

    const days: CalendarDay[] = [];
    const date = new Date(parseInt(year.value), monthIndex.value, 1);
    const today = new Date();

    const firstDay = new Date(date);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNumber = prevMonthLastDay - i;
      const prevMonthDate = dayjs(new Date(date.getFullYear(), date.getMonth() - 1, dayNumber));
      days.push({
        date: prevMonthDate.format(DATE_STORAGE_FORMAT),
        dayNumber,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(prevMonthDate),
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const isToday =
        today.getDate() === i &&
        today.getMonth() === date.getMonth() &&
        today.getFullYear() === date.getFullYear();
      const currentDate = dayjs(new Date(parseInt(year.value), monthIndex.value, i));
      days.push({
        date: currentDate.format(DATE_STORAGE_FORMAT),
        dayNumber: i,
        isCurrentMonth: true,
        isToday,
        events: getEventsForDate(currentDate),
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDate = dayjs(new Date(date.getFullYear(), date.getMonth() + 1, i));
      days.push({
        date: nextMonthDate.format(DATE_STORAGE_FORMAT),
        dayNumber: i,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(nextMonthDate),
      });
    }

    return days;
  });

  // ── Search filter layer ────────────────────────────────────────────────────
  // Separated so that typing in the search box only triggers a shallow O(42 × M)
  // filter over already-built CalendarDay objects — it does NOT rebuild the grid
  // or re-read any store. calendarDaysBase stays cached.
  const calendarDays = computed<CalendarDay[]>(() => {
    if (!searchQuery.value) return calendarDaysBase.value;

    const q = searchQuery.value.toLowerCase();
    return calendarDaysBase.value.map((day) => ({
      ...day,
      events: day.events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.group && e.group.toLowerCase().includes(q))
      ),
    }));
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
