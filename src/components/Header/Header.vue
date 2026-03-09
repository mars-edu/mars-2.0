<template>
  <div v-bind="$attrs" class="desktop-header desktop-only">
    <Logo class="header-left" />
    <div class="header-center">
      <SearchBar />
    </div>
    <div class="header-right">
      <div class="flex-shrink-0">
        <button
          id="notification-bell-button"
          @click="openNotificationCenter"
          class="relative p-2 rounded-full transition-colors hover:bg-primary/10 text-primary"
        >
          <i class="icon f7-icons text-[22px]">bell</i>
          <span
            v-if="unreadCount > 0"
            class="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </button>
      </div>
      <div class="flex-shrink-0 min-w-[100px]">
        <LanguageSelector />
      </div>
      <div class="h-6 w-px bg-border flex-shrink-0"></div>
      <div class="flex-shrink-0">
        <ThemeToggle />
      </div>
      <div class="avatar-container flex-shrink-0">
        <button class="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border">
          <img
            v-if="userStore.currentUser?.avatar"
            :src="userStore.currentUser.avatar"
            alt="User Avatar"
            class="user-avatar"
          />
          <div v-else class="user-avatar-placeholder">
            <i class="icon f7-icons">person_circle_fill</i>
          </div>
          <i class="icon f7-icons text-[14px] text-muted-foreground">chevron_down</i>
        </button>
      </div>
    </div>

    <!-- Notification Center Popover -->
    <NotificationCenterPopover />
  </div>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";
import SearchBar from "../SearchBar.vue";
import LanguageSelector from "../LanguageSelector.vue";
import Logo from "../Logo/Logo.vue";
import ThemeToggle from "../ThemeToggle.vue";
import NotificationCenterPopover from "../NotificationCenterPopover.vue";
import { useThemeStore } from "@/stores/themeStore";
import { useUserStore } from "@/stores/userStore";
import { onMounted, computed } from "vue";
import { useConvexQuery } from "convex-vue";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

defineOptions({
  inheritAttrs: false,
});

console.log("[Header] Component setup initiated");

const themeStore = useThemeStore();
const userStore = useUserStore();

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
  width: 100%;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
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
