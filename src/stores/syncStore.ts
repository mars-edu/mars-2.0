import { defineStore } from "pinia";

export interface SyncEntry {
  storeId: string;
  startedAt: number;
}

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
    startSync(storeId: string) {
      this.syncingById[storeId] = { storeId, startedAt: Date.now() };
    },
    endSync(storeId: string) {
      delete this.syncingById[storeId];
    },
    clearAll() {
      this.syncingById = {} as Record<string, SyncEntry>;
    },
    markMounted() {
      this.mounted = true;
    },
  },
});
