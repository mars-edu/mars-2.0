<template>
  <div
    class="h-6 w-full rounded-md border border-border flex items-center justify-center text-xs group relative"
    :class="cellClass"
  >
    <span v-if="mark !== null && mark !== ''" class="font-semibold relative z-10">{{
      mark
    }}</span>
    <span
      v-else
      class="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >+</span
    >
    <!-- Pencil icon overlay for filled cells -->
    <div
      v-if="mark !== null && mark !== ''"
      class="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-3 h-3 text-primary"
      >
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  mark: string | number | null;
}

const props = defineProps<Props>();

const cellClass = computed(() => {
  if (props.mark !== null && props.mark !== "") {
    return "font-semibold";
  }
  return "hover:bg-muted/30 cursor-pointer";
});
</script>
