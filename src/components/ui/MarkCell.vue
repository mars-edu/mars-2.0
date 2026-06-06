<template>
  <div
    class="h-7 w-[calc(100%-8px)] mx-auto rounded-md border flex items-center justify-center text-[13px] group relative transition-colors"
    :class="cellClass"
  >
    <span v-if="mark !== null && mark !== ''" class="relative z-10" :class="mark === 'Н' ? 'text-destructive font-bold' : 'font-semibold text-foreground'">
      {{ mark }}
    </span>
    <span
      v-else-if="!disabled"
      class="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    >
      +
    </span>
    <!-- Pencil icon overlay for filled cells -->
    <div
      v-if="mark !== null && mark !== '' && !disabled"
      class="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md"
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
  mark: string | number | null | undefined;
  disabled?: boolean;
}

const props = defineProps<Props>();

const cellClass = computed(() => {
  if (props.disabled) {
    return "bg-muted/30 border-border/40 text-muted-foreground opacity-60 cursor-not-allowed";
  }
  if (props.mark !== null && props.mark !== "") {
    return "bg-muted/50 border-border/60 hover:bg-background cursor-pointer";
  }
  return "bg-muted/50 border-border/60 hover:bg-background cursor-pointer text-muted-foreground";
});
</script>
