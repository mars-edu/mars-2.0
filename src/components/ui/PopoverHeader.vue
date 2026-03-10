<template>
  <div
    class="border-b border-input"
    :class="$slots.default ? 'px-4 pt-3 pb-3' : 'flex items-center px-4 py-3 min-h-[56px]'"
  >
    <div class="flex items-center w-full min-h-[32px]">
      <span
        class="text-foreground font-semibold text-lg leading-none flex-1"
        :class="{ 'pointer-events-none': !$slots.title }"
      >
        <slot name="title" v-if="$slots.title"></slot>
        <template v-else>{{ title }}</template>
      </span>
      <slot name="actions"></slot>
      <button
        v-if="onCancel"
        class="ml-auto w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors"
        @click="handleCancel"
      >
        <IconX class="w-4 h-4" />
      </button>
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import IconX from "~icons/lucide/x";

const props = defineProps({
  title: {
    type: String,
    required: false,
    default: "",
  },
  cancelText: {
    type: String,
    default: "Отменить",
  },
  onCancel: {
    type: Function as PropType<(event: MouseEvent) => void>,
  },
});

const emit = defineEmits<{
  (e: "cancel", event: MouseEvent): void;
}>();

function handleCancel(event: MouseEvent) {
  if (props.onCancel) props.onCancel(event);
  emit("cancel", event);
}
</script>
