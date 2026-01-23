<template>
  <div
    class="flex overflow-hidden rounded-lg border transition-colors min-w-[100px]"
    :class="[themeClasses.background, themeClasses.border]"
  >
    <button
      v-for="lang in availableLanguages"
      :key="lang.code"
      class="px-3 py-1.5 text-sm font-medium transition-colors"
      :class="{
        'bg-red-500 text-white': lang.code === activeLanguage,
        [themeClasses.hoverBackground]: lang.code !== activeLanguage,
      }"
      @click="setLanguage(lang.code)"
    >
      {{ lang.code }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useLanguage } from "@/composables/useLanguage";
import { useThemeStore } from "@/stores/themeStore";
import { computed } from "vue";

interface Props {
  theme?: "light" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  theme: "light",
});

const { activeLanguage, availableLanguages, setLanguage } = useLanguage();
const themeStore = useThemeStore();

const themeClasses = computed(() => {
  const currentTheme = props.theme || themeStore.currentTheme;

  switch (currentTheme) {
    case "dark":
      return {
        background: "bg-gray-700",
        border: "border-gray-600",
        hoverBackground: "hover:bg-gray-600",
        textColor: "text-gray-200",
      };
    case "lavanda":
      return {
        background: "bg-purple-100",
        border: "border-purple-200",
        hoverBackground: "hover:bg-purple-200",
        textColor: "text-purple-900",
      };
    default:
      return {
        background: "bg-gray-100",
        border: "border-gray-200",
        hoverBackground: "hover:bg-gray-200",
        textColor: "text-gray-700",
      };
  }
});
</script>
