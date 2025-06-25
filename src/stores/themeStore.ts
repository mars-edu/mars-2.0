import { defineStore } from "pinia";
import { ref } from "vue";

type Theme = "light" | "dark" | "lavanda";

export const useThemeStore = defineStore(
  "theme",
  () => {
    const currentTheme = ref<Theme>("light");

    function setTheme(theme: Theme) {
      currentTheme.value = theme;

      document.documentElement.classList.remove("dark", "lavanda");

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
      document.documentElement.classList.remove("dark", "lavanda");
    }

    return {
      currentTheme,
      setTheme,
      initTheme,
      reset,
    };
  },
  {
    persist: true,
  }
);
