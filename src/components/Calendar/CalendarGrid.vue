<template>
  <div
    class="grid grid-cols-7 gap-px bg-border rounded-lg border border-border"
  >
    <!-- Weekday headers -->
    <div
      v-for="day in weekdays"
      :key="day"
      class="bg-secondary p-3 text-center text-sm font-semibold text-muted-foreground"
    >
      {{ day }}
    </div>

    <!-- Calendar days -->
    <CalendarDay v-for="day in days" :key="day.date" :day="day" />
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay as CalendarDayType } from "@/composables/useCalendar";
import CalendarDay from "./CalendarDay.vue";

defineProps<{
  days: CalendarDayType[];
  weekdays: string[];
}>();
</script>
