<template>
  <Card :theme="theme">
    <template #header>
      <div class="flex justify-between w-full">
        <div class="flex items-center space-x-3">
          <h2 class="text-sm font-medium w-full" :class="textClass">
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
            class="p-1 rounded transition-colors"
            :class="controlButtonClass"
            @click="previousMonth"
          >
            <i class="f7-icons text-sm" :class="controlIconClass"
              >chevron_left</i
            >
          </button>
          <button
            class="p-1 rounded transition-colors"
            :class="controlButtonClass"
            @click="nextMonth"
          >
            <i class="f7-icons text-sm" :class="controlIconClass"
              >chevron_right</i
            >
          </button>
        </div>
      </div>
    </template>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-y-2">
      <!-- Weekday Headers -->
      <div
        v-for="day in weekDays"
        :key="day"
        class="text-center text-xs font-medium pb-2"
        :class="weekdayClass"
      >
        {{ day }}
      </div>

      <!-- Calendar Days -->
      <div
        v-for="date in calendarDays"
        :key="`${date.date.getFullYear()}-${date.date.getMonth()}-${date.day}`"
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
              ? [dateClass, 'hover:' + dateHoverClass]
              : [inactiveDateClass, 'hover:' + inactiveDateHoverClass],
            date.hasSchedule ? 'font-bold' : '',
          ]"
          :disabled="!date.isCurrentMonth"
          @click="selectDate(date)"
        >
          {{ date.day }}
        </button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useScheduleStore } from "../../stores/scheduleStore";
import { f7 } from "framework7-vue";
import Card from "@/components/ui/Card.vue";

interface Props {
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
});

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


const textClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-white";
    case "lavanda":
      return "text-purple-900";
    default:
      return "text-gray-900";
  }
});

const weekdayClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-400";
    case "lavanda":
      return "text-purple-500";
    default:
      return "text-gray-500";
  }
});

const dateClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-200";
    case "lavanda":
      return "text-purple-900";
    default:
      return "text-gray-900";
  }
});

const dateHoverClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "bg-gray-700";
    case "lavanda":
      return "bg-purple-100";
    default:
      return "bg-gray-100";
  }
});

const inactiveDateClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-600";
    case "lavanda":
      return "text-purple-300";
    default:
      return "text-gray-400";
  }
});

const inactiveDateHoverClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "bg-gray-800";
    case "lavanda":
      return "bg-purple-50";
    default:
      return "bg-gray-50";
  }
});

const controlButtonClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "hover:bg-gray-700";
    case "lavanda":
      return "hover:bg-purple-100";
    default:
      return "hover:bg-gray-100";
  }
});

const controlIconClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-400";
    case "lavanda":
      return "text-purple-500";
    default:
      return "text-gray-600";
  }
});


const navigateToPlanning = () => {
  f7.views.main.router.navigate("/planning");
};


const isSelectedDate = (date: CalendarDate): boolean => {
  if (!date.isCurrentMonth) return false;

  const selectedDate = scheduleStore.selectedDate;
  if (!selectedDate) return false;

  const selectedAsDate = new Date(selectedDate);

  return (
    date.date.getDate() === selectedAsDate.getDate() &&
    date.date.getMonth() === selectedAsDate.getMonth() &&
    date.date.getFullYear() === selectedAsDate.getFullYear()
  );
};


const selectDate = (date: CalendarDate) => {
  if (!date.isCurrentMonth) return;
  scheduleStore.setSelectedDate(date.date);
};


const nextMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentDate.value = newDate;

  
  const selectedDate = new Date(scheduleStore.selectedDate);
  const newMonth = newDate.getMonth();
  const newYear = newDate.getFullYear();
  const lastDayOfNewMonth = new Date(newYear, newMonth + 1, 0).getDate();

  
  const newDay = Math.min(selectedDate.getDate(), lastDayOfNewMonth);
  const newSelectedDate = new Date(newYear, newMonth, newDay);

  scheduleStore.setSelectedDate(newSelectedDate);
};

const previousMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;

  
  const selectedDate = new Date(scheduleStore.selectedDate);
  const newMonth = newDate.getMonth();
  const newYear = newDate.getFullYear();
  const lastDayOfNewMonth = new Date(newYear, newMonth + 1, 0).getDate();

  
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

  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  
  const firstDayOfWeek = firstDay.getDay() || 7; 
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

  
  const totalDaysToShow = 42; 
  const remainingDays =
    totalDaysToShow - (prevMonthDays.length + currentMonthDays.length);

  const nextMonthDays: CalendarDate[] = [];
  for (let i = 1; i <= remainingDays; i++) {
    const nextDate = new Date(year, month + 1, i);
    nextMonthDays.push({
      day: i,
      isCurrentMonth: false,
      isToday: false,
      date: nextDate,
      hasSchedule: checkHasSchedule(nextDate),
    });
  }

  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
});


onMounted(() => {
  scheduleStore.setSelectedDate(new Date());
});
</script>
