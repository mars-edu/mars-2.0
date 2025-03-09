<template>
  <div
    class="flex overflow-hidden rounded-lg bg-gray-100 border border-gray-200"
  >
    <button
      v-for="lang in languages"
      :key="lang.code"
      class="px-3 py-1.5 text-sm font-medium transition-colors"
      :class="{
        'bg-red-500 text-white': lang.code === activeLanguage,
        'hover:bg-gray-200': lang.code !== activeLanguage,
      }"
      @click="$emit('change', lang.code)"
    >
      {{ lang.code }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { Language } from "@/composables/useLanguage";

defineProps<{
  languages: Language[];
  activeLanguage: string;
}>();

defineEmits<{
  (e: "change", code: string): void;
}>();
</script>
