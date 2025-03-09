<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="px-4 pt-4 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Учебная неделя</h2>
        <p class="mt-1 text-sm text-gray-500">
          {{ semesterProgress }}% семестра
        </p>
      </div>
      <div class="relative w-16 h-16">
        <!-- SVG Circle Progress -->
        <svg class="w-full h-full transform -rotate-90">
          <circle
            class="text-gray-200"
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
          <span class="text-xl font-bold text-gray-900">{{ currentWeek }}</span>
        </div>
      </div>
    </div>

    <!-- Week Details -->
    <div class="px-4 pb-4">
      <div class="mt-4 grid grid-cols-2 gap-4">
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-sm text-gray-500">Начало семестра</div>
          <div class="mt-1 text-sm font-medium text-gray-900">
            {{ semesterStart }}
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-sm text-gray-500">Конец семестра</div>
          <div class="mt-1 text-sm font-medium text-gray-900">
            {{ semesterEnd }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const TOTAL_WEEKS = 15;
const semesterStartDate = new Date(2025, 0, 15);
const semesterEndDate = new Date(2025, 4, 31);

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
