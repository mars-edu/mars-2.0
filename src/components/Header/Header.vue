<template>
  <div v-bind="$attrs" class="desktop-header desktop-only" :class="contentMargin">
    <div class="header-left">
      <!-- Left spacer or search can start here if needed -->
    </div>
    <div class="header-center">
      <SearchBar />
    </div>
    <div class="header-right">
      <div class="flex-shrink-0 min-w-[100px]">
        <LanguageSelector />
      </div>
      <div class="h-6 w-px bg-border flex-shrink-0"></div>
      <div class="flex-shrink-0">
        <ThemeToggle />
      </div>
      <div class="flex-shrink-0">
        <button
          id="notification-bell-button"
          @click="openNotificationCenter"
          class="relative w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-primary/10 text-muted-foreground hover:text-primary active:scale-95"
        >
          <IconBell class="text-[20px]" />
          <span
            v-if="unreadCount > 0"
            class="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card"
          ></span>
        </button>
      </div>
      <div class="avatar-container flex-shrink-0">
        <button
          id="profile-menu-button"
          @click="openProfileMenu"
          class="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
        >
          <img
            v-if="userStore.currentUser?.avatar"
            :src="userStore.currentUser.avatar"
            alt="User Avatar"
            class="user-avatar"
          />
          <div v-else class="user-avatar-placeholder">
            <IconCircleUser />
          </div>
          <IconChevronDown class="text-[14px] text-muted-foreground" />
        </button>
      </div>
    </div>

    <!-- Notification Center Popover -->
    <NotificationCenterPopover />

    <!-- Profile Popover -->
    <ProfilePopover />
  </div>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";
import SearchBar from "../SearchBar.vue";
import LanguageSelector from "../LanguageSelector.vue";
import ThemeToggle from "../ThemeToggle.vue";
import NotificationCenterPopover from "../NotificationCenterPopover.vue";
import ProfilePopover from "./ProfilePopover.vue";
import IconBell from "~icons/lucide/bell";
import IconCircleUser from "~icons/lucide/circle-user";
import IconChevronDown from "~icons/lucide/chevron-down";
import { useThemeStore } from "@/stores/themeStore";
import { useUserStore } from "@/stores/userStore";
import { onMounted, computed } from "vue";
import { useConvexQuery } from "convex-vue";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useSidebar } from "@/composables/useSidebar";

defineOptions({
  inheritAttrs: false,
});

console.log("[Header] Component setup initiated");

const themeStore = useThemeStore();
const userStore = useUserStore();
const { contentMargin } = useSidebar();

console.log("[Header] Theme store initialized");
console.log("[Header] Current theme:", themeStore.currentTheme);

// Use Convex reactive query for real-time unread count (no polling needed!)
const unreadCountResult = useConvexQuery(
  api.notifications.queries.getUnreadCount,
  computed(() => userStore.currentUser?.id ? {
    userId: userStore.currentUser.id as Id<"users">,
  } : "skip")
);

const unreadCount = computed(() => (unreadCountResult as any).data.value ?? 0);

const openNotificationCenter = () => {
  f7.popover.open("#notification-center-popover", "#notification-bell-button");
};

const openProfileMenu = () => {
  f7.popover.open("#profile-popover", "#profile-menu-button");
};

onMounted(() => {
  console.log("[Header] Component mounted");
  console.log("[Header] User avatar:", userStore.currentUser?.avatar);
  console.log("[Header] Current theme:", themeStore.currentTheme);
});
</script>
<style scoped>
.desktop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 64px;
  border-bottom: 1px solid var(--border-color);
  background-color: hsl(var(--card) / 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: hsl(var(--card-foreground));
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
}

.header-center {
  position: relative;
  flex: 1 1 auto;
  padding: 0 40px;
  margin: 0 auto;
  max-width: 600px;
  min-width: 200px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

/* Notification icon styling moved to Tailwind classes in template */

.avatar-container {
  position: relative;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.avatar-container:hover .user-avatar {
  border-color: hsl(var(--primary));
}

.user-avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.user-avatar-placeholder i {
  font-size: 28px;
}

.avatar-container:hover .user-avatar-placeholder {
  border-color: hsl(var(--primary));
}
</style>
