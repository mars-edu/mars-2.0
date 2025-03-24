<template>
  <div
    class="flex overflow-hidden rounded-lg border transition-colors"
    :class="[themeClasses.background, themeClasses.border]"
  >
    <button
      v-for="lang in languages"
      :key="lang.code"
      class="px-3 py-1.5 text-sm font-medium transition-colors"
      :class="{
        'bg-red-500 text-white': lang.code === activeLanguage,
        [themeClasses.hoverBackground]: lang.code !== activeLanguage,
      }"
      @click="$emit('change', lang.code)"
    >
      {{ lang.code }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Language } from "@/composables/useLanguage";
import { computed } from "vue";

interface Props {
  languages: Language[];
  activeLanguage: string;
  theme?: "light" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "light",
});

defineEmits<{
  (e: "change", code: string): void;
}>();

const themeClasses = computed(() => {
  switch (props.theme) {
    case "dark":
      return {
        background: "bg-gray-700",
        border: "border-gray-600",
        hoverBackground: "hover:bg-gray-600",
      };
    case "lavanda":
      return {
        background: "bg-purple-100",
        border: "border-purple-200",
        hoverBackground: "hover:bg-purple-200",
      };
    default:
      return {
        background: "bg-gray-100",
        border: "border-gray-200",
        hoverBackground: "hover:bg-gray-200",
      };
  }
});
</script>
