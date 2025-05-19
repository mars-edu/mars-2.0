<template>
  <button
    v-if="isProduction"
    class="flex items-center gap-3 w-fit"
    @click="navigateToHome"
  >
    <img :src="logoSrc" alt="Mars Logo" class="h-12" />
  </button>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";
import { ref, computed } from "vue";

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

const navigateToHome = () => {
  f7.views.main.router.navigate("/");
};
</script>
