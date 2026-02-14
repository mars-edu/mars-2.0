<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
      <i class="f7-icons text-[22px] text-muted-foreground">{{ icon }}</i>
    </div>
    <p class="text-sm font-medium text-foreground mb-1">{{ title }}</p>
    <p v-if="description" class="text-sm text-muted-foreground mb-4">{{ description }}</p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string;
  title: string;
  description?: string;
}

withDefaults(defineProps<Props>(), { icon: "tray" });
</script>
