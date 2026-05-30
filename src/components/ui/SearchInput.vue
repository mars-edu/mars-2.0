<template>
  <div class="relative" :class="wrapperClass">
    <IconSearch
      class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-[18px] h-[18px] pointer-events-none"
    />
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="search-input w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground transition-all"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
import IconSearch from "~icons/lucide/search";

withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    wrapperClass?: string;
  }>(),
  {
    placeholder: "Поиск...",
    wrapperClass: "",
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>

<style scoped>
.search-input {
  background-color: rgb(243, 244, 246) !important;
  border: 1px solid rgb(229, 231, 235) !important;
  color: hsl(var(--foreground)) !important;
  outline: none !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  padding: 0.5rem 1rem 0.5rem 2.5rem !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
  border-radius: 0.5rem !important;
  width: 100% !important;
}
.search-input::placeholder {
  color: rgb(156, 163, 175) !important;
}
.search-input:focus {
  background-color: rgb(255, 255, 255) !important;
  border-color: rgb(209, 213, 219) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important;
}
</style>
