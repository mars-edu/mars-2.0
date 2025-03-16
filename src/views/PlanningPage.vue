<template>
  <div class="h-screen bg-gray-50 flex flex-col" @mousemove="handleMouseMove">
    <Header
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      @language-change="handleLanguageChange"
      class="flex-shrink-0"
    />
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar with transition (when activated by button) -->
      <transition name="slide">
        <Sidebar
          v-if="isSidebarVisible || isMouseInLeftCorner || isSidebarHovered"
          v-model:activeNavItem="activeNavItem"
          @mouseenter="handleSidebarMouseEnter"
          @mouseleave="handleSidebarMouseLeave"
          class="h-[calc(100vh-64px)] flex-shrink-0"
          :class="{
            'sidebar-absolute':
              (isMouseInLeftCorner || isSidebarHovered) && !isSidebarVisible,
          }"
        />
      </transition>

      <!-- Teleported sidebar for mouse hover (popover style) -->
      <Teleport to="body">
        <transition name="fade">
          <Sidebar
            v-if="
              (isMouseInLeftCorner || isSidebarHovered) && !isSidebarVisible
            "
            v-model:activeNavItem="activeNavItem"
            @mouseenter="handleSidebarMouseEnter"
            @mouseleave="handleSidebarMouseLeave"
            class="sidebar-popover h-[calc(100vh-64px)]"
          />
        </transition>
      </Teleport>

      <!-- Left corner detection area -->
      <div
        class="left-corner-detector"
        @mouseenter="isHoveringLeftCorner = true"
        @mouseleave="isHoveringLeftCorner = false"
      ></div>

      <div
        ref="calendarContainer"
        class="max-w-6xl mx-auto px-4 py-5 bg-white rounded-lg shadow-sm flex-1 overflow-y-auto overflow-x-hidden"
      >
        <!-- Calendar toolbar with navigation -->
        <CalendarToolbar
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
          @previous-month="previousMonth"
          @next-month="nextMonth"
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { Teleport } from "vue";
import { f7, f7ready } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import { useLanguage } from "@/composables/useLanguage";
import { useCalendar } from "@/composables/useCalendar";
import CalendarToolbar from "@/components/Calendar/CalendarToolbar.vue";
import CalendarNavigation from "@/components/Calendar/CalendarNavigation.vue";
import CalendarHeader from "@/components/Calendar/CalendarHeader.vue";
import CalendarGrid from "@/components/Calendar/CalendarGrid.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Search state
const searchbarEnabled = ref(false);
const calendarContainer = ref<HTMLElement | null>(null);
const isAddPopoverOpen = ref(false);
const isSidebarVisible = ref(false);
const activeNavItem = ref("calendar");

// Mouse position tracking
const isMouseInLeftCorner = ref(false);
const isHoveringLeftCorner = ref(false);
const mouseTrackingThreshold = 25; // pixels from left edge

// Insert the following new reactive variable and handlers
const isSidebarHovered = ref(false);
const handleSidebarMouseEnter = () => {
  isSidebarHovered.value = true;
};
const handleSidebarMouseLeave = () => {
  isSidebarHovered.value = false;
};

// Watch for hovering in left corner
watch(isHoveringLeftCorner, (newValue) => {
  if (newValue) {
    isMouseInLeftCorner.value = true;
  } else {
    // Add small delay before hiding to prevent flicker
    setTimeout(() => {
      isMouseInLeftCorner.value = false;
    }, 300);
  }
});

// Handle mouse movement detection
const handleMouseMove = (event: MouseEvent) => {
  // Only track when sidebar isn't already visible from button click
  if (!isSidebarVisible.value) {
    // Check if mouse is in the left corner
    const isInLeftCorner = event.clientX < mouseTrackingThreshold;
    if (
      isInLeftCorner !== isMouseInLeftCorner.value &&
      !isHoveringLeftCorner.value
    ) {
      isMouseInLeftCorner.value = isInLeftCorner;
    }
  }
};

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

// Add functions for month navigation
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
  } else if (value === "sidebar") {
    isSidebarVisible.value = !isSidebarVisible.value;
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

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* Fade transition for popover */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Left corner detector styling */
.left-corner-detector {
  position: fixed;
  top: 64px;
  left: 0;
  width: 20px;
  height: calc(100vh - 64px);
  z-index: 10;
}

/* Sidebar popover styling */
.sidebar-popover {
  position: fixed;
  top: 64px;
  left: 0;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  background-color: white;
  border-right: 1px solid #e5e7eb;
  width: 13rem;
}

/* Absolute positioning for sidebar on hover */
.sidebar-absolute {
  position: absolute;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  background-color: white;
  border-right: 1px solid #e5e7eb;
}
</style>
