<template>
  <div class="flex justify-between items-center mb-2" :class="class">
    <!-- Icon navigation buttons -->
    <div class="flex items-center space-x-2 justify-center">
      <sidebar-button @click="$emit('icon-click', 'sidebar')" />
      <list-button @click="$emit('icon-click', 'list')" />
      <AddEventButton @event-added="handleEventAdded" />
    </div>

    <slot name="navigation"></slot>

    <!-- Search bar -->
    <SearchInput
      :placeholder="searchPlaceholder"
      @search="$emit('search', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import SidebarButton from "./SidebarButton.vue";
import ListButton from "./ListButton.vue";
import AddEventButton from "./AddEventButton.vue";
import SearchInput from "./SearchInput.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";

const props = defineProps<{
  class?: string;
  searchPlaceholder: string;
}>();

const emit = defineEmits<{
  (e: "icon-click", value: string): void;
  (e: "search", query: string): void;
}>();

const calendarStore = useCalendarStore();

const handleEventAdded = (event: CalendarEvent) => {
  // Event is already added to the store in AddEventButton
  // This handler can be used for any additional logic in the toolbar if needed
};
</script>
