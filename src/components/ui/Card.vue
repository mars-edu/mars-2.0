<template>
  <div
    class="rounded-xl shadow-sm overflow-hidden bg-card text-card-foreground border border-border"
    :class="{
      'cursor-pointer hover:shadow-md transition-shadow': clickable,
    }"
    @click="handleClick"
  >
    <div
      v-if="$slots.header || title"
      class="flex items-center justify-between p-4 border-b border-border"
    >
      <slot name="header">
        <h2 class="text-lg font-semibold text-foreground">{{ title }}</h2>
      </slot>
    </div>
    <div class="p-4">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="p-4 border-t border-border">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Theme } from "@/types/theme";

interface Props {
  /** @deprecated Theme is now handled by CSS custom properties. This prop is ignored. */
  theme?: Theme;
  title?: string;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  theme: "light",
  clickable: false,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit("click", event);
  }
};
</script>
