<template>
  <div class="space-y-2 md:space-y-3">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { provide, ref, watch } from "vue";

const props = defineProps<{
  expandedItems?: string[];
}>();

const emit = defineEmits<{
  "update:expandedItems": [items: string[]];
}>();

const expandedItems = ref<string[]>(props.expandedItems || []);

// Watch for external changes to expandedItems
watch(
  () => props.expandedItems,
  (newItems) => {
    if (
      newItems &&
      JSON.stringify(newItems) !== JSON.stringify(expandedItems.value)
    ) {
      expandedItems.value = [...newItems];
    }
  }
);

// Watch for internal changes and emit them
watch(
  expandedItems,
  (newItems) => {
    emit("update:expandedItems", [...newItems]);
  },
  { deep: true }
);

const toggleItem = (id: string) => {
  const index = expandedItems.value.indexOf(id);
  if (index > -1) {
    expandedItems.value.splice(index, 1);
  } else {
    expandedItems.value.push(id);
  }
};

const isExpanded = (id: string) => expandedItems.value.includes(id);

const addItem = (id: string) => {
  if (!expandedItems.value.includes(id)) {
    expandedItems.value.push(id);
  }
};

const expandAll = (ids: string[]) => {
  expandedItems.value = [...ids];
};

const collapseAll = () => {
  expandedItems.value = [];
};

provide("accordion", {
  expandedItems,
  toggleItem,
  isExpanded,
  addItem,
  expandAll,
  collapseAll,
});
</script>
