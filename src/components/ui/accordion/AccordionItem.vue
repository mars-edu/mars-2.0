<template>
  <div class="border border-border rounded-lg md:rounded-xl overflow-hidden">
    <div
      class="px-3 md:px-4 py-1.5 md:py-2 bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
      @click="toggle"
    >
      <div class="flex items-center">
        <component
          :is="isExpanded ? IconChevronDown : IconChevronRight"
          class="w-3.5 h-3.5 mr-1 md:mr-2 text-foreground/60"
        />
        <div class="font-medium text-sm md:text-base flex items-center">
          <slot name="title"></slot>
        </div>
        <slot v-if="!isExpanded" name="selected-item"></slot>
      </div>
      <div class="flex items-center gap-1 md:gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="p-3 md:p-5 bg-card" v-if="isExpanded">
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
