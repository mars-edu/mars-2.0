<template>
  <div class="bg-card p-6 rounded-2xl shadow-sm border border-border mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-foreground">{{ title }}</h2>
      <slot name="action"></slot>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="group flex items-center justify-between bg-card border border-border hover:border-primary/50 px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
        @click="$emit('edit', item)"
        :id="item.idAttr"
      >
        <span class="font-medium text-foreground">
          {{ formatItemLabel(item) }}
        </span>
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            class="text-primary hover:text-primary/80 p-1" 
            type="button"
            @click.stop="$emit('edit', item)"
          >
            <IconPencil class="w-4 h-4" />
          </button>
          <button 
            v-if="allowDelete"
            class="text-destructive hover:text-destructive/80 p-1" 
            type="button"
            @click.stop="$emit('delete', item.id)"
          >
            <IconTrash class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconPencil from "~icons/lucide/pencil";
import IconTrash from "~icons/lucide/trash-2";

interface SettingItem {
  id: string | number;
  name?: string;
  shortName?: string;
  number?: string;
  details?: string[];
  idAttr?: string;
}

const props = defineProps<{
  title: string;
  items: SettingItem[];
  allowDelete?: boolean;
}>();

defineEmits(['edit', 'delete']);

const formatItemLabel = (item: SettingItem) => {
  const title = props.title;
  // Use loose matching for titles or specific semantic props if preferred
  if (title.includes('Внутренний') || title.includes('семестр')) {
    return `${item.number || ''} ${item.name || ''}`.trim();
  }
  if (title.includes('Общий') || title.includes('курс')) {
    const details = item.details && item.details.length > 0 ? ` (${item.details.join(', ')})` : '';
    return `${item.number || ''} ${item.name || ''}${details}`.trim();
  }
  const extra = item.number || item.shortName ? ` (${item.number || item.shortName})` : '';
  return `${item.name || ''}${extra}`.trim();
};
</script>
