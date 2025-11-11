<template>
  <div
    class="flex items-center px-4 py-3 border-b border-input relative min-h-[56px]"
  >
    <Button v-if="onCancel" variant="primary" size="md" @click="handleCancel">
      {{ cancelText }}
    </Button>
    <span
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground font-semibold text-center px-2 max-w-full break-words"
      :class="{ 'pointer-events-none': !$slots.title }"
    >
      <slot name="title" v-if="$slots.title"></slot>
      <template v-else>{{ title }}</template>
    </span>
    <slot
      v-if="$slots.save"
      name="save"
      :disabled="disabled"
      :isLoading="isLoading"
      :onSave="handleSave"
      :saveText="saveText"
    ></slot>
    <Button
      v-else-if="onSave"
      variant="success"
      size="md"
      class="ml-auto"
      :disabled="disabled"
      :isLoading="isLoading"
      @click="handleSave"
    >
      {{ saveText }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import Button from "./Button.vue";

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
