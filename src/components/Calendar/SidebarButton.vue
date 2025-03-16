<template>
  <navigation-button icon="sidebar_left" @click="$emit('click')" />
</template>

<script setup lang="ts">
import NavigationButton from "./NavigationButton.vue";

defineEmits<{
  (e: "click"): void;
}>();
</script>
