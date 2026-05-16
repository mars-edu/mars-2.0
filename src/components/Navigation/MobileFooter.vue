<template>
  <f7-toolbar
    tabbar
    labels
    position="bottom"
    class="mobile-footer fixed bottom-0 left-0 right-0 w-full h-[72px]"
  >
    <f7-link
      class="footer-link menu-trigger"
      @click="openMobile"
    >
      <div class="icon-wrapper">
        <IconMenu />
      </div>
      <span class="tabbar-label">{{ common_menu() }}</span>
    </f7-link>

    <f7-link
      v-for="item in footerItems"
      :key="item.id"
      class="footer-link"
      :class="{ 'active': activeItem === item.id }"
      @click="navigate(item.route)"
    >
      <div class="icon-wrapper">
        <component :is="navIconMap[item.id]" />
      </div>
      <span class="tabbar-label">{{ item.label }}</span>
    </f7-link>
  </f7-toolbar>
</template>


<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { f7Toolbar, f7Link, f7 } from "framework7-vue";
import { useSidebar } from "@/composables/useSidebar";
import { useRBAC } from "@/composables/useRBAC";
import { useUserStore } from "@/stores/userStore";
import { common_menu } from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

// Icons
import IconMenu from "~icons/lucide/menu";
import IconHouse from "~icons/lucide/house";
import IconCalendar from "~icons/lucide/calendar";
import IconFileText from "~icons/lucide/file-text";
import IconBook from "~icons/lucide/book";
import IconCalendarDays from "~icons/lucide/calendar-days";

const { openMobile } = useSidebar();
const { getNavigationItems } = useRBAC();
const { locale } = useI18n();

const navIconMap: any = {
  "home": IconHouse,
  "planning": IconCalendarDays,
  "journals": IconBook,
  "rup": IconFileText,
  "schedule": IconCalendar,
};

// We only want a few items in the footer
const footerItemIds = ["home", "planning", "journals", "rup"];

const footerItems = computed(() => {
  // Ensure reactivity on locale
  locale.value;
  return getNavigationItems.value.filter(item => footerItemIds.includes(item.id));
});

const activeItem = ref("");

const updateActiveItem = () => {
  if (!f7.views.main || !f7.views.main.router || !f7.views.main.router.currentRoute) return;
  const currentPath = f7.views.main.router.currentRoute.path;
  if (!currentPath) return;
  
  const matchingItem = footerItems.value.reduce((best, item) => {
    if (
      item.route &&
      currentPath.startsWith(item.route) &&
      item.route.length > (best?.route?.length || 0)
    ) {
      return item;
    }
    return best;
  }, null as any);

  if (matchingItem) {
    activeItem.value = matchingItem.id;
  } else {
    activeItem.value = "";
  }
};

const navigate = (route: string) => {
  if (!f7.views.main) return;
  if (f7.views.main.router.currentRoute.path === route) return;
  f7.views.main.router.navigate(route);
};

onMounted(() => {
  updateActiveItem();
  if (f7.views.main) {
    f7.views.main.router.on("routeChanged", updateActiveItem);
  }
});

onUnmounted(() => {
  if (f7.views.main) {
    f7.views.main.router.off("routeChanged", updateActiveItem);
  }
});
</script>

<style scoped>
.mobile-footer {
  --f7-toolbar-bg-color: transparent;
  --f7-toolbar-border-color: transparent;
  --f7-link-highlight-color: transparent;
  background-color: hsl(var(--card) / 0.85) !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid hsl(var(--border)) !important;
  z-index: 5000 !important;
  display: flex !important;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
}

:deep(.toolbar-inner) {
  padding-top: 10px !important;
  align-items: flex-start !important;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 768px) {
  .mobile-footer {
    display: none !important;
  }
}

.footer-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  color: hsl(var(--muted-foreground));
  transition: all 0.2s ease;
  height: 100%;
}

.footer-link.active {
  color: hsl(var(--primary));
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.footer-link:active .icon-wrapper {
  transform: scale(0.9);
}

.footer-link.active .icon-wrapper {
  transform: scale(1.1);
}

:deep(.icon-wrapper svg) {
  width: 22px;
  height: 22px;
}

.tabbar-label {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}
</style>
