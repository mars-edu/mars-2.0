<template>
  <div
    class="grid grid-cols-7 auto-rows-[minmax(2rem,auto)] gap-px bg-gray-200 border border-gray-200 rounded-[32px] overflow-hidden shadow-2xl"
  >
    <!-- Weekday headers -->
    <div
      v-for="day in weekdays"
      :key="day"
      class="bg-gray-50 p-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200"
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
