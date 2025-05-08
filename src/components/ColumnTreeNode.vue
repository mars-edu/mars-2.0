<template>
  <div :class="['column-tree', 'level-' + level]">
    <label
      :class="[
        'flex items-center gap-3 p-2.5 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors',
        { 'bg-primary/10 text-primary': isSelected },
      ]"
    >
      <input
        type="checkbox"
        :checked="isSelected"
        @change="toggleSelection"
        class="form-checkbox h-5 w-5 text-primary rounded border-primary/50 focus:ring-primary/50"
      />
      <span class="font-medium">{{ column.name }}</span>
    </label>
    <div v-if="children.length > 0" :class="'ml-' + Math.min(level + 6, 12)">
      <ColumnTreeNode
        v-for="child in children"
        :key="child.id"
        :column="child"
        :children="allChildren[child.id] || []"
        :selected-columns="selectedColumns"
        :all-children="allChildren"
        :level="level + 1"
        @update:selected="(id) => $emit('update:selected', id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";
import type { ColumnNode } from "../types/column";

const props = defineProps({
  column: {
    type: Object as PropType<ColumnNode>,
    required: true,
  },
  children: {
    type: Array as PropType<ColumnNode[]>,
    default: () => [],
  },
  selectedColumns: {
    type: Array as PropType<string[]>,
    required: true,
  },
  allChildren: {
    type: Object as PropType<Record<string, ColumnNode[]>>,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits<{
  "update:selected": [columnId: string];
}>();

const isSelected = computed(() =>
  props.selectedColumns.includes(props.column.id)
);

const toggleSelection = () => {
  emit("update:selected", props.column.id);
};
</script>

<style scoped>
.column-tree {
  position: relative;
}

.column-tree::before {
  content: "";
  position: absolute;
  left: 1.25rem;
  top: 2.5rem;
  bottom: 0.5rem;
  width: 1px;
  background-color: var(--border-color);
  opacity: 0.5;
}

.column-tree:last-child::before {
  display: none;
}

/* Add styles for different levels */
.level-0 > .ml-6 {
  margin-left: 1.5rem;
}
.level-1 > .ml-7 {
  margin-left: 1.75rem;
}
.level-2 > .ml-8 {
  margin-left: 2rem;
}
.level-3 > .ml-9 {
  margin-left: 2.25rem;
}
.level-4 > .ml-10 {
  margin-left: 2.5rem;
}
.level-5 > .ml-11 {
  margin-left: 2.75rem;
}
.level-6 > .ml-12 {
  margin-left: 3rem;
}

/* Enhanced visual hierarchy */
.column-tree .column-tree::before {
  opacity: calc(0.5 - var(--level, 0) * 0.1);
}
</style>
