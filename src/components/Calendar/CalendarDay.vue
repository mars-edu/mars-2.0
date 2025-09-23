<template>
  <div class="bg-white min-h-32 p-3 relative group" :class="dayClasses">
    <div
      class="text-sm mb-2"
      :class="{
        'text-gray-400': !day.isCurrentMonth,
        'text-white': day.isToday,
        'text-gray-900': day.isCurrentMonth && !day.isToday,
      }"
    >
      <span
        v-if="day.isToday"
        class="w-7 h-7 bg-red-500 rounded-full inline-flex items-center justify-center font-semibold"
      >
        {{ day.dayNumber }}
      </span>
      <span v-else class="font-medium">
        {{ day.dayNumber }}
      </span>
    </div>
    <div class="space-y-1 overflow-y-auto scrollbar-thin">
      <CalendarEvent
        v-for="(event, index) in day.events"
        :key="`${day.date}-${index}`"
        :event="event"
        :is-selected="selectedEventId != null && event.id === selectedEventId"
        @click="onEventClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay } from "@/composables/useCalendar";
import CalendarEvent from "./CalendarEvent.vue";
import dayjs from "dayjs";
import { computed } from "vue";

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

const props = defineProps<{
  day: CalendarDay;
  selectedEventId?: number | string | null;
}>();

const dayClasses = computed(() => {
  const weekday = dayjs(props.day.date).day();
  const isWeekend = weekday === 0 || weekday === 6; // Sunday=0, Saturday=6
  return {
    "bg-gray-50": isWeekend,
    "hover:bg-gray-50": !props.day.isToday && !isWeekend,
    "bg-red-50 border-red-200": props.day.isToday,
  } as Record<string, boolean>;
});
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(var(--muted-foreground), 0.5);
  border-radius: 20px;
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--muted-foreground), 0.5) transparent;
}
</style>
