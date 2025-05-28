<template>
  <div class="space-y-2 md:space-y-3">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from "vue";

const expandedItems = ref<string[]>([]);

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

provide("accordion", {
  expandedItems,
  toggleItem,
  isExpanded,
  addItem,
});
</script>
