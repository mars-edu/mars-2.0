<template>
  <div
    class="grid grid-cols-7 gap-px bg-gray-200 rounded-lg border border-gray-200"
  >
    <!-- Weekday headers -->
    <div
      v-for="day in weekdays"
      :key="day"
      class="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-500"
    >
      {{ day }}
    </div>

    <!-- Calendar days -->
    <CalendarDay v-for="day in days" :key="day.date" :day="day" />
  </div>
</template>

<script setup lang="ts">
import { CalendarDay as CalendarDayType } from "@/composables/useCalendar";
import CalendarDay from "./CalendarDay.vue";

defineProps<{
  days: CalendarDayType[];
  weekdays: string[];
}>();
</script>
