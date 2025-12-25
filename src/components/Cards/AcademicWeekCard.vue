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

    <!-- Error State: No Active Semester -->
    <div v-if="!semesterData" class="p-4 rounded-lg" :class="theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'">
      <div class="flex items-start">
        <svg class="w-5 h-5 mr-2 flex-shrink-0" :class="theme === 'dark' ? 'text-red-400' : 'text-red-600'" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <div>
          <p class="text-sm font-medium" :class="theme === 'dark' ? 'text-red-400' : 'text-red-800'">
            Активный семестр не настроен
          </p>
          <p class="mt-1 text-sm" :class="theme === 'dark' ? 'text-red-300' : 'text-red-700'">
            Пожалуйста, настройте график образовательного процесса в разделе "Планирование"
          </p>
        </div>
      </div>
    </div>

    <!-- Week Details -->
    <div v-else class="grid grid-cols-2 gap-4">
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
import { storeToRefs } from "pinia";
import Card from "@/components/ui/Card.vue";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";

interface Props {
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "white",
});

// Initialize store to get active semester data
const academicYearSemesterStore = useAcademicYearSemesterStore();
const { getActiveAcademicYearSemester } = storeToRefs(academicYearSemesterStore);

// Computed property to get semester data from store
const semesterData = computed(() => {
  const activeSemester = getActiveAcademicYearSemester.value;

  if (!activeSemester) {
    // No active semester configured - return null to show error state
    return null;
  }

  // Check if dates are empty or invalid
  if (!activeSemester.startDate || !activeSemester.endDate) {
    // Semester exists but dates not configured - return null to show error state
    return null;
  }

  const startDate = new Date(activeSemester.startDate);
  const endDate = new Date(activeSemester.endDate);

  // Validate that dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    // Invalid dates - return null to show error state
    return null;
  }

  // Calculate total weeks in the semester (using consistent day-based calculation)
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
  const totalDays = Math.floor(timeDiff / (24 * 60 * 60 * 1000)) + 1; // +1 to include both start and end days
  const totalWeeks = Math.ceil(totalDays / 7);

  return {
    startDate,
    endDate,
    totalWeeks
  };
});

// Helper computed properties for easier access
const semesterStartDate = computed(() => semesterData.value?.startDate ?? null);
const semesterEndDate = computed(() => semesterData.value?.endDate ?? null);
const TOTAL_WEEKS = computed(() => semesterData.value?.totalWeeks ?? 15);


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

const semesterStart = computed(() =>
  semesterStartDate.value ? formatDate(semesterStartDate.value) : "-"
);
const semesterEnd = computed(() =>
  semesterEndDate.value ? formatDate(semesterEndDate.value) : "-"
);

const currentWeek = computed(() => {
  // Return 0 if no semester data available (will show error state)
  if (!semesterStartDate.value || !semesterData.value) {
    return 0;
  }

  const today = new Date();
  // Set both dates to midnight to avoid time-of-day issues
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfSemester = new Date(
    semesterStartDate.value.getFullYear(),
    semesterStartDate.value.getMonth(),
    semesterStartDate.value.getDate()
  );

  const timeDiff = startOfToday.getTime() - startOfSemester.getTime();
  const daysSinceStart = Math.floor(timeDiff / (24 * 60 * 60 * 1000));

  // Week 1 starts on day 0, week 2 starts on day 7, etc.
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
