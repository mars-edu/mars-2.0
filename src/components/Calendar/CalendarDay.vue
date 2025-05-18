<template>
  <div
    class="bg-card min-h-32 p-2 relative group"
    :class="{
      'bg-secondary': [5, 6].includes(new Date(day.date).getDay()),
      'hover:bg-secondary/70': !day.isToday,
    }"
  >
    <div
      class="text-sm mb-2"
      :class="{
        'text-foreground': !day.isCurrentMonth,
        'text-white': day.isToday,
      }"
    >
      <span
        v-if="day.isToday"
        class="w-7 h-7 bg-primary rounded-full inline-flex items-center justify-center"
      >
        {{ day.dayNumber }}
      </span>
      <span v-else>
        {{ day.dayNumber }}
      </span>
    </div>
    <div class="space-y-1 overflow-y-auto max-h-24 scrollbar-thin">
      <CalendarEvent
        v-for="(event, index) in day.events"
        :key="`${day.date}-${index}`"
        :event="event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarDay } from "@/composables/useCalendar";
import CalendarEvent from "./CalendarEvent.vue";

defineProps<{
  day: CalendarDay;
}>();
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
