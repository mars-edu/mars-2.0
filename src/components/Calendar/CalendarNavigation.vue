<template>
  <div class="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="px-6 py-2 rounded-md text-sm font-medium transition-colors"
      :class="{
        'bg-white shadow-sm text-gray-900': modelValue === tab.value,
        'text-gray-500 hover:bg-gray-200': modelValue !== tab.value,
      }"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  tabs: { value: string; label: string }[];
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>
