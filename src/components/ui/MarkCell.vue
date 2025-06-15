<template>
  <div
    class="h-6 w-full rounded-md border border-border flex items-center justify-center text-xs"
    :class="cellClass"
  >
    <span :class="{ 'text-green-600': mark === null }">{{
      mark === null ? "+" : mark
    }}</span>
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
  return "";
});
</script> 