<template>
  <div class="flex justify-between items-center mb-2" :class="class">
    <!-- Icon navigation buttons -->
    <div class="flex items-center space-x-2 justify-center">
      <sidebar-button @click="$emit('icon-click', 'sidebar')" />
      <list-button @click="$emit('icon-click', 'list')" />
    </div>
    <AddEventButton @event-added="handleEventAdded" />

    <!-- Month navigation UI (moved from CalendarHeader) -->
    <div class="flex items-center" @wheel="handleWheel" ref="monthNavArea">
      <button
        class="p-1 hover:bg-secondary rounded transition-colors"
        @click="$emit('previous-month')"
      >
        <i class="f7-icons text-muted-foreground text-sm">chevron_left</i>
      </button>
      <h1 class="text-xl text-foreground px-2 select-none min-w-fit">
        {{ monthName }} {{ year }}
      </h1>
      <button
        class="p-1 hover:bg-secondary rounded transition-colors"
        @click="$emit('next-month')"
      >
        <i class="f7-icons text-muted-foreground text-sm">chevron_right</i>
      </button>
    </div>

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

const monthNavArea = ref<HTMLElement | null>(null);
let scrollTimeout: number | null = null;
const scrollDelay = 200;

const handleWheel = (event: WheelEvent) => {
  event.preventDefault();
  if (scrollTimeout !== null) return;
  scrollTimeout = window.setTimeout(() => {
    scrollTimeout = null;
  }, scrollDelay);
  if (event.deltaY > 0 || event.deltaX > 0) {
    emit("next-month");
  } else if (event.deltaY < 0 || event.deltaX < 0) {
    emit("previous-month");
  }
};

const handleEventAdded = (event: CalendarEvent) => {
  // Event is already added to the store in AddEventButton
  // Propagate event to parent components if they want to react further
  emit("event-added", event);
};
</script>
