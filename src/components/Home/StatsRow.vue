<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <!-- Students -->
    <div
      class="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-blue-50 text-blue-600 rounded-full">
          <i class="f7-icons text-xl">person_2_fill</i>
        </div>
        <span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
          {{ studentCount }} всего
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">{{ studentCount }}</div>
        <div class="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
          Студентов
        </div>
      </div>
    </div>

    <!-- Current Week -->
    <div
      class="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-orange-50 text-orange-600 rounded-full">
          <i class="f7-icons text-xl">calendar</i>
        </div>
        <span class="text-xs font-bold bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {{ semesterLabel }}
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">
          {{ currentWeek > 0 ? `${currentWeek} неделя` : "—" }}
        </div>
        <div class="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
          Текущая неделя
        </div>
      </div>
    </div>

    <!-- Attendance -->
    <div
      class="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-red-50 text-red-500 rounded-full">
          <i class="f7-icons text-xl">chart_bar_fill</i>
        </div>
        <span class="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
          -1.2%
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">94%</div>
        <div class="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
          Посещаемость
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useStudentStore } from "@/stores/studentStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";

const studentStore = useStudentStore();
const studentCount = computed(() => studentStore.students?.length ?? 0);

const academicStore = useAcademicYearSemesterStore();
const { getActiveAcademicYearSemester } = storeToRefs(academicStore);

const semesterLabel = computed(() => {
  const s = getActiveAcademicYearSemester.value;
  return s ? `Семестр` : "Нет семестра";
});

const currentWeek = computed(() => {
  const s = getActiveAcademicYearSemester.value;
  if (!s?.startDate) return 0;
  const start = new Date(s.startDate);
  const today = new Date();
  const diff = today.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
});
</script>
