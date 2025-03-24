<!-- ThemeToggle.vue -->
<template>
  <div class="flex items-center gap-2">
    <f7-list inline class="m-0 p-0">
      <f7-list-item class="m-0">
        <f7-input
          type="select"
          :value="themeStore.currentTheme"
          @input="handleThemeChange"
          class="min-w-[120px]"
        >
          <option value="light">☀️</option>
          <option value="dark">🌙</option>
          <option value="lavanda">💜</option>
        </f7-input>
      </f7-list-item>
    </f7-list>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from "../stores/themeStore";

const themeStore = useThemeStore();

const handleThemeChange = (e: Event) => {
  const value = (e.target as HTMLSelectElement).value as
    | "light"
    | "dark"
    | "lavanda";
  themeStore.setTheme(value);
};
</script>

<style scoped>
:deep(.item-input) {
  min-width: 120px;
  padding: 0;
  margin: 0;
}

:deep(.item-content) {
  padding: 0;
  min-height: unset;
}

:deep(.item-inner) {
  padding: 0;
  min-height: unset;
}

:deep(.input-clear-button) {
  display: none;
}
</style>
