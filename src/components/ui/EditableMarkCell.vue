<template>
  <input
    ref="inputRef"
    type="text"
    :value="modelValue"
    class="h-8 w-full rounded-md border-2 border-primary bg-background text-center font-semibold shadow-lg outline-none transition-all duration-300 text-sm"
    :class="{ '!text-2xl': isZoomed }"
    @input="onInput"
    @keydown.enter.prevent="$emit('navigate', 'right')"
    @keydown.esc.prevent="$emit('cancel')"
    @keydown.left.prevent="$emit('navigate', 'left')"
    @keydown.right.prevent="$emit('navigate', 'right')"
    @keydown.up.prevent="$emit('navigate', 'up')"
    @keydown.down.prevent="$emit('navigate', 'down')"
    @blur="$emit('confirm')"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{
  modelValue: string | number;
  isZoomed?: boolean;
}>();

const emit = defineEmits([
  "update:modelValue",
  "confirm",
  "cancel",
  "navigate",
]);

const inputRef = ref<HTMLInputElement | null>(null);

const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  if (value === "" || value === "+") {
    emit("update:modelValue", value);
    return;
  }

  if (!/^\d+$/.test(value)) {
    input.value = props.modelValue.toString();
    return;
  }

  const num = parseInt(value, 10);
  if (num > 100) {
    input.value = props.modelValue.toString();
    return;
  }

  emit("update:modelValue", value);
};

onMounted(() => {
  inputRef.value?.focus();
  inputRef.value?.select();
});
</script> 