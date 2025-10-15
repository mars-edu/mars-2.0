<template>
  <!-- Sync overlay always hidden - sync state popover disabled -->
  <!--
  <transition name="fade">
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
            v-for="entry in syncingList"
            :key="entry.storeId"
            class="text-sm text-gray-700"
          >
            {{ entry.storeId }}
          </li>
        </ul>
      </div>
    </div>
  </transition>
  -->
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSyncStore } from "@/stores/syncStore";
import Loader from "./Loader.vue";

// Sync overlay always hidden - sync state popover disabled
// import { ref, onMounted, watch } from "vue";
// import { debounce } from "es-toolkit";
// const syncStore = useSyncStore();
// const { isSyncing, syncingList } = storeToRefs(syncStore);

// const visible = ref(false);
// const debouncedHide = debounce(() => {
//   visible.value = false;
// }, 250);

// onMounted(() => {
//   syncStore.markMounted();
// });

// watch(
//   () => isSyncing.value,
//   (now) => {
//     if (now) {
//       visible.value = true;
//       debouncedHide.cancel?.();
//     } else {
//       // Delay hide a bit to avoid flicker for very fast syncs
//       debouncedHide();
//     }
//   },
//   { immediate: true }
// );
</script>

<style scoped>
/* Sync overlay styles commented out - overlay always hidden */
/*
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
*/
</style>
