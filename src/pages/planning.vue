<template>
  <f7-page
    name="planning"
    @page:init="onPageInit"
    @page:mounted="onPageMounted"
    class="bg-background"
  >
    <div class="desktop-header-container">
      <Header />
    </div>

    <f7-page-content class="planning-content">
      <Sidebar v-model:activeNavItem="activeNavItem" />

      <div ref="calendarContainer" class="calendar-container p-6 md:p-8 transition-all duration-200" :class="contentMargin">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-foreground tracking-tight">{{ planning_title() }}</h1>
            <p class="text-sm text-muted-foreground font-medium mt-1">
              {{ planning_subtitle() }} • {{ activeAcademicYearName }} • {{ activeSemesterName }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <CalendarToolbar
              :search-placeholder="planning_search()"
              :month-name="monthName"
              :year="year"
              :today-date="todayDate"
              @search="handleSearch"
              @event-added="addEvent"
              @today="goToToday"
              @previous-month="previousMonth"
              @next-month="nextMonth"
            />
          </div>
        </div>

        <div v-if="userStore.isAdmin" class="mb-3 flex justify-end">
          <Select
            v-model="selectedTeacherId"
            :options="teacherOptions"
            :placeholder="planning_teacher()"
            name="teacher"
            class="w-[250px]"
            :searchable="true"
          />
        </div>

        <!-- Calendar views based on active tab -->
        <div v-if="activeTab === 'month'" class="flex-1 flex flex-col min-h-0">
          <CalendarGrid
            :days="calendarDays"
            :weekdays="weekdays"
            :selected-event-id="selectedEvent?.id ?? null"
            @event-click="handleEventClick"
          />
        </div>

        <div v-else-if="activeTab === 'week'" class="flex-1 bg-card rounded-[24px] shadow-sm border border-border p-4 text-center text-muted-foreground">
          {{ planning_week_in_dev() }}
        </div>

        <div v-else-if="activeTab === 'day'" class="flex-1 bg-card rounded-[24px] shadow-sm border border-border p-4 text-center text-muted-foreground">
          <!-- Day view component will go here -->
          {{ planning_day_in_dev() }}
        </div>

        <div v-else-if="activeTab === 'year'" class="flex-1 bg-card rounded-[24px] shadow-sm border border-border p-4 text-center text-muted-foreground">
          <!-- Year view component will go here -->
          {{ planning_year_in_dev() }}
        </div>
      </div>
    </f7-page-content>
  </f7-page>

  <EditEventPopover
    v-if="selectedEventId"
    :event-id="selectedEventId"
    @updated="handleEventUpdated"
    @cancel="selectedEventId = null"
  />

  <JournalPreviewPopover
    v-if="selectedEvent"
    :event="selectedEvent"
    @go-to="goToJournalDetails"
    @edit="openEditPopoverFromPreview"
    @cancel="selectedEvent = null"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from "vue";
import { f7, f7ready, f7Page, f7PageContent } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import { useCalendar } from "@/composables/useCalendar";
import CalendarToolbar from "@/components/Calendar/CalendarToolbar.vue";
import CalendarNavigation from "@/components/Calendar/CalendarNavigation.vue";
import CalendarGrid from "@/components/Calendar/CalendarGrid.vue";
import EditEventPopover from "@/components/Calendar/EditEventPopover.vue";
import JournalPreviewPopover from "@/components/Calendar/JournalPreviewPopover.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import { type CalendarEvent as UseCalendarEvent } from "@/composables/useCalendar";
import { type CalendarEvent as StoreCalendarEvent } from "@/stores/calendarStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useUserStore } from "@/stores/userStore";
import { useTeacherStore } from "@/stores/teacherStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useSidebar } from "@/composables/useSidebar";
import * as m from "@/paraglide/messages";
import dayjs from "dayjs";
import {
  planning_title,
  planning_subtitle,
  planning_teacher,
  planning_search,
  planning_week_in_dev,
  planning_day_in_dev,
  planning_year_in_dev,
  planning_tab_day,
  planning_tab_week,
  planning_tab_month,
  planning_tab_year,
  f7_week_abbr_mon,
  f7_week_abbr_tue,
  f7_week_abbr_wed,
  f7_week_abbr_thu,
  f7_week_abbr_fri,
  f7_week_abbr_sat,
  f7_week_abbr_sun,
  common_all,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();
const { contentMargin } = useSidebar();
const calendarContainer = ref<HTMLElement | null>(null);
const activeNavItem = ref("calendar");

const selectedEvent = ref<StoreCalendarEvent | null>(null);
const selectedEventId = ref<string | null>(null);
const calendarStore = useCalendarStore();
const userStore = useUserStore();
const teacherStore = useTeacherStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();

const activeAcademicYearName = computed(() => {
  return academicYearStore.getActiveAcademicYear?.name || `${dayjs().year()}-${dayjs().year() + 1}`;
});

const activeSemesterName = computed(() => {
  const currentSemester = academicYearSemesterStore.academicYearSemesters.find((s) =>
    academicYearSemesterStore.isSemesterActive(s)
  );

  if (currentSemester) {
    return m.journal_semester_label({ number: currentSemester.semesterNumber });
  }

  const activeYearSemester = academicYearSemesterStore.getActiveAcademicYearSemester;
  if (activeYearSemester) {
    return m.journal_semester_label({ number: activeYearSemester.semesterNumber });
  }

  const month = dayjs().month();
  const fallbackNumber = month >= 8 || month <= 0 ? 1 : 2;
  return m.journal_semester_label({ number: fallbackNumber });
});

const {
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
} = useCalendar();

const previousMonth = () => {
  let newMonth = monthIndex.value - 1;
  let newYear = parseInt(year.value);

  if (newMonth < 0) {
    newMonth = 11;
    newYear -= 1;
  }

  setMonth(newMonth);
  setYear(newYear.toString());
};

const nextMonth = () => {
  let newMonth = monthIndex.value + 1;
  let newYear = parseInt(year.value);

  if (newMonth > 11) {
    newMonth = 0;
    newYear += 1;
  }

  setMonth(newMonth);
  setYear(newYear.toString());
};

const navigationTabs = [
  { value: "day", label: planning_tab_day() },
  { value: "week", label: planning_tab_week() },
  { value: "month", label: planning_tab_month() },
  { value: "year", label: planning_tab_year() },
];

const weekdays = computed(() => {
  void locale;
  return [
    f7_week_abbr_mon(), f7_week_abbr_tue(), f7_week_abbr_wed(),
    f7_week_abbr_thu(), f7_week_abbr_fri(), f7_week_abbr_sat(), f7_week_abbr_sun()
  ];
});

const selectedTeacherId = computed({
  get: () => calendarStore.selectedTeacherId || "all",
  set: (value: string) => calendarStore.setSelectedTeacher(value === "all" ? null : value),
});

const teacherOptions = computed(() => {
  void locale;
  return [
    { value: "all", text: common_all() },
    ...teacherStore.teacherSelectOptions,
  ];
});

// Note: Role-based event filtering is now handled entirely by the Convex backend.
// - Admins can see all events or filter by selectedTeacherId using the dropdown
// - Teachers automatically see only their own events (enforced by backend)
// The effectiveTeacherId computed is no longer needed as the backend handles this logic.

const onPageInit = () => {
  console.log("Planning page initialized");
};

const onPageMounted = () => {
  console.log("Planning page mounted");
};

onMounted(() => {
  f7ready(() => {
  });
});

// Toolbar icon-click handler removed

const handleSearch = (query: string) => {
  console.log(`Search query: ${query}`);
};

const addEvent = (event: any) => {
  // For now, simply log the event and ensure any needed UI refresh happens automatically via store reactivity
  console.log("New event added", event);
};

const handleEventClick = async (
  eventData: UseCalendarEvent,
  evt: MouseEvent
) => {
  const fullEvent = calendarStore.getEventById(eventData.id);
  if (fullEvent) {
    selectedEvent.value = fullEvent;
  } else {
    // Fallback to minimal data if not found
    selectedEvent.value = eventData as unknown as StoreCalendarEvent;
  }

  await nextTick();

  const targetEl =
    (evt.currentTarget as HTMLElement) || (evt.target as HTMLElement);
  f7.popover.open("#journal-preview-popover", targetEl);
};

const handleEventUpdated = async (updatedEvent: any) => {
  selectedEvent.value = null;
  selectedEventId.value = null;
};

const goToJournalDetails = (id: number | string) => {
  f7.views.main.router.navigate(`/journals/${id}?from=schedule`);
};

const openEditPopoverFromPreview = async () => {
  if (selectedEvent.value) {
    selectedEventId.value = selectedEvent.value.id;
  }
  await nextTick();
  if (selectedEventId.value) {
    f7.popover.open("#edit-event-popover");
  }
};
</script>

<style scoped>
.desktop-header-container {
  flex-shrink: 0;
}

.planning-content {
  display: flex;
  overflow: hidden;
  height: calc(100vh - 80px);
}

.calendar-container {
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
