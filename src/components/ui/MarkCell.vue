<template>
  <div
    class="h-6 w-full rounded-md border border-border flex items-center justify-center text-xs"
    :class="cellClass"
  >
    <span :class="{ 'text-green-600': mark === '+' }">{{ mark }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  mark: {
    type: String,
    default: '',
  },
});

const cellClass = computed(() => {
  if (props.mark && props.mark !== '+') {
    return 'font-semibold';
  }
  return '';
});
</script> 