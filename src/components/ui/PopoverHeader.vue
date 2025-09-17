<template>
  <div
    class="flex items-center px-4 py-3 border-b border-input relative min-h-[56px]"
  >
    <Button v-if="onCancel" variant="primary" size="md" @click="onCancel">
      {{ cancelText }}
    </Button>
    <span
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-foreground font-semibold whitespace-nowrap"
    >
      <slot name="title" v-if="$slots.title"></slot>
      <template v-else>{{ title }}</template>
    </span>
    <slot
      v-if="$slots.save"
      name="save"
      :disabled="disabled"
      :isLoading="isLoading"
      :onSave="onSave"
      :saveText="saveText"
    ></slot>
    <Button
      v-else-if="onSave"
      variant="success"
      size="md"
      class="ml-auto"
      :disabled="disabled"
      :isLoading="isLoading"
      @click="onSave"
    >
      {{ saveText }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import Button from "./Button.vue";

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
