<template>
  <div class="border-t border-input flex items-center justify-between px-8 py-6 flex-shrink-0 bg-white/80 backdrop-blur-xl">
    <button
      v-if="onCancel"
      class="py-3.5 px-6 text-[15px] font-semibold transition-colors rounded-2xl"
      :class="disabledCancel
        ? 'text-muted-foreground/40 cursor-not-allowed'
        : 'text-gray-500 hover:bg-gray-50'"
      :disabled="disabledCancel"
      @click="handleCancel"
    >
      {{ cancelText }}
    </button>
    <div v-else />

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
      class="py-3.5 px-8 text-[15px] font-bold transition-all rounded-xl flex items-center gap-2 shadow-lg active:scale-95"
      :class="saveButtonClasses"
      :disabled="disabled"
      @click="handleSave"
    >
      <slot name="save-icon" />
      {{ saveText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";

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
  disabledCancel: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  saveVariant: {
    type: String as PropType<"primary" | "success" | "neutral">,
    default: "success",
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

const saveButtonClasses = computed(() => {
  if (props.disabled) {
    return "bg-[#F2F2F7] text-gray-400 cursor-not-allowed shadow-none";
  }

  switch (props.saveVariant) {
    case "primary":
      return "bg-[#FFCC00] text-black hover:bg-[#F5C300] shadow-yellow-500/20";
    case "neutral":
      return "bg-[#F2F2F7] text-gray-900 hover:bg-[#E5E5EA] shadow-none";
    case "success":
    default:
      return "bg-[#2ECC71] text-white hover:bg-[#27AE60] shadow-green-500/20";
  }
});

function handleSave(event: MouseEvent) {
  if (props.disabled) return;
  if (props.onSave) props.onSave(event);
  emit("save", event);
}

function handleCancel(event: MouseEvent) {
  if (props.disabledCancel) return;
  if (props.onCancel) props.onCancel(event);
  emit("cancel", event);
}
</script>
