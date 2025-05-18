<!-- ThemeToggle.vue -->
<template>
  <div>
    <!-- Desktop view (hidden on small screens) -->
    <div
      class="hidden sm:flex overflow-hidden rounded-lg border transition-colors"
      :class="[themeClasses.background, themeClasses.border]"
    >
      <button
        v-for="theme in availableThemes"
        :key="theme.value"
        class="px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
        :class="{
          'bg-red-500 text-white': theme.value === themeStore.currentTheme,
          [themeClasses.hoverBackground]: theme.value !== themeStore.currentTheme,
        }"
        @click="handleThemeChange(theme.value)"
      >
        {{ theme.label }}
      </button>
    </div>

    <!-- Mobile view (visible only on small screens) -->
    <div
      class="sm:hidden"
      :class="[themeClasses.background, themeClasses.border]"
    >
      <select
        :value="themeStore.currentTheme"
        @change="(e) => handleThemeChange((e.target as HTMLSelectElement).value as ThemeOption)"
        class="w-full px-3 py-1.5 text-sm font-medium rounded-lg border appearance-none cursor-pointer bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
        :class="[themeClasses.border]"
      >
        <option
          v-for="theme in availableThemes"
          :key="theme.value"
          :value="theme.value"
        >
          {{ theme.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from "../stores/themeStore";
import { computed } from "vue";

type ThemeOption = "light" | "dark" | "lavanda";

interface ThemeChoice {
  value: ThemeOption;
  label: string;
}

const themeStore = useThemeStore();

const availableThemes: ThemeChoice[] = [
  { value: 'light', label: '☀️ светлая' },
  { value: 'dark', label: '🌙 темная' },
  { value: 'lavanda', label: '💜 лавандовая' }
];

const handleThemeChange = (value: ThemeOption) => {
  themeStore.setTheme(value);
};

const themeClasses = computed(() => {
  switch (themeStore.currentTheme) {
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

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>
