<template>
  <div class="space-y-2">
    <label v-if="label" :for="inputId" class="text-sm text-foreground">
      {{ label }}
    </label>
    <div class="flex gap-2 w-full">
      <div class="input-with-actions w-full">
        <f7-input
          :id="inputId"
          class="w-full"
          :class="{
            'has-data': hasData,
            'with-distribute-button': showDistributeButton || !!$slots.button,
          }"
          :type="computedType"
          :placeholder="placeholder"
          :clear-button="effectiveClearButton"
          :disabled="disabled"
          :value="inputValue"
          @input="onInput"
          v-bind="{ ...$attrs, ...numericAttrs }"
        >
          <template v-if="showCheckmark" #media>
            <IconCheck class="text-green-500" />
          </template>
        </f7-input>
        <div v-if="$slots.button" class="slot-button-container">
          <slot name="button" />
        </div>
        <button
          v-else-if="showDistributeButton"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95 z-[3]"
          @click="$emit('distribute')"
          :title="distributeTooltip"
        >
          <IconArrowDown class="text-base" />
        </button>
      </div>
      <f7-button
        v-if="showCopyButton"
        small
        class="copy-button flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 hover:bg-green-600"
        @click="$emit('copy')"
        :tooltip="copyTooltip"
      >
        <IconCopy class="text-lg" />
      </f7-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, useSlots } from "vue";
import { f7Input, f7Button } from "framework7-vue";
import IconCheck from "~icons/lucide/check";
import IconArrowDown from "~icons/lucide/arrow-down";
import IconCopy from "~icons/lucide/copy";

defineOptions({
  inheritAttrs: false,
});

interface Props {
  modelValue?: string | number;
  label?: string;
  type?: string;
  placeholder?: string;
  clearButton?: boolean;
  disabled?: boolean;
  showCheckmark?: boolean;
  showCopyButton?: boolean;
  copyTooltip?: string;
  showDistributeButton?: boolean;
  distributeTooltip?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  clearButton: true,
  disabled: false,
  showCheckmark: true,
  showCopyButton: false,
  copyTooltip: "Вставить из предыдущего",
  showDistributeButton: false,
  distributeTooltip: "Распределить по семестрам",
});

const computedType = computed(() =>
  props.type === "number" ? "text" : props.type
);

const numericAttrs = computed(() =>
  props.type === "number"
    ? { inputmode: "numeric", pattern: "[0-9]*" }
    : {}
);

const slots = useSlots();

const effectiveClearButton = computed(
  () => props.clearButton && !props.showDistributeButton && !slots.button
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number | undefined];
  copy: [];
  distribute: [];
}>();

const instance = getCurrentInstance();
const inputId = computed(() => props.id || `input-${instance?.uid}`);
const inputValue = computed<string | number>(() => props.modelValue ?? "");

const hasData = computed(() => {
  return (
    props.modelValue !== null &&
    props.modelValue !== undefined &&
    props.modelValue !== ""
  );
});

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>

<style scoped>
.copy-button {
  background-color: rgb(34 197 94) !important;
  color: white !important;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.input-with-actions {
  position: relative;
}

.slot-button-container {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 3;
}

.copy-button:active {
  transform: scale(0.97);
}

.copy-button:hover {
  background-color: rgb(22 163 74) !important;
}

:deep(.has-data) {
  background-color: hsl(var(--input)) !important;
}

:deep(.input:hover) {
  background-color: hsl(var(--input)) !important;
}

:deep(.with-distribute-button input) {
  padding-right: 3rem !important;
}
</style>
