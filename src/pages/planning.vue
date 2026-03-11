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

      <div ref="calendarContainer" class="calendar-container p-2 transition-all duration-200" :class="contentMargin">
        <div class="mb-4 px-1">
          <h1 class="text-2xl font-bold text-foreground tracking-tight">{{ planning_title() }}</h1>
          <p class="text-sm text-muted-foreground font-medium mt-0.5">{{ planning_subtitle() }}</p>
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
        >
          <template #navigation>
            <CalendarNavigation v-model="activeTab" :tabs="navigationTabs" />
          </template>
        </CalendarToolbar>

        <!-- Calendar header removed -->

        <!-- Calendar views based on active tab -->
        <div v-if="activeTab === 'month'">
          <CalendarGrid
            :days="calendarDays"
            :weekdays="weekdays"
            :selected-event-id="selectedEvent?.id ?? null"
            @event-click="handleEventClick"
          />
        </div>

        <div v-else-if="activeTab === 'week'">
          <div class="p-4 text-center text-muted-foreground">
            {{ planning_week_in_dev() }}
          </div>
        </div>

        <div v-else-if="activeTab === 'day'">
          <!-- Day view component will go here -->
          <div class="p-4 text-center text-muted-foreground">
            {{ planning_day_in_dev() }}
          </div>
        </div>

        <div v-else-if="activeTab === 'year'">
          <!-- Year view component will go here -->
          <div class="p-4 text-center text-muted-foreground">
            {{ planning_year_in_dev() }}
          </div>
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
import { useSidebar } from "@/composables/useSidebar";
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

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const selectedTeacherId = computed({
  get: () => calendarStore.selectedTeacherId || "all",
  set: (value: string) => calendarStore.setSelectedTeacher(value === "all" ? null : value),
});

const teacherOptions = computed(() => [
  { value: "all", text: "Все" },
  ...teacherStore.teacherSelectOptions,
]);

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
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
