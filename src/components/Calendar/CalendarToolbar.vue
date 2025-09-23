<template>
  <div class="flex justify-between items-center mb-2" :class="class">
    <!-- Left side: Navigation -->
    <div class="flex items-center space-x-2">
      <sidebar-button @click="$emit('icon-click', 'sidebar')" />
      <button
        @click="$emit('today')"
        class="flex items-center w-fit hover:bg-secondary rounded-lg p-2 transition-colors"
      >
        <span
          class="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center mr-2"
        >
          {{ todayDate }}
        </span>
        <span class="text-primary font-semibold">Сегодня</span>
      </button>
      <MonthNavigator
        :monthName="monthName"
        :year="year"
        @previous-month="$emit('previous-month')"
        @next-month="$emit('next-month')"
      />
    </div>

    <slot name="navigation"></slot>

    <!-- Right side: Actions -->
    <div class="flex items-center space-x-2">
      <SearchInput
        :placeholder="searchPlaceholder"
        @search="$emit('search', $event)"
      />
      <list-button @click="$emit('icon-click', 'list')" />
      <AddEventButton @event-added="handleEventAdded" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import SidebarButton from "./SidebarButton.vue";
import ListButton from "./ListButton.vue";
import AddEventButton from "./AddEventButton.vue";
import SearchInput from "./SearchInput.vue";
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
  (e: "icon-click", value: string): void;
  (e: "search", query: string): void;
  (e: "event-added", event: CalendarEvent): void;
  (e: "today"): void;
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
