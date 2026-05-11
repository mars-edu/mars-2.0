<template>
  <f7-popover id="profile-popover" class="profile-popover">
    <div class="bg-card text-card-foreground w-64 rounded-xl overflow-hidden shadow-xl border border-border">
      <!-- User Info Header -->
      <div class="p-4 border-b border-border bg-muted/30">
        <div class="flex items-center gap-3">
          <img
            v-if="userStore.currentUser?.avatar"
            :src="userStore.currentUser.avatar"
            alt="Avatar"
            class="w-10 h-10 rounded-full object-cover border border-border"
          />
          <div v-else class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <IconCircleUser class="w-6 h-6" />
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-bold truncate">{{ userStore.currentUser?.name || 'Пользователь' }}</span>
            <span class="text-xs text-muted-foreground truncate">{{ userStore.currentUser?.email || '' }}</span>
          </div>
        </div>
      </div>

      <!-- Menu Items -->
      <div class="p-1">
        <button
          @click="navigateTo('/profile/')"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors rounded-lg group"
        >
          <IconUser class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          {{ nav_profile() }}
        </button>
        
        <button
          @click="logout"
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded-lg group"
        >
          <IconLogOut class="w-4 h-4 text-red-500 group-hover:text-red-600 transition-colors" />
          {{ nav_logout() }}
        </button>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { f7, f7Popover } from "framework7-vue";
import { useUserStore } from "@/stores/userStore";
import AuthService from "@/services/auth";
import IconCircleUser from "~icons/lucide/circle-user";
import IconUser from "~icons/lucide/user";
import IconLogOut from "~icons/lucide/log-out";
import { nav_profile, nav_logout } from "@/paraglide/messages";

const userStore = useUserStore();

const navigateTo = (path: string) => {
  f7.popover.close("#profile-popover");
  f7.views.main.router.navigate(path);
};

const logout = async () => {
  f7.popover.close("#profile-popover");
  await AuthService.logout();
  f7.views.main.router.navigate("/login/");
};
</script>

<style scoped>
.profile-popover {
  width: 256px !important;
}
</style>
