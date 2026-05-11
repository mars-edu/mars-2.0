import { defineStore } from "pinia";
import { ref } from "vue";
import { THEMES } from "@/types/theme";
import type { Theme } from "@/types/theme";

export const useThemeStore = defineStore(
  "theme",
  () => {
    const currentTheme = ref<Theme>("light");

    function setTheme(theme: Theme) {
      currentTheme.value = theme;

      // Remove all theme classes except 'light' which is the default (no class)
      THEMES.forEach(t => {
        if (t !== "light") document.documentElement.classList.remove(t);
      });

      if (theme !== "light") {
        document.documentElement.classList.add(theme);
      }
    }

    function initTheme() {
      // const prefersDark = window.matchMedia(
      //   "(prefers-color-scheme: dark)"
      // ).matches;
      // setTheme(prefersDark ? "dark" : "light");
      setTheme(currentTheme.value);
    }

    function reset() {
      currentTheme.value = "light";
      THEMES.forEach(t => {
        if (t !== "light") document.documentElement.classList.remove(t);
      });
    }

    return {
      currentTheme,
      setTheme,
      initTheme,
      reset,
    };
  },
  {
    persist: {
      storage: localStorage,
    },
  }
);
