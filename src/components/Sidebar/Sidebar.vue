<template>
  <aside class="w-52 border-r border-gray-200 bg-white flex flex-col">
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

    <div class="border-t border-gray-200 py-4 bg-white shrink-0">
      <div
        v-for="item in profileMenuItems"
        :key="item.id"
        class="py-2.5 px-4 cursor-pointer flex items-center gap-3 transition-colors hover:bg-gray-50 group"
        @click="handleProfileItemClick(item.id)"
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
import { computed } from "vue";
import { useRBAC } from "@/composables/useRBAC";
import { f7 } from "framework7-vue";
import { useUserStore } from "@/stores/userStore";

interface Props {
  activeNavItem?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeNavItem: "home",
});

const { getNavigationItems, getProfileMenuItems, getRouteForItem } = useRBAC();
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
  const route = getRouteForItem(itemId);
  f7.views.main.router.navigate(route);
};

const handleProfileItemClick = async (itemId: string): Promise<void> => {
  if (itemId === "logout") {
    await userStore.logout();
    f7.views.main.router.navigate("/login/");
    return;
  }
  const route = getRouteForItem(itemId);
  f7.views.main.router.navigate(route);
};
</script>
