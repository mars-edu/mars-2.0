<!-- src/components/AiAssistantFab.vue -->
<template>
  <div>
    <!-- FAB Button -->
    <button
      class="fixed z-[999] bottom-24 right-6 w-14 h-14 rounded-full shadow-lg
             bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
             flex items-center justify-center
             transition-all duration-200 ease-out
             hover:scale-105 active:scale-95"
      :class="{ 'ring-2 ring-indigo-300 ring-offset-2': isOpen }"
      aria-label="AI Ассистент"
      @click="isOpen = !isOpen"
    >
      <BotIcon v-if="!isOpen" :size="24" class="text-white" />
      <XIcon v-else :size="24" class="text-white" />
    </button>

    <!-- Assistant Panel -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <AiAssistantPanel v-if="isOpen" @close="isOpen = false" />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BotIcon, XIcon } from 'lucide-vue-next';
import AiAssistantPanel from './AiAssistantPanel.vue';

const isOpen = ref(false);
</script>
