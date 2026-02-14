<template>
  <div class="flex items-center space-x-1 bg-muted rounded-lg p-1">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="px-6 py-2 rounded-md text-sm font-medium transition-colors"
      :class="{
        'bg-card shadow-sm text-foreground': modelValue === tab.value,
        'text-muted-foreground hover:bg-muted/80': modelValue !== tab.value,
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
