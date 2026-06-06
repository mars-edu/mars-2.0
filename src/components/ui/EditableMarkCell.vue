<template>
  <input
    ref="inputRef"
    type="text"
    :value="modelValue"
    class="h-7 w-[calc(100%-8px)] mx-auto rounded-md border border-border/60 bg-muted/50 text-center font-semibold outline-none transition-all duration-200 text-[13px] text-foreground hover:bg-background focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
    @input="onInput"
    @keydown.enter.prevent="$emit('navigate', 'right')"
    @keydown.esc.prevent="$emit('cancel')"
    @keydown.left.prevent="$emit('navigate', 'left')"
    @keydown.right.prevent="$emit('navigate', 'right')"
    @keydown.up.prevent="$emit('navigate', 'up')"
    @keydown.down.prevent="$emit('navigate', 'down')"
    @blur="$emit('confirm')"
  />
  <!-- :class="{ '!text-2xl': isZoomed }" -->
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
