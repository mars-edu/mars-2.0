<template>
  <div
    class="grid grid-cols-7 auto-rows-[minmax(2rem,auto)] gap-0 bg-white rounded-lg border border-gray-200 overflow-hidden"
  >
    <!-- Weekday headers -->
    <div
      v-for="day in weekdays"
      :key="day"
      class="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200"
    >
      {{ day }}
    </div>

    <!-- Calendar days -->
    <CalendarDay
      v-for="day in days"
      :key="day.date"
      :day="day"
      :selected-event-id="selectedEventId"
      @event-click="onEventClick"
      class="border-r border-b border-gray-200 last:border-r-0"
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
  selectedEventId?: number | string | null;
}>();
</script>
