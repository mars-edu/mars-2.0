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
    <search-input
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
import { useEventService } from "./EventService";
import type { EventData } from "./EventService";

const props = defineProps<{
  class?: string;
  searchPlaceholder: string;
}>();

const emit = defineEmits<{
  (e: "icon-click", value: string): void;
  (e: "search", query: string): void;
  (e: "add-event", event: EventData): void;
}>();

const { eventService } = useEventService();

const handleEventAdded = async (eventData: EventData) => {
  await eventService.value.addEvent(eventData);
  emit("add-event", eventData);
};
</script>
