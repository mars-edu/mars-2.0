<!-- ThemeToggle.vue -->
<template>
  <div class="flex items-center gap-2 p-1.5 rounded-full border border-border bg-card shadow-sm">
    <button
      v-for="t in themes"
      :key="t.value"
      :title="t.label"
      class="w-5 h-5 rounded-full border border-border/60 transition-transform hover:scale-110 flex items-center justify-center flex-shrink-0"
      :class="themeStore.currentTheme === t.value ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''"
      :style="{ backgroundColor: t.color }"
      @click="themeStore.setTheme(t.value)"
    >
      <svg
        v-if="themeStore.currentTheme === t.value"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-2.5 h-2.5"
        :class="t.value === 'dark' ? 'text-white' : 'text-gray-600'"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from "../stores/themeStore";
import type { Theme } from "@/types/theme";

const themeStore = useThemeStore();

interface ThemeOption {
  value: Theme;
  color: string;
  label: string;
}

const themes: ThemeOption[] = [
  { value: 'light',    color: '#ffffff',  label: 'Светлая' },
  { value: 'dark',     color: '#1f2937',  label: 'Темная' },
  { value: 'lavanda',  color: '#e9d5ff',  label: 'Лавандовая' },
  { value: 'coral',    color: '#fff7ed',  label: 'Коралловая' },
  { value: 'graphite', color: '#f1f5f9',  label: 'Графитовая' },
];
</script>
