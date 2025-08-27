<template>
  <div
    class="h-6 w-full rounded-md border border-border flex items-center justify-center text-xs group"
    :class="cellClass"
  >
    <span v-if="mark !== null && mark !== ''" class="font-semibold">{{
      mark
    }}</span>
    <span
      v-else
      class="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >+</span
    >
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
