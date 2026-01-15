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

      <div ref="calendarContainer" class="calendar-container p-2 md:ml-32">
        <div v-if="userStore.isAdmin" class="mb-3 flex justify-end">
          <Select
            v-model="selectedTeacherId"
            :options="teacherOptions"
            placeholder="Преподаватель:"
            name="teacher"
            class="w-[250px]"
            :searchable="true"
          />
        </div>
        <CalendarToolbar
          :search-placeholder="'Найти'"
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
            Представление недель в разработке
          </div>
        </div>

        <div v-else-if="activeTab === 'day'">
          <!-- Day view component will go here -->
          <div class="p-4 text-center text-muted-foreground">
            Представление дня в разработке
          </div>
        </div>

        <div v-else-if="activeTab === 'year'">
          <!-- Year view component will go here -->
          <div class="p-4 text-center text-muted-foreground">
            Представление года в разработке
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
import { onMounted, ref, computed, watch, nextTick } from "vue";
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

const calendarContainer = ref<HTMLElement | null>(null);
const activeNavItem = ref("calendar");

const selectedEvent = ref<StoreCalendarEvent | null>(null);
const selectedEventId = ref<string | null>(null);
const calendarStore = useCalendarStore();
const userStore = useUserStore();
const teacherStore = useTeacherStore();

// Sidebar is always visible; hover/teleport behavior removed

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
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
];

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const selectedTeacherId = computed({
  get: () => calendarStore.selectedTeacherId || "",
  set: (value: string) => calendarStore.setSelectedTeacher(value || null),
});

const teacherOptions = computed(() => teacherStore.teacherSelectOptions);

const effectiveTeacherId = computed(() => {
  if (userStore.isAdmin) {
    return calendarStore.selectedTeacherId || undefined;
  }
  if (userStore.isTeacher) {
    return userStore.currentUser?.id;
  }
  return undefined;
});

const onPageInit = () => {
  console.log("Planning page initialized");
};

const onPageMounted = () => {
  console.log("Planning page mounted");
};

watch(
  () => teacherStore.teachers,
  (teachers) => {
    if (userStore.isTeacher && userStore.currentUser?.id && !calendarStore.selectedTeacherId) {
      const teacher = teacherStore.getTeacherByUserId(userStore.currentUser.id);
      if (teacher) {
        calendarStore.setSelectedTeacher(teacher.id);
      }
    }
  },
  { immediate: true }
);

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
