<template>
  <button
    v-if="isProduction"
    class="flex items-center gap-3 w-fit"
    @click="navigateToHome"
  >
    <div
      :class="[
        'w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl',
        variant === 'light'
          ? 'bg-white/20 text-white shadow-white/30'
          : 'bg-[#e53935] text-white shadow-[rgba(229,57,53,0.3)]',
      ]"
      class="shadow-md"
    >
      <span>M</span>
    </div>
    <span
      :class="[
        'text-2xl font-bold tracking-[-0.5px]',
        variant === 'light' ? 'text-white' : 'text-[#333]',
      ]"
      >Mars</span
    >
  </button>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";
import { ref } from "vue";

defineProps({
  variant: {
    type: String,
    default: "default",
    validator: (value: string) => ["default", "light"].includes(value),
  },
});

const isProduction = ref(import.meta.env.MODE !== "development");
// const isProduction = true;

const navigateToHome = () => {
  f7.views.main.router.navigate("/");
};
</script>
