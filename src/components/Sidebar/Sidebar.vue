<template>
  <aside
    class="fixed top-[55px] left-0 bottom-0 w-28 bg-card border-r border-border overflow-hidden z-50 shadow-sm"
    style="display: grid; grid-template-rows: 1fr auto"
  >
    <div class="overflow-y-auto w-full">
      <nav class="flex flex-col items-center pt-8 pb-4 w-full">
        <template v-for="(item, index) in navigationItems" :key="item.id">
          <!-- Section separator before first item of a new group -->
          <div
            v-if="getSectionLabel(item.id, index)"
            class="w-full px-3 py-2"
          >
            <div class="border-t border-border"></div>
          </div>
          <div
            :title="item.label"
            class="group relative flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-200 px-2 py-2 flex-shrink-0 w-full"
            :class="[
              item.id === activeNavItem
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            ]"
            @click="handleNavItemClick(item.id)"
          >
            <i class="f7-icons text-[22px]">{{ item.icon }}</i>
            <span
              class="text-[10px] mt-1 text-center leading-tight max-w-[90px] break-words hyphens-auto"
              style="hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto"
              >{{ item.label }}</span
            >
            <div
              v-if="item.id === activeNavItem"
              class="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
            ></div>
          </div>
        </template>
      </nav>
    </div>

    <div class="border-t border-border bg-card p-3">
      <div class="space-y-1">
        <div
          v-for="item in profileMenuItems"
          :key="item.id"
          :title="item.label"
          class="group relative flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-200 px-2 py-2 flex-shrink-0"
          :class="[
            'text-muted-foreground hover:text-foreground hover:bg-muted',
          ]"
          @click="handleProfileItemClick(item.id)"
        >
          <i class="f7-icons text-[22px]">{{ item.icon }}</i>
          <span
            class="text-[10px] mt-1 text-center leading-tight max-w-[90px] break-words hyphens-auto"
            style="hyphens: auto; -webkit-hyphens: auto; -ms-hyphens: auto"
            >{{ item.label }}</span
          >
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
import AuthService from "@/services/auth";
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

const SECTION_GROUPS: Record<string, string> = {
  "specialty-catalog": "АКАДЕМИЧЕСКИЙ",
  "discipline-catalog": "АКАДЕМИЧЕСКИЙ",
  "schedule": "АКАДЕМИЧЕСКИЙ",
  "protocol": "АКАДЕМИЧЕСКИЙ",
  "journals": "АКАДЕМИЧЕСКИЙ",
  "rup": "АКАДЕМИЧЕСКИЙ",
  "analytics": "АНАЛИТИКА",
  "reports": "АНАЛИТИКА",
  "education-schedule": "АНАЛИТИКА",
  "student-card": "КАРТОТЕКА",
  "teacher-card": "КАРТОТЕКА",
};

const getSectionLabel = (itemId: string, index: number): string | null => {
  const items = navigationItems.value;
  const currentGroup = SECTION_GROUPS[itemId] ?? null;
  if (!currentGroup) return null;
  // Show label only if previous visible item belongs to a different group
  if (index === 0) return currentGroup;
  const prevId = items[index - 1]?.id;
  const prevGroup = SECTION_GROUPS[prevId] ?? null;
  return prevGroup !== currentGroup ? currentGroup : null;
};

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
    await AuthService.logout();
    f7.views.main.router.navigate("/login");
    return;
  }
  const item = profileMenuItems.value.find((item) => item.id === itemId);
  if (item && item.route) {
    f7.views.main.router.navigate(item.route);
  }
};

const userInitial = computed(() => {
  const user = userStore.currentUser;
  if (user?.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }
  return "S";
});

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
