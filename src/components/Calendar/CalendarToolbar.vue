<template>
  <div class="flex items-center gap-3" :class="class">
    <MonthNavigator
      :monthName="monthName"
      :year="year"
      @previous-month="$emit('previous-month')"
      @next-month="$emit('next-month')"
    />
    <slot name="navigation"></slot>
    <div class="h-6 w-px bg-border mx-1"></div>
    <DisciplineSelect
      id="calendar-search"
      v-model="searchValue"
      :searchable="false"
      :placeholder="searchPlaceholder"
      class="w-[200px]"
    />
    <AddEventButton @event-added="handleEventAdded" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import AddEventButton from "./AddEventButton.vue";
import MonthNavigator from "./MonthNavigator.vue";
import DisciplineSelect from "@/components/DisciplineSelect.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";

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
  (e: "search", query: string): void;
}>();

const calendarStore = useCalendarStore();
const rupEntryStore = useRupEntryStore();

// Local model for the search select — acts as a persistent filter.
const searchValue = ref<string | null>(null);

watch(searchValue, (value) => {
  if (!value) {
    emit("search", "");
    return;
  }
  const e = rupEntryStore.getRupEntryById(value);
  emit("search", e ? `${e.moduleIndex} ${e.moduleName} - ${e.learningOutcome}` : "");
});

const handleEventAdded = (event: CalendarEvent) => {
  // Event is already added to the store in AddEventButton
  // Propagate event to parent components if they want to react further
  emit("event-added", event);
};
</script>
