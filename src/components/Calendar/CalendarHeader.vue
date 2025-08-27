<template>
  <div class="flex justify-between items-center mb-3">
    <div class="flex items-center" @wheel="handleWheel" ref="monthNavArea">
      <div class="flex items-center">
        <h1 class="text-xl text-foreground">{{ monthName }} {{ year }}</h1>
        <div
          v-if="currentSemester"
          class="ml-3 px-3 py-1 bg-secondary rounded-full"
        >
          <span class="text-sm font-medium text-secondary-foreground"
            >{{ currentSemester }} семестр</span
          >
        </div>
      </div>
      <div class="flex space-x-1 items-center ml-3">
        <button
          class="p-1 hover:bg-secondary rounded transition-colors"
          @click="$emit('previous-month')"
        >
          <i class="f7-icons text-muted-foreground text-sm">chevron_left</i>
        </button>
        <button
          class="p-1 hover:bg-secondary rounded transition-colors"
          @click="$emit('next-month')"
        >
          <i class="f7-icons text-muted-foreground text-sm">chevron_right</i>
        </button>
      </div>
    </div>
    <div class="w-52 flex justify-end">
      <button
        @click="$emit('today')"
        class="flex items-center w-fit hover:bg-secondary rounded-lg p-2 transition-colors"
      >
        <span
          class="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center mr-2"
          :class="{ 'bg-destructive': ifHoladay }"
        >
          {{ todayDate }}
        </span>
        <span
          class="text-primary font-semibold"
          :class="{ 'text-destructive': ifHoladay }"
          >Сегодня</span
        >
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useSemesterStore } from "@/stores/semesterStore";
import type { Semester } from "@/stores/semesterStore";

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

const semesterStore = useSemesterStore();
const currentSemester = computed(() => {
  const todayStr = new Date().toISOString().split("T")[0];
  const period = semesterStore.semesters.find(
    (p) => p.startDate <= todayStr && todayStr <= p.endDate
  );
  return period ? period.shortName : "";
});

let scrollTimeout: number | null = null;
const scrollDelay = 200;

const handleWheel = (event: WheelEvent) => {
  event.preventDefault();

  if (scrollTimeout !== null) return;

  scrollTimeout = window.setTimeout(() => {
    scrollTimeout = null;
  }, scrollDelay);

  if (event.deltaY > 0 || event.deltaX > 0) {
    triggerEmit("next-month");
  } else if (event.deltaY < 0 || event.deltaX < 0) {
    triggerEmit("previous-month");
  }
};

const triggerEmit = (event: "previous-month" | "next-month" | "today") => {
  if (event === "previous-month") {
    const button = monthNavArea.value?.querySelector("button:first-of-type");
    if (button) {
      button.classList.add("bg-secondary");
      setTimeout(() => button.classList.remove("bg-secondary"), 150);
    }
  } else if (event === "next-month") {
    const button = monthNavArea.value?.querySelector("button:last-of-type");
    if (button) {
      button.classList.add("bg-secondary");
      setTimeout(() => button.classList.remove("bg-secondary"), 150);
    }
  }

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
