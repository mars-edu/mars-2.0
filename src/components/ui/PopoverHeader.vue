<template>
  <div
    class="px-8 pt-8"
  >
    <div class="flex justify-between items-center mb-8 min-h-[32px]">
      <div>
        <h2 class="text-2xl font-bold text-foreground tracking-tight leading-none">
          <slot name="title" v-if="$slots.title"></slot>
          <template v-else>{{ title }}</template>
        </h2>
        <div v-if="$slots.subtitle || subtitle" class="text-[15px] font-medium text-muted-foreground mt-0.5">
          <slot name="subtitle" v-if="$slots.subtitle"></slot>
          <template v-else>{{ subtitle }}</template>
        </div>
      </div>
      <slot name="actions"></slot>
      <button
        v-if="onCancel"
        class="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
        @click="handleCancel"
        :title="cancelText"
      >
        <IconX class="w-5 h-5" />
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
  subtitle: {
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
