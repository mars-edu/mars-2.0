<template>
  <div class="min-h-screen bg-gray-50">
    <Header
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      @language-change="handleLanguageChange"
    />
    <div
      ref="calendarContainer"
      class="max-w-6xl mx-auto px-4 py-5 bg-white rounded-lg shadow-sm max-h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden"
    >
      <!-- Calendar toolbar with navigation -->
      <CalendarToolbar
        :icons="toolbarIcons"
        :search-placeholder="'Найти'"
        @icon-click="handleIconClick"
        @search="handleSearch"
      >
        <template #navigation>
          <CalendarNavigation v-model="activeTab" :tabs="navigationTabs" />
        </template>
      </CalendarToolbar>

      <!-- Add Event Popover -->
      <Popover v-model:open="isAddPopoverOpen">
        <PopoverContent class="w-80">
          <div class="grid gap-4">
            <div class="space-y-2">
              <h4 class="font-medium leading-none">Добавить событие</h4>
              <p class="text-sm text-muted-foreground">
                Заполните детали нового события
              </p>
            </div>
            <div class="grid gap-2">
              <div class="grid grid-cols-3 items-center gap-4">
                <label for="title">Название</label>
                <input
                  id="title"
                  type="text"
                  placeholder="Название события"
                  class="col-span-2 h-8"
                />
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <label for="date">Дата</label>
                <input id="date" type="date" class="col-span-2 h-8" />
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <label for="time">Время</label>
                <input id="time" type="time" class="col-span-2 h-8" />
              </div>
              <div class="flex justify-end gap-2 mt-2">
                <button
                  class="px-3 py-1 border rounded-md"
                  @click="isAddPopoverOpen = false"
                >
                  Отмена
                </button>
                <button
                  class="px-3 py-1 bg-blue-500 text-white rounded-md"
                  @click="addEvent"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <!-- Calendar header -->
      <CalendarHeader
        :month-name="monthName"
        :year="year"
        :today-date="todayDate"
        @today="goToToday"
      />

      <!-- Calendar views based on active tab -->
      <div v-if="activeTab === 'month'">
        <CalendarGrid :days="calendarDays" :weekdays="weekdays" />
      </div>

      <div v-else-if="activeTab === 'week'">
        <div class="p-4 text-center text-gray-500">
          Представление недель в разработке
        </div>
      </div>

      <div v-else-if="activeTab === 'day'">
        <!-- Day view component will go here -->
        <div class="p-4 text-center text-gray-500">
          Представление дня в разработке
        </div>
      </div>

      <div v-else-if="activeTab === 'year'">
        <!-- Year view component will go here -->
        <div class="p-4 text-center text-gray-500">
          Представление года в разработке
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { f7, f7ready } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import { useLanguage } from "@/composables/useLanguage";
import { useCalendar } from "@/composables/useCalendar";
import CalendarToolbar from "@/components/Calendar/CalendarToolbar.vue";
import CalendarNavigation from "@/components/Calendar/CalendarNavigation.vue";
import CalendarHeader from "@/components/Calendar/CalendarHeader.vue";
import CalendarGrid from "@/components/Calendar/CalendarGrid.vue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Search state
const searchbarEnabled = ref(false);
const calendarContainer = ref<HTMLElement | null>(null);
const isAddPopoverOpen = ref(false);

// Language management
const { activeLanguage, availableLanguages, setLanguage } = useLanguage();

// Calendar management
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

// Toolbar icons
const toolbarIcons = [
  { name: "sidebar_left", value: "sidebar" },
  { name: "list_bullet", value: "list" },
];

// Navigation tabs
const navigationTabs = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
];

// Weekdays
const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Get route params when component is mounted
onMounted(() => {
  f7ready(() => {
    const currentRoute = f7.views.main.router.currentRoute;
    if (currentRoute.params) {
      setYear(currentRoute.params.year || "2025");
      setMonth(parseInt(currentRoute.params.month || "2") - 1);
    }
  });
});

// Event handlers for Header component
const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

const handleLanguageChange = (code: string) => {
  setLanguage(code);
};

// Event handlers for toolbar
const handleIconClick = (value: string) => {
  console.log(`Icon clicked: ${value}`);
  if (value === "add") {
    isAddPopoverOpen.value = true;
  }
};

const handleSearch = (query: string) => {
  console.log(`Search query: ${query}`);
  // Implement search functionality
};

// Add event handler
const addEvent = () => {
  // Implement event adding functionality
  console.log("Adding new event");
  isAddPopoverOpen.value = false;
};
</script>
