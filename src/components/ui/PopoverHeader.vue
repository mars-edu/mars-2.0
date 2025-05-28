<template>
  <div
    class="flex justify-between items-center px-4 py-3 border-b border-input"
  >
    <button
      class="!text-primary hover:!bg-primary/30 hover:!text-primary/90 disabled:text-muted-foreground border-primary border-solid border-2 w-fit px-5 rounded-md transition-colors"
      @click="onCancel"
    >
      {{ cancelText }}
    </button>
    <span class="text-foreground font-semibold">{{ title }}</span>
    <button
      class="!text-green-500 hover:!bg-green-500/30 hover:!text-green-600 disabled:text-muted-foreground border-green-500 border-solid border-2 w-fit px-5 rounded-md transition-colors"
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
    required: true,
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
    required: true,
  },
  onSave: {
    type: Function as PropType<(event: MouseEvent) => void>,
    required: true,
  },
});
</script>
