<template>
  <Card :theme="theme" title="Учебная неделя">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h2 class="text-lg font-semibold" :class="textClass">
            Учебная неделя
          </h2>
          <p class="mt-1 text-sm" :class="mutedTextClass">
            {{ semesterProgress }}% семестра
          </p>
        </div>
        <div class="relative w-16 h-16">
          <!-- SVG Circle Progress -->
          <svg class="w-full h-full transform -rotate-90">
            <circle
              :class="progressTrackClass"
              stroke-width="4"
              stroke="currentColor"
              fill="transparent"
              r="26"
              cx="32"
              cy="32"
            />
            <circle
              class="text-red-500"
              stroke-width="4"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              stroke-linecap="round"
              stroke="currentColor"
              fill="transparent"
              r="26"
              cx="32"
              cy="32"
            />
          </svg>
          <!-- Week Number -->
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-xl font-bold" :class="textClass">{{
              currentWeek
            }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Week Details -->
    <div class="grid grid-cols-2 gap-4">
      <div :class="detailBoxClass">
        <div class="text-sm" :class="mutedTextClass">Начало семестра</div>
        <div class="mt-1 text-sm font-medium" :class="textClass">
          {{ semesterStart }}
        </div>
      </div>
      <div :class="detailBoxClass">
        <div class="text-sm" :class="mutedTextClass">Конец семестра</div>
        <div class="mt-1 text-sm font-medium" :class="textClass">
          {{ semesterEnd }}
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import Card from "@/components/ui/Card.vue";

interface Props {
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
});

const TOTAL_WEEKS = 15;
const semesterStartDate = new Date(2025, 0, 15);
const semesterEndDate = new Date(2025, 4, 31);

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

const detailBoxClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "bg-gray-700 rounded-lg p-3";
    case "lavanda":
      return "bg-purple-100 rounded-lg p-3";
    default:
      return "bg-gray-50 rounded-lg p-3";
  }
});

const progressTrackClass = computed(() => {
  switch (props.theme) {
    case "dark":
      return "text-gray-700";
    case "lavanda":
      return "text-purple-200";
    default:
      return "text-gray-200";
  }
});

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const semesterStart = computed(() => formatDate(semesterStartDate));
const semesterEnd = computed(() => formatDate(semesterEndDate));

const currentWeek = computed(() => {
  const today = new Date();
  const timeDiff = today.getTime() - semesterStartDate.getTime();
  const weekNumber = Math.ceil(timeDiff / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(1, weekNumber), TOTAL_WEEKS);
});

const circumference = computed(() => 2 * Math.PI * 26);
const semesterProgress = computed(() =>
  Math.round((currentWeek.value / TOTAL_WEEKS) * 100)
);
const dashOffset = computed(
  () =>
    circumference.value - (semesterProgress.value / 100) * circumference.value
);
</script>
