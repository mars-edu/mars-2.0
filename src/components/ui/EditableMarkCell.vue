<template>
  <input
    ref="inputRef"
    type="text"
    :value="modelValue"
    class="h-8 w-full rounded-md border-2 border-primary bg-background text-center font-semibold shadow-lg outline-none transition-all duration-300 text-sm"
    :class="{ '!text-2xl': isZoomed }"
    @input="
      $emit('update:modelValue', ($event.target as HTMLInputElement).value)
    "
    @keydown.enter.prevent="$emit('navigate', 'down')"
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

defineProps<{
  modelValue: string | number;
  isZoomed?: boolean;
}>();

defineEmits(["update:modelValue", "confirm", "cancel", "navigate"]);

const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  inputRef.value?.focus();
  inputRef.value?.select();
});
</script> 