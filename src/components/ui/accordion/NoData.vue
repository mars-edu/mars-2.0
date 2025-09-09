<template>
  <div class="flex flex-col items-center justify-center py-8 text-center">
    <div
      class="w-16 h-16 mb-4 flex items-center justify-center bg-muted/50 rounded-full"
    >
      <f7-icon
        :ios="icon.ios"
        :md="icon.md"
        size="24px"
        class="text-muted-foreground"
      />
    </div>
    <h3 class="text-sm font-medium text-foreground mb-1">{{ title }}</h3>
    <p class="text-xs text-muted-foreground max-w-sm">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { f7Icon } from "framework7-vue";

interface Props {
  title?: string;
  description?: string;
  icon?: {
    ios: string;
    md: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  title: "Нет данных",
  description: "Данные отсутствуют для выбранного учебного года",
  icon: () => ({
    ios: "f7:doc_text",
    md: "material:description",
  }),
});
</script>
