<template>
  <Card title="Расписание на {{ formattedDate }}">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold text-foreground">
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
        class="group flex items-center p-3.5 rounded-lg transition-colors cursor-pointer bg-muted hover:bg-muted/80"
      >
        <!-- Time Column -->
        <div class="flex-shrink-0 w-20">
          <div class="text-sm font-medium text-foreground">
            {{ lesson.startTime }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ lesson.endTime }}
          </div>
        </div>

        <!-- Subject Info -->
        <div class="flex-1 min-w-0 ml-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium truncate text-foreground">
              {{ lesson.subject }}
            </h3>
          </div>
          <div class="mt-1 flex items-center text-sm text-muted-foreground">
            <span>{{ lesson.room }}</span>
          </div>
        </div>

        <!-- Arrow -->
        <div class="flex-shrink-0 ml-4">
          <IconChevronRight class="text-muted-foreground group-hover:text-foreground" />
        </div>
      </div>
    </div>
    <EmptyState
      v-else
      :icon="IconCalendar"
      title="Нет занятий на этот день"
    />
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useScheduleStore } from "../../stores/scheduleStore";
import Card from "@/components/ui/Card.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import IconCalendar from "~icons/lucide/calendar";
import IconChevronRight from "~icons/lucide/chevron-right";

interface Props {
  /** @deprecated Theme is now handled by CSS custom properties. */
  theme?: "white" | "dark" | "lavanda";
}

withDefaults(defineProps<Props>(), {
  theme: "white",
});

const scheduleStore = useScheduleStore();

const schedule = computed(() => {
  return scheduleStore.selectedDateSchedule;
});

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

  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  if (isToday) {
    return "сегодня";
  }

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
