<template>
  <div ref="triggerRef" class="dropdown-menu-root">
    <slot name="trigger" :toggle="toggle" :isOpen="isOpen" />
    <Teleport to="body">
      <template v-if="isOpen">
        <div class="dropdown-backdrop" @click="close" />
        <div class="dropdown-panel" :style="dropdownStyle">
          <slot :close="close" />
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAnchoredDropdown } from "@/composables/useAnchoredDropdown";
import type { DropdownAlign } from "@/composables/useAnchoredDropdown";

const props = withDefaults(defineProps<{
  align?: DropdownAlign;
  width?: string;
  zIndex?: number;
}>(), {
  align: "left",
  width: "16rem",
  zIndex: 9999,
});

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const { dropdownStyle } = useAnchoredDropdown(triggerRef, isOpen, {
  align: props.align,
  zIndex: props.zIndex,
});
const backdropZIndex = computed(() => props.zIndex - 1);

const open = () => { isOpen.value = true; };
const close = () => { isOpen.value = false; };
const toggle = () => { isOpen.value ? close() : open(); };

defineExpose({ open, close, toggle, isOpen });
</script>

<style scoped>
.dropdown-menu-root {
  position: relative;
  display: inline-flex;
}

.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: v-bind(backdropZIndex);
}

.dropdown-panel {
  position: fixed;
  width: v-bind(width);
  @apply bg-card border border-border rounded-2xl shadow-2xl py-2 overflow-hidden;
}
</style>
