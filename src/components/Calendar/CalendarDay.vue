<template>
  <div class="bg-card min-h-[120px] p-2 relative group" :class="dayClasses">
    <div
      class="text-sm mb-1.5"
      :class="{
        'text-muted-foreground/40': !day.isCurrentMonth,
        'text-primary-foreground': day.isToday,
        'text-foreground': day.isCurrentMonth && !day.isToday,
      }"
    >
      <span
        v-if="day.isToday"
        class="w-6 h-6 bg-red-500 rounded-lg inline-flex items-center justify-center font-black text-[11px] shadow-md"
      >
        {{ day.dayNumber }}
      </span>
      <span v-else class="font-black text-[11px]">
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
  return {
    "hover:bg-primary/5 transition-colors": !props.day.isToday,
    "bg-primary/10": props.day.isToday,
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
  background-color: hsl(var(--muted-foreground) / 0.3);
  border-radius: 20px;
}

.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
}
</style>
