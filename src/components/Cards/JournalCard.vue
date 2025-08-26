<template>
  <div
    class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sun to-amber-400 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.98]"
    @click="$emit('click')"
  >
    <!-- Subtle background pattern -->
    <div
      class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
    ></div>

    <!-- Main content -->
    <div class="relative p-6 flex items-start gap-4 min-h-[140px]">
      <div class="flex-1 min-w-0">
        <div class="text-lg font-bold text-white leading-6 mb-3 drop-shadow-sm">
          {{ title }}
        </div>
        <div class="text-sm font-medium text-white/80 mb-2 leading-5">
          {{ subtitle }}
        </div>
        <div class="text-sm font-medium text-white/70 leading-5">
          {{ schedule }}
        </div>
      </div>

      <!-- Progress circle -->
      <div class="shrink-0 w-20 h-20 relative">
        <!-- Background circle -->
        <svg viewBox="0 0 72 72" class="w-20 h-20 -rotate-90 drop-shadow-sm">
          <circle
            cx="36"
            cy="36"
            r="30"
            stroke="rgba(255, 255, 255, 0.2)"
            stroke-width="6"
            fill="none"
            stroke-linecap="round"
          />
          <circle
            cx="36"
            cy="36"
            r="30"
            :stroke="progressColor"
            stroke-width="6"
            fill="none"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            class="transition-all duration-500 ease-out"
          />
        </svg>
        <!-- Percentage text -->
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-lg font-bold text-white drop-shadow-sm"
            >{{ percent }}%</span
          >
        </div>
      </div>
    </div>

    <!-- Subtle bottom highlight -->
    <div
      class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
  if (normalized.value >= 75) return "#10b981"; // emerald-500
  if (normalized.value >= 50) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
});
</script>
