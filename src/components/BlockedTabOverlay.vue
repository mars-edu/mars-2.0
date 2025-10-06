<template>
  <transition name="fade">
    <div
      v-if="!isPrimaryTab"
      class="fixed inset-0 bg-gray-800 bg-opacity-90 flex flex-col items-center justify-center z-[10000] text-white p-8"
    >
      <div class="text-center">
        <h1 class="text-5xl font-bold mb-4">Mars</h1>
        <p class="text-2xl mb-2">Приложение уже открыто в другой вкладке.</p>
        <p class="text-lg opacity-80">
          Пожалуйста, используйте основную вкладку или закройте ее, чтобы
          продолжить здесь.
        </p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTabManagerStore } from "@/stores/tabManagerStore";

const tabManagerStore = useTabManagerStore();
const isPrimaryTab = computed(() => tabManagerStore.isPrimaryTab);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
