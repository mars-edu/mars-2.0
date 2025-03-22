<template>
  <aside class="w-52 border-r border-gray-200 bg-white flex flex-col">
    <!-- Navigation Items Section - Scrollable -->
    <div class="flex-1 overflow-y-auto">
      <nav class="py-4">
        <div
          v-for="item in navigationItems"
          :key="item.id"
          class="py-2.5 px-4 cursor-pointer flex items-center gap-3 transition-colors hover:bg-gray-50"
          :class="{
            'bg-red-50 border-l-4 border-red-600': item.id === activeNavItem,
            'border-l-4 border-transparent': item.id !== activeNavItem,
          }"
          @click="handleNavItemClick(item.id)"
        >
          <i v-if="item.icon" class="f7-icons text-gray-500 text-[16px]">{{
            item.icon
          }}</i>
          <span class="text-sm font-medium">{{ item.label }}</span>
        </div>
      </nav>
    </div>

    <!-- Profile Menu Section - Fixed at bottom -->
    <div class="border-t border-gray-200 py-4 bg-white shrink-0">
      <div
        v-for="item in profileMenuItems"
        :key="item.id"
        class="py-2.5 px-4 cursor-pointer flex items-center gap-3 transition-colors hover:bg-gray-50 group"
      >
        <i
          v-if="item.icon"
          class="f7-icons text-gray-500 group-hover:text-gray-700 text-[16px]"
          >{{ item.icon }}</i
        >
        <span class="text-sm">{{ item.label }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
}

interface ProfileMenuItem {
  id: string;
  label: string;
  icon?: string;
  link?: string;
}

interface Props {
  navigationItems?: NavigationItem[];
  activeNavItem?: string;
  profileMenuItems?: ProfileMenuItem[];
}

const props = withDefaults(defineProps<Props>(), {
  navigationItems: () => [],
  activeNavItem: "home",
  profileMenuItems: () => [],
});

// Default navigation items if none provided
const defaultSidebarNavItems: NavigationItem[] = [
  { id: "home", label: "Главная", icon: "house" },
  { id: "schedule", label: "Расписание", icon: "clock" },
  { id: "journals", label: "Журналы", icon: "doc_text_fill" },
];

// Default profile menu items if none provided
const defaultSidebarProfileItems: ProfileMenuItem[] = [
  { id: "settings", label: "Настройки", icon: "gear" },
  { id: "profile", label: "Профиль", icon: "person" },
  { id: "logout", label: "Выйти", icon: "arrow_right_square" },
];

// Use provided items or defaults
const navigationItems = computed(() =>
  props.navigationItems && props.navigationItems.length > 0
    ? props.navigationItems
    : defaultSidebarNavItems
);

const profileMenuItems = computed(() =>
  props.profileMenuItems && props.profileMenuItems.length > 0
    ? props.profileMenuItems
    : defaultSidebarProfileItems
);

const emit = defineEmits<{
  (e: "update:activeNavItem", value: string): void;
}>();

// Create a computed property for activeNavItem to support v-model
const activeNavItem = computed({
  get: () => props.activeNavItem,
  set: (value) => emit("update:activeNavItem", value),
});

const handleNavItemClick = (itemId: string): void => {
  activeNavItem.value = itemId;
};
</script>
