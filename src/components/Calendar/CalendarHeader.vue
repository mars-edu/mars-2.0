<template>
  <div class="flex justify-between items-center mb-3">
    <div class="flex items-center" @wheel="handleWheel" ref="monthNavArea">
      <h1 class="text-xl text-gray-900">{{ monthName }} {{ year }}</h1>
      <div class="flex space-x-1 items-center ml-3">
        <button
          class="p-1 hover:bg-gray-100 rounded transition-colors"
          @click="$emit('previous-month')"
        >
          <i class="f7-icons text-gray-600 text-sm">chevron_left</i>
        </button>
        <button
          class="p-1 hover:bg-gray-100 rounded transition-colors"
          @click="$emit('next-month')"
        >
          <i class="f7-icons text-gray-600 text-sm">chevron_right</i>
        </button>
      </div>
    </div>
    <div class="text-xl font-bold uppercase text-gray-900">ПЛАНИРОВАНИЕ</div>
    <div class="w-52 flex justify-end">
      <button
        @click="$emit('today')"
        class="flex items-center w-fit hover:bg-gray-100 rounded-lg p-2 transition-colors"
      >
        <span
          class="w-9 h-9 bg-green-600 text-white rounded-full flex items-center justify-center mr-2"
          :class="{ 'bg-red-600': ifHoladay }"
        >
          {{ todayDate }}
        </span>
        <span
          class="text-green-600 font-semibold"
          :class="{ 'text-red-600': ifHoladay }"
          >Сегодня</span
        >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  monthName: string;
  year: string;
  todayDate: string;
}>();

const emit = defineEmits<{
  (e: "today"): void;
  (e: "previous-month"): void;
  (e: "next-month"): void;
}>();

const ifHoladay = ref(false);
const monthNavArea = ref<HTMLElement | null>(null);

// Add debounce to prevent multiple rapid scrolls
let scrollTimeout: number | null = null;
const scrollDelay = 200; // ms

const handleWheel = (event: WheelEvent) => {
  event.preventDefault();

  // If there's an active timeout, don't process this scroll event
  if (scrollTimeout !== null) return;

  // Set a timeout to prevent rapid scrolling
  scrollTimeout = window.setTimeout(() => {
    scrollTimeout = null;
  }, scrollDelay);

  // Determine scroll direction and emit appropriate event
  if (event.deltaY > 0 || event.deltaX > 0) {
    // Scrolling down or right
    triggerEmit("next-month");
  } else if (event.deltaY < 0 || event.deltaX < 0) {
    // Scrolling up or left
    triggerEmit("previous-month");
  }
};

// Helper function to emit events
const triggerEmit = (event: "previous-month" | "next-month" | "today") => {
  if (event === "previous-month") {
    // Add visual feedback
    const button = monthNavArea.value?.querySelector("button:first-of-type");
    if (button) {
      button.classList.add("bg-gray-100");
      setTimeout(() => button.classList.remove("bg-gray-100"), 150);
    }
  } else if (event === "next-month") {
    // Add visual feedback
    const button = monthNavArea.value?.querySelector("button:last-of-type");
    if (button) {
      button.classList.add("bg-gray-100");
      setTimeout(() => button.classList.remove("bg-gray-100"), 150);
    }
  }

  // Emit the event with type assertion
  if (event === "today") {
    emit("today");
  } else if (event === "previous-month") {
    emit("previous-month");
  } else if (event === "next-month") {
    emit("next-month");
  }
};
</script>

<style scoped>
.month-nav-area {
  cursor: ew-resize;
}
</style>
