import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";

const collapsed = useLocalStorage("sidebar-collapsed", false);

export function useSidebar() {
  const sidebarWidth = computed(() => (collapsed.value ? "w-16" : "w-64"));
  const contentMargin = computed(() => (collapsed.value ? "ml-16" : "ml-64"));

  function toggle() {
    collapsed.value = !collapsed.value;
  }

  return { collapsed, sidebarWidth, contentMargin, toggle };
}
