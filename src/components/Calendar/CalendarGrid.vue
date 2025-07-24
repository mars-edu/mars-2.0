<template>
  <div
    class="grid grid-cols-7 auto-rows-[minmax(8rem,auto)] gap-px bg-border rounded-lg border border-border"
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
    <CalendarDay
      v-for="day in days"
      :key="day.date"
      :day="day"
      @event-click="onEventClick"
    />
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay as CalendarDayType } from "@/composables/useCalendar";
import CalendarDay from "./CalendarDay.vue";

const emit = defineEmits<{
  (
    e: "event-click",
    event: import("@/composables/useCalendar").CalendarEvent,
    evt: MouseEvent
  ): void;
}>();

const onEventClick = (
  eventData: import("@/composables/useCalendar").CalendarEvent,
  evt: MouseEvent
) => {
  emit("event-click", eventData, evt);
};

defineProps<{
  days: CalendarDayType[];
  weekdays: string[];
}>();
</script>
