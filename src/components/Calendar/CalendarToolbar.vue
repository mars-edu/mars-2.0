<template>
  <div class="flex items-center gap-3" :class="class">
    <MonthNavigator
      :monthName="monthName"
      :year="year"
      @previous-month="$emit('previous-month')"
      @next-month="$emit('next-month')"
    />
    <slot name="navigation"></slot>
    <AddEventButton @event-added="handleEventAdded" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import AddEventButton from "./AddEventButton.vue";
import MonthNavigator from "./MonthNavigator.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";

const props = defineProps<{
  class?: string;
  searchPlaceholder: string;
  monthName: string;
  year: string;
  todayDate: string;
}>();

const emit = defineEmits<{
  (e: "event-added", event: CalendarEvent): void;
  (e: "previous-month"): void;
  (e: "next-month"): void;
}>();

const calendarStore = useCalendarStore();

const handleEventAdded = (event: CalendarEvent) => {
  // Event is already added to the store in AddEventButton
  // Propagate event to parent components if they want to react further
  emit("event-added", event);
};
</script>
