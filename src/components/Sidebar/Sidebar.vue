<template>
  <aside
    class="fixed top-[64px] left-0 w-52 border-r flex flex-col h-[calc(100vh-64px)] z-40 overflow-y-auto"
    :class="[themeClasses.background, themeClasses.border]"
  >
    <div class="flex-1 overflow-y-auto">
      <nav class="py-4">
        <div
          v-for="item in navigationItems"
          :key="item.id"
          class="py-2.5 px-4 cursor-pointer flex items-center gap-3 transition-colors"
          :class="[
            themeClasses.hoverBackground,
            {
              [themeClasses.activeBackground]: item.id === activeNavItem,
              'border-l-4 border-primary': item.id === activeNavItem,
              'border-l-4 border-transparent': item.id !== activeNavItem,
            },
          ]"
          @click="handleNavItemClick(item.id)"
        >
          <i
            v-if="item.icon"
            class="f7-icons text-[16px]"
            :class="themeClasses.icon"
            >{{ item.icon }}</i
          >
          <span class="text-sm font-medium" :class="themeClasses.text">{{
            item.label
          }}</span>
        </div>
      </nav>
    </div>

    <div
      class="border-t py-4 shrink-0"
      :class="[themeClasses.background, themeClasses.border]"
    >
      <div
        v-for="item in profileMenuItems"
        :key="item.id"
        class="py-2.5 px-4 cursor-pointer flex items-center gap-3 transition-colors group"
        :class="themeClasses.hoverBackground"
        @click="handleProfileItemClick(item.id)"
      >
        <i
          v-if="item.icon"
          class="f7-icons text-[16px]"
          :class="[themeClasses.icon, 'group-hover:' + themeClasses.textHover]"
          >{{ item.icon }}</i
        >
        <span class="text-sm" :class="themeClasses.text">{{ item.label }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRBAC } from "@/composables/useRBAC";
import { f7 } from "framework7-vue";
import { useUserStore } from "@/stores/userStore";

interface Props {
  activeNavItem?: string;
  theme?: "white" | "dark" | "lavanda";
}

const props = withDefaults(defineProps<Props>(), {
  activeNavItem: "home",
  theme: "white",
});

const themeClasses = computed(() => {
  switch (props.theme) {
    case "dark":
      return {
        background: "bg-gray-800",
        border: "border-gray-700",
        text: "text-gray-200",
        textHover: "text-white",
        icon: "text-foreground",
        hoverBackground: "hover:bg-gray-700",
        activeBackground: "bg-gray-700/50",
      };
    case "lavanda":
      return {
        background: "bg-purple-50",
        border: "border-purple-100",
        text: "text-purple-900",
        textHover: "text-purple-700",
        icon: "text-foreground",
        hoverBackground: "hover:bg-purple-100",
        activeBackground: "bg-purple-100/50",
      };
    default:
      return {
        background: "bg-card",
        border: "border-border",
        text: "text-foreground",
        textHover: "text-foreground",
        icon: "text-foreground",
        hoverBackground: "hover:bg-secondary",
        activeBackground: "bg-primary/10",
      };
  }
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
</script>
