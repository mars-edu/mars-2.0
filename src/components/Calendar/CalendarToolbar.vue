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
    <SearchableSelectPopover
      id="calendar-search"
      :options="disciplineOptions"
      :placeholder="searchPlaceholder"
      class="w-[200px]"
      @update:modelValue="handleSearchSelect"
    />
    <AddEventButton @event-added="handleEventAdded" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import AddEventButton from "./AddEventButton.vue";
import MonthNavigator from "./MonthNavigator.vue";
import SearchableSelectPopover from "@/components/ui/SearchableSelectPopover.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useClass9Store } from "@/stores/class9Store";
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
const class9Store = useClass9Store();
const { class9Options } = storeToRefs(class9Store);

const disciplineOptions = computed(() => class9Options.value);

const handleSearchSelect = (value: string) => {
  const selected = disciplineOptions.value.find(o => o.value === value);
  if (selected) {
    emit("search", selected.text);
  }
};

const handleEventAdded = (event: CalendarEvent) => {
  // Event is already added to the store in AddEventButton
  // Propagate event to parent components if they want to react further
  emit("event-added", event);
};
</script>
