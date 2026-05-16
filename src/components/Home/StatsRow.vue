<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <!-- Students -->
    <div
      class="bg-card rounded-[24px] p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all cursor-default"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-yellow-50 text-yellow-600 rounded-full">
          <IconUsers class="text-xl w-5 h-5" />
        </div>
        <span class="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
          <IconTrendingUp class="w-3 h-3" /> +2.4%
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">305</div>
        <div class="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1">
          {{ home_stats_students() }}
        </div>
      </div>
    </div>

    <!-- Current Week -->
    <div
      class="bg-card rounded-[24px] p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all cursor-default"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-orange-50 text-orange-600 rounded-full">
          <IconCalendar class="text-xl w-5 h-5" />
        </div>
        <span class="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {{ semesterLabel }}
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">
          {{ currentWeek > 0 ? home_stats_week_number({ number: currentWeek }) : "—" }}
        </div>
        <div class="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1">
          {{ home_stats_current_week() }}
        </div>
      </div>
    </div>

    <!-- Attendance -->
    <div
      class="bg-card rounded-[24px] p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all cursor-default"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-red-50 text-red-500 rounded-full">
          <IconClock class="text-xl w-5 h-5" />
        </div>
        <span class="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
          -1.2%
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">94%</div>
        <div class="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1">
          {{ home_stats_attendance() }}
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
import { useI18n } from "@/composables/useI18n";
import IconUsers from "~icons/lucide/users";
import IconCalendar from "~icons/lucide/calendar";
import IconClock from "~icons/lucide/clock";
import IconTrendingUp from "~icons/lucide/trending-up";
import {
  home_stats_students,
  home_stats_week_number,
  home_stats_current_week,
  home_stats_attendance,
} from "@/paraglide/messages";
import { getSemesterLabel, getCurrentWeekNumber } from "@/utils/homeUtils";

const { locale } = useI18n();

const studentStore = useStudentStore();
const studentCount = computed(() => studentStore.students?.length ?? 0);

const academicStore = useAcademicYearSemesterStore();
const { getActiveAcademicYearSemester } = storeToRefs(academicStore);

const semesterLabel = computed(() => getSemesterLabel(getActiveAcademicYearSemester.value, locale.value));
const currentWeek = computed(() => getCurrentWeekNumber(getActiveAcademicYearSemester.value?.startDate));
</script>
