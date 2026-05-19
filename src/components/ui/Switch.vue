<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    @click="emit('update:modelValue', !modelValue)"
    :class="[
      'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
      modelValue ? 'bg-green-500' : 'bg-muted-foreground/30',
    ]"
  >
    <div
      :class="[
        'absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
        modelValue ? 'translate-x-5' : '',
      ]"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>
