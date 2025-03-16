<template>
  <div
    class="text-xs p-2 rounded-md truncate border-l-2 transition-transform duration-200 hover:translate-x-1"
    :class="{
      'bg-green-50 border-l-green-600': event.type === 'class',
      'bg-blue-50 border-l-blue-500': event.type === 'history',
      'bg-yellow-50 border-l-yellow-500': event.type === 'language',
      'bg-purple-50 border-l-purple-500': event.type === 'task',
    }"
  >
    <div class="font-medium text-gray-700">{{ event.title }}</div>
    <div class="text-gray-500">{{ event.time }}</div>
  </div>
</template>

<script setup lang="ts">
import { CalendarEvent } from "@/composables/useCalendar";

defineProps<{
  event: CalendarEvent;
}>();
</script>
