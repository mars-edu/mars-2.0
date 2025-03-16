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
        <span class="text-sm">{{ item.title }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
}

interface ProfileMenuItem {
  id: string;
  title: string;
  icon?: string;
  link?: string;
}

interface Props {
  navigationItems: NavigationItem[];
  activeNavItem: string;
  profileMenuItems: ProfileMenuItem[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:activeNavItem", value: string): void;
}>();

const handleNavItemClick = (itemId: string): void => {
  emit("update:activeNavItem", itemId);
};
</script>
