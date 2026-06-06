<template>
  <!-- Backdrop for mobile -->
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 bg-black/50 z-[105] md:hidden backdrop-blur-sm transition-opacity duration-300"
    @click="closeMobile"
  ></div>

  <aside
    class="fixed top-0 bottom-0 bg-card border-r border-border z-[110] shadow-sm transition-all duration-300 overflow-visible"
    :class="[
      sidebarWidth,
      isMobileOpen ? 'left-0' : '-left-64 md:left-0'
    ]"
    style="display: grid; grid-template-rows: auto 1fr auto"
  >
    <!-- Logo Area -->
    <Logo variant="sidebar" :isExpanded="!collapsed || isMobileOpen" />

    <!-- Toggle button on right edge - Hidden on mobile -->
    <button
      class="hidden md:flex absolute -right-3 top-6 z-[100] h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors"
      @click="toggle"
      :title="collapsed ? sidebar_expand() : sidebar_collapse()"
    >
      <component
        :is="collapsed ? IconChevronRight : IconChevronLeft"
        class="w-3 h-3 text-muted-foreground"
      />
    </button>

    <!-- Nav items -->
    <div
      class="w-full px-2 pt-2 pb-4 space-y-2"
      :class="(collapsed && !isMobileOpen) ? 'overflow-visible' : 'overflow-y-auto overflow-x-hidden'"
    >
      <nav class="flex flex-col space-y-1 w-full">
        <SidebarItem
          v-for="item in navigationItems"
          :key="item.id"
          :label="item.label"
          :active="item.id === activeItem"
          :collapsed="collapsed && !isMobileOpen"
          @click="handleNavItemClick(item.id)"
        >
          <component :is="navIconMap[item.id]" class="w-[22px] h-[22px]" />
        </SidebarItem>
      </nav>
    </div>

    <!-- Profile / bottom items -->
    <div v-if="profileMenuItems.length > 0" class="border-t border-border bg-card px-2 py-3">
      <div class="flex flex-col space-y-1">
        <SidebarItem
          v-for="item in profileMenuItems"
          :key="item.id"
          :label="item.label"
          :active="false"
          :collapsed="collapsed && !isMobileOpen"
          @click="handleProfileItemClick(item.id)"
        >
          <component :is="profileIconMap[item.id]" class="w-[22px] h-[22px]" />
        </SidebarItem>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import { useRBAC } from "@/composables/useRBAC";
import { useSidebar } from "@/composables/useSidebar";
import { f7, f7ready } from "framework7-vue";
import AuthService from "@/services/auth";
import type { NavigationItem } from "@/composables/useRBAC";
import SidebarItem from "./SidebarItem.vue";
import Logo from "../Logo/Logo.vue";
import { sidebar_expand, sidebar_collapse } from "@/paraglide/messages";

// Lucide icons via unplugin-icons
import IconHouse from "~icons/lucide/house";
import IconGraduationCap from "~icons/lucide/graduation-cap";
import IconBookOpen from "~icons/lucide/book-open";
import IconCalendar from "~icons/lucide/calendar";
import IconFileText from "~icons/lucide/file-text";
import IconClipboardList from "~icons/lucide/clipboard-list";
import IconLayoutList from "~icons/lucide/layout-list";
import IconBarChart2 from "~icons/lucide/bar-chart-2";
import IconFileBarChart from "~icons/lucide/file-bar-chart";
import IconCalendarDays from "~icons/lucide/calendar-days";
import IconUsers from "~icons/lucide/users";
import IconUserCheck from "~icons/lucide/user-check";
import IconCircleUser from "~icons/lucide/circle-user";
import IconSettings from "~icons/lucide/settings";
import IconLogOut from "~icons/lucide/log-out";
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconLayoutGrid from "~icons/lucide/layout-grid";
import IconLayout from "~icons/lucide/layout";
import IconPieChart from "~icons/lucide/pie-chart";
import IconClock from "~icons/lucide/clock";
import IconBook from "~icons/lucide/book";
import IconDoorOpen from "~icons/lucide/door-open";
import IconFlaskConical from "~icons/lucide/flask-conical";

const navIconMap: Record<string, Component> = {
  "home": IconHouse,
  "planning": IconCalendarDays,
  "journals": IconBook,
  "ktp": IconLayoutGrid,
  "reports": IconFileBarChart,
  "testing": IconFlaskConical,
  "courses": IconGraduationCap,
  "protocol": IconLayout,
  "analytics": IconPieChart,
  "rup": IconFileText,
  "schedule": IconCalendar,
  "timetable": IconClock,
  "workload": IconLayoutGrid,
  "cabinet-management": IconDoorOpen,
  "specialty-catalog": IconBookOpen,
  "student-card": IconUsers,
  "discipline-catalog": IconBook,
  "teacher-card": IconUserCheck,
  "settings": IconSettings,
};

const profileIconMap: Record<string, Component> = {
  "profile": IconCircleUser,
  "logout": IconLogOut,
};

interface Props {
  activeNavItem?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeNavItem: "home",
});

const { collapsed, sidebarWidth, toggle, isMobileOpen, closeMobile } = useSidebar();
const { getNavigationItems, getProfileMenuItems } = useRBAC();

const navigationItems = computed(() => getNavigationItems.value);
const profileMenuItems = computed(() => getProfileMenuItems.value);

const emit = defineEmits<{
  (e: "update:activeNavItem", value: string): void;
}>();

const activeItem = computed({
  get: () => props.activeNavItem,
  set: (value) => emit("update:activeNavItem", value),
});

const handleNavItemClick = (itemId: string): void => {
  activeItem.value = itemId;
  if (isMobileOpen.value) {
    closeMobile();
  }
  const item = navigationItems.value.find((item) => item.id === itemId);
  if (item && item.route) {
    f7.views.main.router.navigate(item.route);
  }
};

const handleProfileItemClick = async (itemId: string): Promise<void> => {
  if (isMobileOpen.value) {
    closeMobile();
  }
  if (itemId === "logout") {
    await AuthService.logout();
    f7.views.main.router.navigate("/login");
    return;
  }
  const item = profileMenuItems.value.find((item) => item.id === itemId);
  if (item && item.route) {
    f7.views.main.router.navigate(item.route);
  }
};

const updateActiveItem = () => {
  if (!f7.views.main || !f7.views.main.router || !f7.views.main.router.currentRoute) return;
  const currentPath = f7.views.main.router.currentRoute.path;
  if (!currentPath) return;

  const normalizePath = (p: string) => (p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p);
  const currentNormalized = normalizePath(currentPath);

  const matchingItem = navigationItems.value.reduce((best, item) => {
    if (!item.route) return best;
    const itemNormalized = normalizePath(item.route);
    if (
      (currentNormalized === itemNormalized || currentNormalized.startsWith(itemNormalized + "/")) &&
      item.route.length > (best?.route?.length || 0)
    ) {
      return item;
    }
    return best;
  }, null as NavigationItem | null);
  if (matchingItem) {
    activeItem.value = matchingItem.id;
  }
};

import { onMounted, onUnmounted } from "vue";

onMounted(() => {
  f7ready(() => {
    updateActiveItem();
    f7.views.main.router.on("routeChanged", updateActiveItem);
  });
});

onUnmounted(() => {
  if (f7 && f7.views && f7.views.main) {
    f7.views.main.router.off("routeChanged", updateActiveItem);
  }
});
</script>
