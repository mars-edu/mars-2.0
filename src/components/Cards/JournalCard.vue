<template>
  <div
    class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sun to-amber-400 transition-all duration-300 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.98]"
    @click="$emit('click')"
  >
    <div
      class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
    ></div>
    <div class="relative p-4 flex items-start gap-2 h-min-[95px]">
      <div class="flex-1 min-w-0 flex flex-col justify-between h-full">
        <div
          class="text-sm font-bold text-gray-900 leading-5 mb-1 drop-shadow-sm"
        >
          {{ title }}
        </div>
        <div class="flex flex-col gap-1">
          <div class="text-xs font-medium text-gray-700">
            {{ subtitle }}
          </div>
          <div class="text-xs font-medium text-gray-500 leading-4">
            {{ schedule }}
          </div>
        </div>
      </div>
      <div class="shrink-0 w-12 h-12 relative self-end">
        <svg viewBox="0 0 44 44" class="w-12 h-12 -rotate-90 drop-shadow-sm">
          <circle
            cx="22"
            cy="22"
            r="18"
            stroke="rgba(156, 163, 175, 0.2)"
            stroke-width="4"
            fill="none"
            stroke-linecap="round"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            :stroke="progressColor"
            stroke-width="4"
            fill="none"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            class="transition-all duration-500 ease-out"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xs font-bold text-gray-900 drop-shadow-sm"
            >{{ percent }}%</span
          >
        </div>
      </div>
    </div>
    <div
      class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  title: string;
  subtitle: string;
  schedule: string;
  percent?: number;
}

const props = withDefaults(defineProps<Props>(), {
  percent: 0,
});

const circumference = 2 * Math.PI * 30;
const normalized = computed(() => Math.min(100, Math.max(0, props.percent)));
const dashOffset = computed(() => circumference * (1 - normalized.value / 100));
const progressColor = computed(() => {
  if (normalized.value >= 75) return "#10b981";
  if (normalized.value >= 50) return "#f59e0b";
  return "#ef4444";
});
</script>
