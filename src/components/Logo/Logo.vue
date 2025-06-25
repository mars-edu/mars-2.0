<template>
  <a
    v-if="isProduction"
    class="flex items-center w-fit"
    href="/home"
  >
    <img :src="logoSrc" alt="Mars Logo" class="h-16" />
  </a>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "default",
    validator: (value: string) => ["default", "light"].includes(value),
  },
});

// const isProduction = ref(import.meta.env.MODE !== "development");
const isProduction = true;

const logoSrc = computed(() => {
  return new URL("/assets/LOGO.png", import.meta.url).href;
});

</script>
