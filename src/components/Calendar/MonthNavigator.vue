<template>
  <div class="flex items-center bg-card rounded-lg p-1 shadow-sm border border-border" @wheel="handleWheel" ref="monthNavArea">
    <button
      class="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
      @click="$emit('previous-month')"
    >
      <IconChevronLeft class="text-xl" />
    </button>
    <div class="px-4 font-semibold text-foreground min-w-[140px] text-center select-none">
      {{ monthName }} {{ year }}
    </div>
    <button
      class="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
      @click="$emit('next-month')"
    >
      <IconChevronRight class="text-xl" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconChevronRight from "~icons/lucide/chevron-right";

defineProps<{
  monthName: string;
  year: string;
}>();

const emit = defineEmits<{
  (e: "previous-month"): void;
  (e: "next-month"): void;
}>();

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
</script>
