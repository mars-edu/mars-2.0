<template>
  <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
    <div
      class="px-4 md:px-6 py-3 md:py-4 bg-muted/30 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
      @click="toggle"
    >
      <div class="flex items-center">
        <component
          :is="isExpanded ? IconChevronDown : IconChevronRight"
          class="w-5 h-5 mr-2 md:mr-3 text-foreground/70"
        />
        <div class="font-bold text-sm flex items-center">
          <slot name="title"></slot>
        </div>
        <slot v-if="!isExpanded" name="selected-item"></slot>
      </div>
      <div class="flex items-center gap-1 md:gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="p-4 md:p-6 bg-card" v-if="isExpanded">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted } from "vue";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconChevronRight from "~icons/lucide/chevron-right";

const props = defineProps<{
  id: string;
  defaultExpanded?: boolean;
}>();

const accordion = inject("accordion") as {
  expandedItems: string[];
  toggleItem: (id: string) => void;
  isExpanded: (id: string) => boolean;
  addItem: (id: string) => void;
};

const isExpanded = computed(() => accordion.isExpanded(props.id));

const toggle = () => {
  accordion.toggleItem(props.id);
};

onMounted(() => {
  if (props.defaultExpanded) {
    accordion.addItem(props.id);
  }
});
</script>
