<template>
  <Card title="Учебная неделя">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div>
          <h2 class="text-lg font-semibold text-foreground">
            Учебная неделя
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ semesterProgress }}% семестра
          </p>
        </div>
        <div class="relative w-16 h-16">
          <!-- SVG Circle Progress -->
          <svg class="w-full h-full transform -rotate-90">
            <circle
              class="text-muted"
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
            <span class="text-xl font-bold text-foreground">{{
              currentWeek
            }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Error State: No Active Semester -->
    <div v-if="!semesterData" class="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
      <div class="flex items-start">
        <svg class="w-5 h-5 mr-2 flex-shrink-0 text-destructive" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <div>
          <p class="text-sm font-medium text-destructive">
            Активный семестр не настроен
          </p>
          <p class="mt-1 text-sm text-muted-foreground">
            Пожалуйста, настройте график образовательного процесса в разделе "Планирование"
          </p>
        </div>
      </div>
    </div>

    <!-- Week Details -->
    <div v-else class="grid grid-cols-2 gap-4">
      <div class="bg-muted rounded-lg p-3">
        <div class="text-sm text-muted-foreground">Начало семестра</div>
        <div class="mt-1 text-sm font-medium text-foreground">
          {{ semesterStart }}
        </div>
      </div>
      <div class="bg-muted rounded-lg p-3">
        <div class="text-sm text-muted-foreground">Конец семестра</div>
        <div class="mt-1 text-sm font-medium text-foreground">
          {{ semesterEnd }}
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import Card from "@/components/ui/Card.vue";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useI18n } from "@/composables/useI18n";
import type { Theme } from "@/types/theme";

interface Props {
  /** @deprecated Theme is now handled by CSS custom properties. */
  theme?: Theme;
}

withDefaults(defineProps<Props>(), {
  theme: "light",
});

const { locale } = useI18n();

// Initialize store to get active semester data
const academicYearSemesterStore = useAcademicYearSemesterStore();
const { getActiveAcademicYearSemester } = storeToRefs(academicYearSemesterStore);

// Computed property to get semester data from store
const semesterData = computed(() => {
  const activeSemester = getActiveAcademicYearSemester.value;

  if (!activeSemester) {
    return null;
  }

  if (!activeSemester.startDate || !activeSemester.endDate) {
    return null;
  }

  const startDate = new Date(activeSemester.startDate);
  const endDate = new Date(activeSemester.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return null;
  }

  const startOfSemester = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const endOfSemester = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  const timeDiff = endOfSemester.getTime() - startOfSemester.getTime();
  const totalDays = Math.floor(timeDiff / (24 * 60 * 60 * 1000)) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);

  return {
    startDate,
    endDate,
    totalWeeks
  };
});

const semesterStartDate = computed(() => semesterData.value?.startDate ?? null);
const semesterEndDate = computed(() => semesterData.value?.endDate ?? null);
const TOTAL_WEEKS = computed(() => semesterData.value?.totalWeeks ?? 15);

const formatDate = (date: Date): string => {
  return date.toLocaleDateString(locale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const semesterStart = computed(() =>
  semesterStartDate.value ? formatDate(semesterStartDate.value) : "-"
);
const semesterEnd = computed(() =>
  semesterEndDate.value ? formatDate(semesterEndDate.value) : "-"
);

const currentWeek = computed(() => {
  if (!semesterStartDate.value || !semesterData.value) {
    return 0;
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfSemester = new Date(
    semesterStartDate.value.getFullYear(),
    semesterStartDate.value.getMonth(),
    semesterStartDate.value.getDate()
  );

  const timeDiff = startOfToday.getTime() - startOfSemester.getTime();
  const daysSinceStart = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;

  return Math.min(Math.max(1, weekNumber), TOTAL_WEEKS.value);
});

const circumference = computed(() => 2 * Math.PI * 26);
const semesterProgress = computed(() => {
  if (!semesterData.value || TOTAL_WEEKS.value === 0) {
    return 0;
  }
  return Math.round((currentWeek.value / TOTAL_WEEKS.value) * 100);
});
const dashOffset = computed(
  () =>
    circumference.value - (semesterProgress.value / 100) * circumference.value
);
</script>
