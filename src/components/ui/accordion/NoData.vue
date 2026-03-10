<template>
  <div class="flex flex-col items-center justify-center py-8 text-center">
    <div
      class="w-16 h-16 mb-4 flex items-center justify-center bg-muted/50 rounded-full"
    >
      <component :is="icon" class="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 class="text-sm font-medium text-foreground mb-1">{{ title }}</h3>
    <p class="text-xs text-muted-foreground max-w-sm">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import IconFileText from "~icons/lucide/file-text";

interface Props {
  title?: string;
  description?: string;
  icon?: Component;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Нет данных",
  description: "Данные отсутствуют для выбранного учебного года",
  icon: () => IconFileText,
});
</script>
