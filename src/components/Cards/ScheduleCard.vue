<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="flex items-center justify-between p-4 border-b border-gray-100">
      <h2 class="text-lg font-semibold text-gray-900">
        Расписание на {{ formattedDate }}
      </h2>
      <a href="#" class="text-sm font-medium text-red-500 hover:text-red-600">
        подробнее
      </a>
    </div>
    <div class="p-4">
      <div v-if="schedule.length > 0" class="space-y-3">
        <div
          v-for="(lesson, index) in schedule"
          :key="index"
          class="group flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <!-- Time Column -->
          <div class="flex-shrink-0 w-20">
            <div class="text-sm font-medium text-gray-900">
              {{ lesson.startTime }}
            </div>
            <div class="text-xs text-gray-500">
              {{ lesson.endTime }}
            </div>
          </div>

          <!-- Subject Info -->
          <div class="flex-1 min-w-0 ml-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900 truncate">
                {{ lesson.subject }}
              </h3>
            </div>
            <div class="mt-1 flex items-center text-sm text-gray-500">
              <span>{{ lesson.room }}</span>
              <!-- <span class="mx-2">•</span> -->
            </div>
          </div>

          <!-- Arrow -->
          <div class="flex-shrink-0 ml-4">
            <i class="f7-icons text-gray-400 group-hover:text-gray-600"
              >chevron_right</i
            >
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center">
        <p class="text-gray-500">Нет занятий на этот день</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useScheduleStore } from "../../stores/scheduleStore";

const scheduleStore = useScheduleStore();

// Get schedule for the selected date from the store
const schedule = computed(() => {
  return scheduleStore.selectedDateSchedule;
});

// Format the selected date for display
const formattedDate = computed(() => {
  const date = scheduleStore.selectedDate;
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

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
  const dayOfWeek = days[date.getDay()];

  // Check if it's today
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return "сегодня";
  }

  // Check if it's tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) {
    return "завтра";
  }

  return `${day}.${month < 10 ? "0" + month : month} (${dayOfWeek})`;
});
</script>
