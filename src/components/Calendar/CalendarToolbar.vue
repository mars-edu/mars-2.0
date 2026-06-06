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
    <Select
      id="calendar-search"
      v-model="searchValue"
      :options="disciplineOptions"
      :placeholder="searchPlaceholder"
      class="w-[200px]"
    />
    <AddEventButton @event-added="handleEventAdded" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import AddEventButton from "./AddEventButton.vue";
import MonthNavigator from "./MonthNavigator.vue";
import Select from "@/components/ui/Select.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { storeToRefs } from "pinia";

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
const { rupEntryOptions } = storeToRefs(rupEntryStore);

const disciplineOptions = computed(() => rupEntryOptions.value);

// Local model for the search select — acts as a persistent filter.
const searchValue = ref<string | null>(null);

watch(searchValue, (value) => {
  if (!value) {
    emit("search", "");
    return;
  }
  const selected = disciplineOptions.value.find(o => o.value === value);
  if (selected) {
    emit("search", selected.text);
  } else {
    emit("search", "");
  }
});

const handleEventAdded = (event: CalendarEvent) => {
  // Event is already added to the store in AddEventButton
  // Propagate event to parent components if they want to react further
  emit("event-added", event);
};
</script>
