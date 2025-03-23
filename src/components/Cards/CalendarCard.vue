<template>
  <div class="bg-white rounded-lg shadow-sm overflow-hidden">
    <div class="p-4">
      <!-- Calendar Header -->
      <div class="flex justify-between mb-4">
        <div class="flex items-center space-x-3">
          <h2 class="text-sm font-medium text-gray-900 w-full">
            {{ currentMonthYear }}
          </h2>
          <button
            class="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
            @click="navigateToPlanning"
          >
            <i class="f7-icons text-xs">calendar_badge_plus</i>
            <span>планирование</span>
          </button>
        </div>
        <div class="flex space-x-1 items-center">
          <button
            class="p-1 hover:bg-gray-100 rounded transition-colors"
            @click="previousMonth"
          >
            <i class="f7-icons text-gray-600 text-sm">chevron_left</i>
          </button>
          <button
            class="p-1 hover:bg-gray-100 rounded transition-colors"
            @click="nextMonth"
          >
            <i class="f7-icons text-gray-600 text-sm">chevron_right</i>
          </button>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-y-2">
        <!-- Weekday Headers -->
        <div
          v-for="day in weekDays"
          :key="day"
          class="text-center text-xs font-medium text-gray-500 pb-2"
        >
          {{ day }}
        </div>

        <!-- Calendar Days -->
        <div
          v-for="date in calendarDays"
          :key="`${date.date.getFullYear()}-${date.date.getMonth()}-${
            date.day
          }`"
          class="h-8 flex items-center justify-center"
        >
          <button
            class="w-8 h-8 flex items-center justify-center text-xs rounded-full"
            :class="[
              date.isToday
                ? 'bg-red-400 text-white'
                : date.isCurrentMonth && isSelectedDate(date)
                ? 'bg-red-200 text-red-700'
                : date.isCurrentMonth
                ? 'text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 hover:bg-gray-50',
              date.hasSchedule ? 'font-bold' : '',
            ]"
            :disabled="!date.isCurrentMonth"
            @click="selectDate(date)"
          >
            {{ date.day }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useScheduleStore } from "../../stores/scheduleStore";
import { f7 } from "framework7-vue";

interface CalendarDate {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  date: Date;
  hasSchedule?: boolean;
}

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const currentDate = ref(new Date());
const scheduleStore = useScheduleStore();

// Function to navigate to planning page
const navigateToPlanning = () => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth() + 1; // JavaScript months are 0-indexed

  f7.views.main.router.navigate(`/planning/${year}/${month}/`);
  // window.location.href = `/planning/${year}/${month}/`;
};

// Function to check if a date is selected
const isSelectedDate = (date: CalendarDate): boolean => {
  if (!date.isCurrentMonth) return false;

  const selectedDate = scheduleStore.selectedDate;
  return (
    date.date.getDate() === selectedDate.getDate() &&
    date.date.getMonth() === selectedDate.getMonth() &&
    date.date.getFullYear() === selectedDate.getFullYear()
  );
};

// Function to select a date
const selectDate = (date: CalendarDate) => {
  if (!date.isCurrentMonth) return;
  scheduleStore.setSelectedDate(date.date);
};

// Navigation functions
const nextMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentDate.value = newDate;

  // Update selected date to the same day in the new month, or last day if invalid
  const selectedDate = new Date(scheduleStore.selectedDate);
  const newMonth = newDate.getMonth();
  const newYear = newDate.getFullYear();
  const lastDayOfNewMonth = new Date(newYear, newMonth + 1, 0).getDate();

  // Ensure we don't exceed the last day of the month
  const newDay = Math.min(selectedDate.getDate(), lastDayOfNewMonth);
  const newSelectedDate = new Date(newYear, newMonth, newDay);

  scheduleStore.setSelectedDate(newSelectedDate);
};

const previousMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;

  // Update selected date to the same day in the new month, or last day if invalid
  const selectedDate = new Date(scheduleStore.selectedDate);
  const newMonth = newDate.getMonth();
  const newYear = newDate.getFullYear();
  const lastDayOfNewMonth = new Date(newYear, newMonth + 1, 0).getDate();

  // Ensure we don't exceed the last day of the month
  const newDay = Math.min(selectedDate.getDate(), lastDayOfNewMonth);
  const newSelectedDate = new Date(newYear, newMonth, newDay);

  scheduleStore.setSelectedDate(newSelectedDate);
};

const currentMonthYear = computed(() => {
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
  const month = months[currentDate.value.getMonth()];
  const year = currentDate.value.getFullYear();
  return `${month} ${year}`;
});

// Check if a date has schedule data
const checkHasSchedule = (date: Date): boolean => {
  const formattedDate = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return (
    !!scheduleStore.scheduleData[formattedDate] &&
    scheduleStore.scheduleData[formattedDate].length > 0
  );
};

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const today = new Date();

  // Get first day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get days from previous month
  const firstDayOfWeek = firstDay.getDay() || 7; // Monday is 1, Sunday is 0 (or 7)
  const daysFromPrevMonth = firstDayOfWeek - 1;

  const prevMonthDays: CalendarDate[] = [];
  if (daysFromPrevMonth > 0) {
    const prevMonth = month - 1 < 0 ? 11 : month - 1;
    const prevMonthYear = prevMonth === 11 ? year - 1 : year;
    const prevMonthLastDay = new Date(
      prevMonthYear,
      prevMonth + 1,
      0
    ).getDate();

    for (
      let i = prevMonthLastDay - daysFromPrevMonth + 1;
      i <= prevMonthLastDay;
      i++
    ) {
      const prevDate = new Date(prevMonthYear, prevMonth, i);
      prevMonthDays.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
        date: prevDate,
        hasSchedule: checkHasSchedule(prevDate),
      });
    }
  }

  // Get days from current month
  const currentMonthDays = Array.from(
    { length: lastDay.getDate() },
    (_, i): CalendarDate => {
      const currentDay = new Date(year, month, i + 1);
      return {
        day: i + 1,
        isCurrentMonth: true,
        isToday:
          today.getDate() === i + 1 &&
          today.getMonth() === month &&
          today.getFullYear() === year,
        date: currentDay,
        hasSchedule: checkHasSchedule(currentDay),
      };
    }
  );

  // Get days from next month
  const totalDaysToShow = 42; // 6 rows of 7 days
  const remainingDays =
    totalDaysToShow - (prevMonthDays.length + currentMonthDays.length);

  const nextMonthDays: CalendarDate[] = [];
  if (remainingDays > 0) {
    const nextMonth = month + 1 > 11 ? 0 : month + 1;
    const nextMonthYear = nextMonth === 0 ? year + 1 : year;

    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(nextMonthYear, nextMonth, i);
      nextMonthDays.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
        date: nextDate,
        hasSchedule: checkHasSchedule(nextDate),
      });
    }
  }

  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
});

// Initialize with today's date
onMounted(() => {
  scheduleStore.setSelectedDate(new Date());
});
</script>
