<template>
  <div class="flex justify-between items-center mb-2">
    <!-- Icon navigation buttons -->
    <div class="flex items-center space-x-2 justify-center">
      <navigation-button
        v-for="(icon, index) in icons"
        :key="index"
        :icon="icon.name"
        @click="$emit('icon-click', icon.value)"
      />
      <add-event-button
        @event-added="handleEventAdded"
        :module-options="moduleOptions"
        :learning-outcome-options="learningOutcomeOptions"
      />
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
import NavigationButton from "./NavigationButton.vue";
import AddEventButton from "./AddEventButton.vue";
import SearchInput from "./SearchInput.vue";
import { useEventService } from "./EventService";
import type { EventData } from "./EventService";

const props = defineProps<{
  icons: { name: string; value: string }[];
  searchPlaceholder: string;
}>();

const emit = defineEmits<{
  (e: "icon-click", value: string): void;
  (e: "search", query: string): void;
  (e: "add-event", event: EventData): void;
}>();

const { eventService } = useEventService();
const moduleOptions = ref<string[]>([]);
const learningOutcomeOptions = ref<string[]>([]);

onMounted(async () => {
  moduleOptions.value = await eventService.value.getModuleOptions();
  learningOutcomeOptions.value =
    await eventService.value.getLearningOutcomeOptions();
});

const handleEventAdded = async (eventData: EventData) => {
  await eventService.value.addEvent(eventData);
  emit("add-event", eventData);
};
</script>
