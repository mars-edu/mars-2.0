<template>
  <div class="min-h-screen bg-gray-50">
    <Header
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      @language-change="handleLanguageChange"
    />
    <div class="max-w-6xl mx-auto px-4 py-5 bg-white rounded-lg shadow-sm">
      <!-- Navigation tabs -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            v-for="tab in ['day', 'week', 'month', 'year']"
            :key="tab"
            class="px-6 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{
              'bg-white shadow-sm text-gray-900': activeTab === tab,
              'text-gray-500 hover:bg-gray-200': activeTab !== tab,
            }"
            @click="activeTab = tab"
          >
            {{
              { day: "День", week: "Неделя", month: "Месяц", year: "Год" }[tab]
            }}
          </button>
        </div>
        <div class="flex items-center bg-gray-100 rounded-full pl-4 pr-2 py-1">
          <i class="f7-icons text-gray-400 text-lg mr-2">search</i>
          <input
            type="text"
            placeholder="Поиск"
            class="bg-transparent outline-none text-sm w-48 placeholder-gray-400"
          />
        </div>
      </div>

      <!-- Calendar header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ monthName }} {{ year }}г.
        </h1>
        <div class="text-2xl font-bold uppercase text-gray-900">
          ПЛАНИРОВАНИЕ
        </div>
        <button
          @click="goToToday"
          class="flex items-center hover:bg-gray-100 rounded-lg p-2 transition-colors"
        >
          <span
            class="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center mr-2"
          >
            {{ todayDate }}
          </span>
          <span class="text-red-600 font-semibold">Сегодня</span>
        </button>
      </div>

      <!-- Calendar grid -->
      <div
        class="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200"
      >
        <!-- Weekday headers -->
        <div
          v-for="day in ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']"
          :key="day"
          class="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-500"
        >
          {{ day }}
        </div>

        <!-- Calendar days -->
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="bg-white min-h-32 p-2 relative group"
          :class="{
            'bg-gray-50': [5, 6].includes(new Date(day.date).getDay()),
            'hover:bg-gray-100': !day.isToday,
          }"
        >
          <div
            class="text-sm mb-2"
            :class="{
              'text-gray-400': !day.isCurrentMonth,
              'text-white': day.isToday,
            }"
          >
            <span
              v-if="day.isToday"
              class="w-7 h-7 bg-red-600 rounded-full inline-flex items-center justify-center"
            >
              {{ day.dayNumber }}
            </span>
            <span v-else>
              {{ day.dayNumber }}
            </span>
          </div>
          <div class="space-y-1">
            <div
              v-for="(event, index) in day.events"
              :key="`${day.date}-${index}`"
              class="text-xs p-2 rounded-md truncate border-l-2"
              :class="{
                'bg-green-50 border-l-green-600': event.type === 'class',
                'bg-blue-50 border-l-blue-500': event.type === 'history',
                'bg-yellow-50 border-l-yellow-500': event.type === 'language',
                'bg-purple-50 border-l-purple-500': event.type === 'task',
              }"
            >
              <div class="font-medium text-gray-700">{{ event.title }}</div>
              <div class="text-gray-500">{{ event.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { f7, f7ready } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import { useLanguage } from "@/composables/useLanguage";

// Define interfaces for our calendar data
interface CalendarEvent {
  title: string;
  time: string;
  type: string;
}

interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const year = ref("2025");
const monthIndex = ref(1); // February (0-indexed)
const searchbarEnabled = ref(false);
const activeTab = ref("month");
const todayDate = ref("28");

// Language management
const { activeLanguage, availableLanguages, setLanguage } = useLanguage();

// Get route params when component is mounted
onMounted(() => {
  f7ready(() => {
    const currentRoute = f7.views.main.router.currentRoute;
    if (currentRoute.params) {
      year.value = currentRoute.params.year || "2025";
      monthIndex.value = parseInt(currentRoute.params.month || "2") - 1;
    }
  });
});

// Function to navigate back
const goBack = () => {
  window.location.href = "/";
};

// Function to go to today
const goToToday = () => {
  // Logic to navigate to today's date
  console.log("Navigate to today");
};

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

    // Existing events...
    // Add new tasks below

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

    // Keep existing events...
    // Existing event conditions remain here...

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
</script>

<style scoped>
/* Remove most custom CSS as we're using Tailwind now */
.calendar-day:nth-child(7n),
.calendar-day:nth-child(7n-1) {
  @apply bg-gray-50;
}

.event {
  @apply transition-transform duration-200;
}
.event:hover {
  @apply translate-x-1;
}
</style>
