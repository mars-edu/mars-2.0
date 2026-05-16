<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="card in cards"
      :key="card.label"
      class="bg-card rounded-xl border border-border shadow-sm p-5 flex items-center gap-4"
    >
      <div :class="['p-3 rounded-xl', card.bgColor]">
        <component :is="card.icon" class="w-6 h-6" :class="card.iconColor" />
      </div>
      <div>
        <p class="text-sm text-muted-foreground font-medium">{{ card.label }}</p>
        <p class="text-2xl font-bold text-foreground">{{ card.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import IconTrendingUp from "~icons/lucide/trending-up";
import IconUsers from "~icons/lucide/users";
import IconBookOpen from "~icons/lucide/book-open";
import IconClock from "~icons/lucide/clock";

const props = defineProps<{
  averageScore: number | null;
  studentCount: number;
  disciplineCount: number;
  attendancePercent: number | null;
}>();

const cards = computed(() => [
  {
    label: "Средний балл",
    value: props.averageScore !== null ? props.averageScore.toFixed(1) : "—",
    icon: IconTrendingUp,
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-600",
  },
  {
    label: "Студентов",
    value: props.studentCount,
    icon: IconUsers,
    bgColor: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600",
  },
  {
    label: "Дисциплин",
    value: props.disciplineCount,
    icon: IconBookOpen,
    bgColor: "bg-purple-50 dark:bg-purple-950",
    iconColor: "text-purple-600",
  },
  {
    label: "Посещаемость",
    value:
      props.attendancePercent !== null
        ? props.attendancePercent.toFixed(0) + "%"
        : "—",
    icon: IconClock,
    bgColor: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-600",
  },
]);
</script>
