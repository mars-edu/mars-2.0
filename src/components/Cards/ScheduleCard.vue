<template>
  <Card :theme="theme" title="Расписание на {{ formattedDate }}">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold" :class="textClass">
          Расписание на {{ formattedDate }}
        </h2>
        <a href="#" class="text-sm font-medium text-red-500 hover:text-red-600">
          подробнее
        </a>
      </div>
    </template>

    <div v-if="schedule.length > 0" class="space-y-3.5">
      <div
        v-for="(lesson, index) in schedule"
        :key="index"
        class="group flex items-center p-3.5 rounded-lg transition-colors cursor-pointer"
        :class="lessonBoxClass"
      >
        <!-- Time Column -->
        <div class="flex-shrink-0 w-20">
          <div class="text-sm font-medium" :class="textClass">
            {{ lesson.startTime }}
          </div>
          <div class="text-xs" :class="mutedTextClass">
            {{ lesson.endTime }}
          </div>
        </div>

        <!-- Subject Info -->
        <div class="flex-1 min-w-0 ml-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium truncate" :class="textClass">
              {{ lesson.subject }}
            </h3>
          </div>
          <div class="mt-1 flex items-center text-sm" :class="mutedTextClass">
            <span>{{ lesson.room }}</span>
            <!-- <span class="mx-2">•</span> -->
          </div>
        </div>

        <!-- Arrow -->
        <div class="flex-shrink-0 ml-4">
          <i class="f7-icons group-hover:text-gray-600" :class="iconClass"
            >chevron_right</i
          >
        </div>
      </div>
    </div>
    <div v-else class="py-8 text-center">
      <p :class="mutedTextClass">Нет занятий на этот день</p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useScheduleStore } from "../../stores/scheduleStore";
import Card from "@/components/ui/Card.vue";

interface Props {
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
});

const scheduleStore = useScheduleStore();

// Theme-based classes
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

const mutedTextClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-400";
    case "lavanda":
      return "text-purple-600";
    default:
      return "text-gray-500";
  }
});

const iconClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-500";
    case "lavanda":
      return "text-purple-400";
    default:
      return "text-gray-400";
  }
});

const lessonBoxClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "bg-gray-700 hover:bg-gray-600";
    case "lavanda":
      return "bg-purple-100 hover:bg-purple-200";
    default:
      return "bg-gray-50 hover:bg-gray-100";
  }
});

// Get schedule for the selected date from the store
const schedule = computed(() => {
  return scheduleStore.selectedDateSchedule;
});

// Format the selected date for display
const formattedDate = computed(() => {
  const date = scheduleStore.selectedDate;
  if (!date) {
    const today = new Date();
    return `${today.getDate()}.${
      today.getMonth() + 1 < 10
        ? "0" + (today.getMonth() + 1)
        : today.getMonth() + 1
    } (сегодня)`;
  }

  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  // Get day of week
  const days = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ];
  const dayOfWeek = days[d.getDay()];

  // Check if it's today
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  if (isToday) {
    return "сегодня";
  }

  // Check if it's tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) {
    return "завтра";
  }

  return `${day}.${month < 10 ? "0" + month : month} (${dayOfWeek})`;
});
</script>
