import { defineStore } from "pinia";
import type { SyncEntry } from "@/types/sync";

const syncTimeoutsById: Record<string, number> = {};
export const useSyncStore = defineStore("sync", {
  state: () => ({
    syncingById: {} as Record<string, SyncEntry>,
    mounted: false,
  }),
  getters: {
    isSyncing(state): boolean {
      return state.mounted && Object.keys(state.syncingById).length > 0;
    },
    syncingList(state): SyncEntry[] {
      return Object.values(state.syncingById);
    },
  },
  actions: {
    startSync(storeId: string, timeoutMs = 8000, label?: string) {
      this.syncingById[storeId] = {
        storeId,
        startedAt: Date.now(),
        label,
      };
      if (syncTimeoutsById[storeId]) {
        clearTimeout(syncTimeoutsById[storeId]);
      }
      syncTimeoutsById[storeId] = window.setTimeout(() => {
        this.endSync(storeId);
      }, timeoutMs);
    },
    endSync(storeId: string) {
      if (syncTimeoutsById[storeId]) {
        clearTimeout(syncTimeoutsById[storeId]);
        delete syncTimeoutsById[storeId];
      }
      delete this.syncingById[storeId];
    },
    clearAll() {
      Object.values(syncTimeoutsById).forEach((t) => clearTimeout(t));
      for (const id in syncTimeoutsById) delete syncTimeoutsById[id];
      this.syncingById = {} as Record<string, SyncEntry>;
    },
    markMounted() {
      this.mounted = true;
    },
  },
});
