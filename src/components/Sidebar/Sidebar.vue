<template>
  <aside
    class="fixed top-[64px] left-0 w-52 bg-card border-r border-border flex flex-col h-[calc(100vh-64px)] z-40 overflow-y-auto shadow-sm justify-between"
  >
    <div class="flex-1 overflow-y-auto w-full">
      <nav class="p-3">
        <div class="space-y-1 mt-2">
          <div
            v-for="item in navigationItems"
            :key="item.id"
            class="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200"
            :class="[
              item.id === activeNavItem
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            ]"
            @click="handleNavItemClick(item.id)"
          >
            <i v-if="item.icon" class="f7-icons text-[16px] flex-shrink-0">{{
              item.icon
            }}</i>
            <span>{{ item.label }}</span>
            <div
              v-if="item.id === activeNavItem"
              class="absolute left-0 top-0 h-full w-1.5 bg-amber-400 rounded-l-full"
            ></div>
          </div>
        </div>
      </nav>
    </div>

    <div class="border-t border-border bg-card p-3 shrink-0">
      <div class="space-y-1">
        <div
          v-for="item in profileMenuItems"
          :key="item.id"
          class="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
          @click="handleProfileItemClick(item.id)"
        >
          <i v-if="item.icon" class="f7-icons text-[16px] flex-shrink-0">{{
            item.icon
          }}</i>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useRBAC } from "@/composables/useRBAC";
import { f7 } from "framework7-vue";
import { useUserStore } from "@/stores/userStore";
import type { NavigationItem } from "@/composables/useRBAC";

interface Props {
  activeNavItem?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeNavItem: "home",
});

const { getNavigationItems, getProfileMenuItems } = useRBAC();
const userStore = useUserStore();

const navigationItems = computed(() => getNavigationItems.value);
const profileMenuItems = computed(() => getProfileMenuItems.value);

const emit = defineEmits<{
  (e: "update:activeNavItem", value: string): void;
}>();

const activeNavItem = computed({
  get: () => props.activeNavItem,
  set: (value) => emit("update:activeNavItem", value),
});

const handleNavItemClick = (itemId: string): void => {
  activeNavItem.value = itemId;
  const item = navigationItems.value.find((item) => item.id === itemId);
  if (item && item.route) {
    f7.views.main.router.navigate(item.route);
  }
};

const handleProfileItemClick = async (itemId: string): Promise<void> => {
  if (itemId === "logout") {
    userStore.logout();
    f7.views.main.router.navigate("/login");
    return;
  }
  const item = profileMenuItems.value.find((item) => item.id === itemId);
  if (item && item.route) {
    f7.views.main.router.navigate(item.route);
  }
};

const updateActiveItem = () => {
  const currentPath = f7.views.main.router.currentRoute.path;
  const matchingItem = navigationItems.value.reduce((best, item) => {
    if (
      item.route &&
      currentPath.startsWith(item.route) &&
      item.route.length > (best?.route?.length || 0)
    ) {
      return item;
    }
    return best;
  }, null as NavigationItem | null);
  if (matchingItem) {
    activeNavItem.value = matchingItem.id;
  }
};

onMounted(() => {
  updateActiveItem();
  f7.views.main.router.on("routeChanged", updateActiveItem);
});

onUnmounted(() => {
  f7.views.main.router.off("routeChanged", updateActiveItem);
});
</script>
