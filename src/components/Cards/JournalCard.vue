<template>
  <div
    class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sun to-amber-400 transition-all duration-300 cursor-pointer select-none hover:scale-[1.02] active:scale-[0.98]"
    @click="handleClick"
  >
    <div
      class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"
    ></div>
    <div
      v-if="selectionMode"
      class="absolute top-3 right-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200"
      :class="
        selected ? 'bg-primary border-primary' : 'bg-white/80 border-gray-400'
      "
    >
      <IconCheck
        v-if="selected"
        class="w-4 h-4 text-white"
      />
    </div>
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
          <div v-if="groupLanguage" class="text-xs font-medium text-gray-700">
            Язык: {{ groupLanguage }}
          </div>
          <div class="text-xs font-medium text-gray-500 leading-4">
            {{ schedule }}
          </div>
        </div>
      </div>
      <div
        v-if="showEditButton && !selectionMode"
        class="shrink-0 mr-2 self-center"
      >
        <button
          @click="handleEditClick"
          class="w-8 h-8 rounded-lg bg-white/30 hover:bg-white/50 flex items-center justify-center transition-colors"
        >
          <IconPencil class="w-[18px] h-[18px] text-gray-900" />
        </button>
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
import IconCheck from "~icons/lucide/check";
import IconPencil from "~icons/lucide/pencil";

interface Props {
  title: string;
  subtitle: string;
  schedule: string;
  groupLanguage?: string;
  percent?: number;
  selectionMode?: boolean;
  selected?: boolean;
  showEditButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  percent: 0,
  selectionMode: false,
  selected: false,
  showEditButton: false,
});

const emit = defineEmits<{
  click: [];
  "toggle-select": [];
  edit: [];
}>();

const handleClick = () => {
  if (props.selectionMode) {
    emit("toggle-select");
  } else {
    emit("click");
  }
};

const handleEditClick = (event: Event) => {
  event.stopPropagation();
  emit("edit");
};

const circumference = 2 * Math.PI * 30;
const normalized = computed(() => Math.min(100, Math.max(0, props.percent)));
const dashOffset = computed(() => circumference * (1 - normalized.value / 100));
const progressColor = computed(() => {
  if (normalized.value >= 75) return "#10b981";
  if (normalized.value >= 50) return "#f59e0b";
  return "#ef4444";
});
</script>
