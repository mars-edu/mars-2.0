<template>
  <!-- <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-end z-[9998]"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="m-4 rounded-xl bg-white/90 shadow-xl p-4 w-full max-w-sm">
        <div class="flex items-center gap-3 mb-2">
          <Loader />
          <h3 class="text-base font-semibold text-gray-800">Синхронизация</h3>
        </div>
        <p class="text-sm text-gray-600 mb-2">Сохраняем изменения в облаке…</p>
        <ul class="space-y-1 max-h-48 overflow-auto">
          <li
            v-for="entry in trpcSyncingList"
            :key="entry.storeId"
            class="text-sm text-gray-700"
          >
            {{ entry.label ?? entry.storeId }}
          </li>
        </ul>
      </div>
    </div>
  </transition> -->
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useSyncStore } from "@/stores/syncStore";
import Loader from "./Loader.vue";

const syncStore = useSyncStore();
const { isTrpcSyncing, trpcSyncingList } = storeToRefs(syncStore);

const visible = ref(false);
let hideTimer: number | null = null;

const showOverlay = () => {
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }
  visible.value = true;
};

const scheduleHide = () => {
  if (hideTimer) {
    window.clearTimeout(hideTimer);
  }
  hideTimer = window.setTimeout(() => {
    visible.value = false;
    hideTimer = null;
  }, 250);
};

onMounted(() => {
  syncStore.markMounted();
});

watch(
  () => isTrpcSyncing.value,
  (now) => {
    if (now) {
      showOverlay();
    } else {
      scheduleHide();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
