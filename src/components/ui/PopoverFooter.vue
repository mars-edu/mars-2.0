<template>
  <div class="border-t border-input flex items-stretch flex-shrink-0">
    <button
      v-if="onCancel"
      class="flex-1 py-4 text-sm font-medium text-secondary-foreground hover:bg-muted/60 transition-colors border-r border-input"
      @click="handleCancel"
    >
      {{ cancelText }}
    </button>
    <slot
      v-if="$slots.save"
      name="save"
      :disabled="disabled"
      :isLoading="isLoading"
      :onSave="handleSave"
      :saveText="saveText"
    />
    <button
      v-else-if="onSave"
      class="flex-1 py-4 text-sm font-semibold transition-colors"
      :class="disabled
        ? 'text-muted-foreground/40 cursor-not-allowed'
        : 'bg-green-500 text-white hover:bg-green-600'"
      :disabled="disabled"
      @click="handleSave"
    >
      {{ saveText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
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

const emit = defineEmits<{
  (e: "save", event: MouseEvent): void;
  (e: "cancel", event: MouseEvent): void;
}>();

function handleSave(event: MouseEvent) {
  if (props.disabled) return;
  if (props.onSave) props.onSave(event);
  emit("save", event);
}

function handleCancel(event: MouseEvent) {
  if (props.onCancel) props.onCancel(event);
  emit("cancel", event);
}
</script>
