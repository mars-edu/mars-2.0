<template>
  <div class="flex items-center px-4 py-3 border-b border-input relative min-h-[56px]">
    <button
      v-if="onCancel"
      class="!text-primary hover:!bg-primary/30 hover:!text-primary/90 disabled:text-muted-foreground border-primary border-solid border-2 w-fit px-5 rounded-md transition-colors"
      @click="onCancel"
    >
      {{ cancelText }}
    </button>
    <span
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground font-semibold whitespace-nowrap"
    >
      <slot name="title" v-if="$slots.title"></slot>
      <template v-else>{{ title }}</template>
    </span>
    <button
      v-if="onSave"
      class="!text-green-500 hover:!bg-green-500/30 hover:!text-green-600 disabled:text-muted-foreground border-green-500 border-solid border-2 w-fit px-5 rounded-md transition-colors ml-auto"
      :disabled="disabled || isLoading"
      @click="onSave"
    >
      {{ saveText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
  title: {
    type: String,
    required: false,
    default: "",
  },
  cancelText: {
    type: String,
    default: "Отменить",
  },
  saveText: {
    type: String,
    default: "Сохранить",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  onCancel: {
    type: Function as PropType<(event: MouseEvent) => void>,
  },
  onSave: {
    type: Function as PropType<(event: MouseEvent) => void>,
  },
});
</script>
