<template>
  <navigation-button icon="list_bullet" @click="$emit('click')" />
</template>

<script setup lang="ts">
import NavigationButton from "./NavigationButton.vue";

defineEmits<{
  (e: "click"): void;
}>();
</script>
