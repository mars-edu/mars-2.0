<template>
  <div
    class="text-xs p-2 rounded-md truncate border-l-2 transition-shadow duration-200 hover:shadow-md cursor-pointer bg-primary/10 hover:bg-primary/20 border-l-primary dark:bg-primary/20 dark:hover:bg-primary/30 lavanda:bg-primary/10 lavanda:hover:bg-primary/20"
    @click="handleClick"
  >
    <div class="font-medium text-foreground">{{ event.title }}</div>
    <div class="text-muted-foreground">{{ event.time }}</div>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEvent } from "@/composables/useCalendar";
import { defineEmits } from "vue";

const props = defineProps<{
  event: CalendarEvent;
}>();

const emit = defineEmits<{
  (e: "click", event: CalendarEvent, evt: MouseEvent): void;
}>();

const handleClick = (evt: MouseEvent) => {
  emit("click", props.event, evt);
};
</script>
