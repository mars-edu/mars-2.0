import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";

const collapsed = useLocalStorage("sidebar-collapsed", false);

export function useSidebar() {
  const sidebarWidth = computed(() => (collapsed.value ? "w-20" : "w-64"));
  const contentMargin = computed(() => (collapsed.value ? "md:ml-20" : "md:ml-64"));

  function toggle() {
    collapsed.value = !collapsed.value;
  }

  return { collapsed, sidebarWidth, contentMargin, toggle };
}
