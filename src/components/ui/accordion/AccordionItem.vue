<template>
  <div class="border border-border rounded-lg md:rounded-xl overflow-hidden">
    <div
      class="px-3 md:px-4 py-1.5 md:py-2 bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors"
      @click="toggle"
    >
      <div class="flex items-center">
        <f7-icon
          :ios="isExpanded ? 'f7:chevron_down' : 'f7:chevron_right'"
          :md="isExpanded ? 'material:expand_more' : 'material:chevron_right'"
          size="14px"
          class="mr-1 md:mr-2 text-foreground/60"
        ></f7-icon>
        <span class="font-medium text-sm md:text-base">
          <slot name="title"></slot>
        </span>
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
import { f7Icon } from "framework7-vue";

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
