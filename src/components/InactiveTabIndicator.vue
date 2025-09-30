<template>
  <transition name="fade">
    <div
      v-if="!isTabActive"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
    >
      <div class="text-center text-white p-8">
        <h1 class="text-4xl font-bold mb-4">👀</h1>
        <p class="text-xl">Вы еще здесь?</p>
        <p class="text-sm opacity-80 mt-2">Mars ждет вас!</p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useVisibilityStore } from "@/stores/visibilityStore";

const visibilityStore = useVisibilityStore();
const isTabActive = computed(() => visibilityStore.isTabActive);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
