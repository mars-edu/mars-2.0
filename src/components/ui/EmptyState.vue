<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
      <component :is="icon" class="text-[22px] text-muted-foreground" />
    </div>
    <p class="text-sm font-medium text-foreground mb-1">{{ title }}</p>
    <p v-if="description" class="text-sm text-muted-foreground mb-4">{{ description }}</p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import IconInbox from "~icons/lucide/inbox";

interface Props {
  icon?: Component;
  title: string;
  description?: string;
}

withDefaults(defineProps<Props>(), { icon: () => IconInbox });
</script>
