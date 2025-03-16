<template>
  <div class="w-52 border-r border-gray-200 bg-white">
    <div class="py-4">
      <div
        v-for="item in navigationItems"
        :key="item.id"
        class="py-3 px-4 cursor-pointer flex items-center transition-colors"
        :class="{
          'bg-red-100 border-l-3 border-red-600': item.id === activeNavItem,
        }"
        @click="handleNavItemClick(item.id)"
      >
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  navigationItems: Array<{ id: string; label: string; icon?: string }>;
  activeNavItem: string;
}>();

const emit = defineEmits<{
  (e: "update:activeNavItem", value: string): void;
}>();

const handleNavItemClick = (itemId: string) => {
  emit("update:activeNavItem", itemId);
};
</script>
