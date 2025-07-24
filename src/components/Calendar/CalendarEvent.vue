<template>
  <div
    class="text-xs p-2 rounded-md truncate border-l-2 transition-shadow duration-200 hover:shadow-md"
    :class="{
      'bg-green-50 hover:bg-green-100 border-l-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-l-green-400 lavanda:bg-green-100/20 lavanda:hover:bg-green-100/30 lavanda:border-l-green-300':
        event.type === 'class',
      'bg-blue-50 hover:bg-blue-100 border-l-blue-500 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-l-blue-400 lavanda:bg-blue-100/20 lavanda:hover:bg-blue-100/30 lavanda:border-l-blue-300':
        event.type === 'history',
      'bg-yellow-50 hover:bg-yellow-100 border-l-yellow-500 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-l-yellow-400 lavanda:bg-yellow-100/20 lavanda:hover:bg-yellow-100/30 lavanda:border-l-yellow-300':
        event.type === 'language',
      'bg-purple-50 hover:bg-purple-100 border-l-purple-500 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:border-l-purple-400 lavanda:bg-purple-100/20 lavanda:hover:bg-purple-100/30 lavanda:border-l-purple-300':
        event.type === 'task',
    }"
  >
    <div class="font-medium text-foreground">{{ event.title }}</div>
    <div class="text-muted-foreground">{{ event.time }}</div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from "@/composables/useCalendar";

defineProps<{
  event: CalendarEvent;
}>();
</script>
