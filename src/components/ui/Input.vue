<template>
  <div class="space-y-2">
    <label v-if="label" :for="inputId" class="text-sm text-foreground">
      {{ label }}
    </label>
    <div class="flex gap-2 w-full">
      <f7-input
        :id="inputId"
        class="w-full"
        :class="{ 'has-data': hasData }"
        :type="type"
        :placeholder="placeholder"
        :clear-button="clearButton"
        :disabled="disabled"
        :value="modelValue"
        @input="onInput"
        v-bind="$attrs"
      >
        <template v-if="showCheckmark" #media>
          <f7-icon f7="checkmark_alt" class="text-green-500"></f7-icon>
        </template>
      </f7-input>
      <f7-button
        v-if="showCopyButton"
        small
        class="copy-button flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 hover:bg-green-600"
        @click="$emit('copy')"
        :tooltip="copyTooltip"
      >
        <f7-icon f7="square_on_square" class="text-lg"></f7-icon>
      </f7-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from "vue";
import { f7Input, f7Icon, f7Button } from "framework7-vue";

defineOptions({
  inheritAttrs: false,
});

interface Props {
  modelValue: string | number;
  label?: string;
  type?: string;
  placeholder?: string;
  clearButton?: boolean;
  disabled?: boolean;
  showCheckmark?: boolean;
  showCopyButton?: boolean;
  copyTooltip?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  clearButton: true,
  disabled: false,
  showCheckmark: true,
  showCopyButton: false,
  copyTooltip: "Вставить из предыдущего",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  copy: [];
}>();

const instance = getCurrentInstance();
const inputId = computed(() => props.id || `input-${instance?.uid}`);

const hasData = computed(() => {
  return (
    props.modelValue !== null &&
    props.modelValue !== undefined &&
    props.modelValue !== ""
  );
});

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = props.type === "number" ? target.value : target.value;
  emit("update:modelValue", value);
};
</script>

<style scoped>
.copy-button {
  background-color: rgb(34 197 94) !important;
  color: white !important;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
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
</style>
