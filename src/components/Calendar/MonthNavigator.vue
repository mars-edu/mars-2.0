<template>
  <div class="flex items-center" @wheel="handleWheel" ref="monthNavArea">
    <button
      class="p-1 hover:bg-secondary rounded transition-colors"
      @click="$emit('previous-month')"
    >
      <IconChevronLeft class="text-muted-foreground text-sm" />
    </button>
    <h1 class="text-xl text-foreground px-2 select-none min-w-fit">
      {{ monthName }} {{ year }}
    </h1>
    <button
      class="p-1 hover:bg-secondary rounded transition-colors"
      @click="$emit('next-month')"
    >
      <IconChevronRight class="text-muted-foreground text-sm" />
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
