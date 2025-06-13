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

    <f7-page-content @mousemove="handleMouseMove" class="planning-content">
      <!-- Sidebar with transition (when activated by button) -->
      <transition name="slide">
        <Sidebar
          v-if="isSidebarVisible || isMouseInLeftCorner || isSidebarHovered"
          v-model:activeNavItem="activeNavItem"
          @mouseenter="handleSidebarMouseEnter"
          @mouseleave="handleSidebarMouseLeave"
        />
      </transition>

      <!-- Teleported sidebar for mouse hover (popover style) -->
      <Teleport to="body">
        <transition name="fade">
          <Sidebar
            v-if="(isMouseInLeftCorner || isSidebarHovered) && !isSidebarVisible"
            v-model:activeNavItem="activeNavItem"
            @mouseenter="handleSidebarMouseEnter"
            @mouseleave="handleSidebarMouseLeave"
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
        class="calendar-container p-2"
        :class="{ 'pl-56': isSidebarVisible }"
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
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { f7, f7ready, f7Page, f7PageContent } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import { useCalendar } from "@/composables/useCalendar";
import CalendarToolbar from "@/components/Calendar/CalendarToolbar.vue";
import CalendarNavigation from "@/components/Calendar/CalendarNavigation.vue";
import CalendarHeader from "@/components/Calendar/CalendarHeader.vue";
import CalendarGrid from "@/components/Calendar/CalendarGrid.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";

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

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const onPageInit = () => {
  console.log("Planning page initialized");
};

const onPageMounted = () => {
  console.log("Planning page mounted");
};

onMounted(() => {
  f7ready(() => {
    const currentRoute = f7.views.main.router.currentRoute;
    if (currentRoute.params) {
      setYear(currentRoute.params.year || "2025");
      setMonth(parseInt(currentRoute.params.month || "2") - 1);
    }
  });
});


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
.desktop-header-container {
  flex-shrink: 0;
}

.planning-content {
  display: flex;
  overflow: hidden;
  height: calc(100vh - 80px);
}

.calendar-container {
  max-width: 1400px;
  margin: 0 auto;
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

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
  background-color: hsl(var(--card));
  border-right: 1px solid hsl(var(--border));
  width: 13rem;
}

/* Absolute positioning for sidebar on hover */
.sidebar-absolute {
  position: absolute;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  background-color: hsl(var(--card));
  border-right: 1px solid hsl(var(--border));
}
</style>
