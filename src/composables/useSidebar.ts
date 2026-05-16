import { useLocalStorage, useMediaQuery } from "@vueuse/core";
import { computed, ref } from "vue";

const collapsed = useLocalStorage("sidebar-collapsed", false);
const isMobileOpen = ref(false);

export function useSidebar() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const sidebarWidth = computed(() => (collapsed.value ? "w-20" : "w-64"));
  const contentMargin = computed(() => (collapsed.value ? "md:ml-20" : "md:ml-64"));

  function toggle() {
    if (isMobile.value) {
      isMobileOpen.value = !isMobileOpen.value;
    } else {
      collapsed.value = !collapsed.value;
    }
  }

  function openMobile() {
    isMobileOpen.value = true;
  }

  function closeMobile() {
    isMobileOpen.value = false;
  }

  return { 
    collapsed, 
    isMobileOpen, 
    sidebarWidth, 
    contentMargin, 
    toggle, 
    openMobile, 
    closeMobile,
    isMobile 
  };
}
