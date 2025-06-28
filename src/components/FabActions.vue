<template>
  <f7-fab position="right-bottom" class="mb-6 mr-6">
    <f7-icon ios="f7:plus" md="material:add" class="text-white"></f7-icon>
    <f7-icon ios="f7:xmark" md="material:close" class="text-white"></f7-icon>
    <f7-fab-buttons position="top" class="mr-2">
      <f7-fab-button
        label="Перевод курсов"
        class="bg-primary text-primary-foreground shadow-lg"
        @click="$emit('transfer-courses')"
      >
        <f7-icon ios="f7:arrow_2_squarepath" md="material:language"></f7-icon>
      </f7-fab-button>
    </f7-fab-buttons>
  </f7-fab>
</template>

<script setup lang="ts">
import { f7Fab, f7FabButtons, f7FabButton, f7Icon } from "framework7-vue";

defineEmits<{
  (e: "transfer-courses"): void;
}>();
</script>
