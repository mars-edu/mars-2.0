/**
 * Offline Sync Manager
 *
 * Manages offline mutations queue using IndexedDB.
 * When the device goes offline, mutations are queued locally.
 * When online, queued mutations are replayed to Convex.
 */

import localforage from "localforage";
import { ref, computed, onMounted, onUnmounted } from "vue";

// Configure localforage for offline queue
const offlineQueueStore = localforage.createInstance({
  name: "mars-offline-queue",
  storeName: "mutations",
});

// Configure localforage for local cache
const localCacheStore = localforage.createInstance({
  name: "mars-local-cache",
  storeName: "cache",
});

export interface QueuedMutation {
  id: string;
  operation: string;
  args: Record<string, any>;
  createdAt: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
  error?: string;
}

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  syncError: string | null;
}

// Reactive state
const isOnline = ref(navigator.onLine);
const isSyncing = ref(false);
const pendingCount = ref(0);
const lastSyncAt = ref<number | null>(null);
const syncError = ref<string | null>(null);

// Device/client identifier
const clientId = ref<string>("");

/**
 * Generate or retrieve a persistent client ID
 */
async function getClientId(): Promise<string> {
  if (clientId.value) return clientId.value;

  let id = await localCacheStore.getItem<string>("clientId");
  if (!id) {
    id = crypto.randomUUID();
    await localCacheStore.setItem("clientId", id);
  }
  clientId.value = id;
  return id;
}

/**
 * Queue a mutation for later execution
 */
export async function queueMutation(
  operation: string,
  args: Record<string, any>
): Promise<string> {
  const id = crypto.randomUUID();
  const mutation: QueuedMutation = {
    id,
    operation,
    args,
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending",
  };

  await offlineQueueStore.setItem(id, mutation);
  await updatePendingCount();

  console.log(`[OfflineSync] Queued mutation: ${operation}`, args);

  return id;
}

/**
 * Get all pending mutations
 */
export async function getPendingMutations(): Promise<QueuedMutation[]> {
  const mutations: QueuedMutation[] = [];

  await offlineQueueStore.iterate<QueuedMutation, void>((value) => {
    if (value.status === "pending" || value.status === "failed") {
      mutations.push(value);
    }
  });

  // Sort by creation time
  return mutations.sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Update the pending count
 */
async function updatePendingCount(): Promise<void> {
  const mutations = await getPendingMutations();
  pendingCount.value = mutations.length;
}

/**
 * Mark a mutation as synced and remove it
 */
export async function markMutationSynced(id: string): Promise<void> {
  await offlineQueueStore.removeItem(id);
  await updatePendingCount();
}

/**
 * Mark a mutation as failed
 */
export async function markMutationFailed(
  id: string,
  error: string
): Promise<void> {
  const mutation = await offlineQueueStore.getItem<QueuedMutation>(id);
  if (mutation) {
    mutation.status = "failed";
    mutation.error = error;
    mutation.retryCount++;
    await offlineQueueStore.setItem(id, mutation);
  }
  await updatePendingCount();
}

/**
 * Sync all pending mutations
 * @param executeMutation Function to execute each mutation
 */
export async function syncPendingMutations(
  executeMutation: (operation: string, args: Record<string, any>) => Promise<any>
): Promise<{ synced: number; failed: number }> {
  if (isSyncing.value) {
    console.log("[OfflineSync] Sync already in progress");
    return { synced: 0, failed: 0 };
  }

  if (!isOnline.value) {
    console.log("[OfflineSync] Device is offline, skipping sync");
    return { synced: 0, failed: 0 };
  }

  isSyncing.value = true;
  syncError.value = null;

  const mutations = await getPendingMutations();
  let synced = 0;
  let failed = 0;

  console.log(`[OfflineSync] Starting sync of ${mutations.length} mutations`);

  for (const mutation of mutations) {
    // Skip mutations that have failed too many times
    if (mutation.retryCount >= 3) {
      console.warn(
        `[OfflineSync] Skipping mutation ${mutation.id} - too many retries`
      );
      failed++;
      continue;
    }

    try {
      // Update status to syncing
      mutation.status = "syncing";
      await offlineQueueStore.setItem(mutation.id, mutation);

      // Execute the mutation
      await executeMutation(mutation.operation, mutation.args);

      // Remove from queue on success
      await markMutationSynced(mutation.id);
      synced++;

      console.log(`[OfflineSync] Synced mutation: ${mutation.operation}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await markMutationFailed(mutation.id, errorMessage);
      failed++;

      console.error(
        `[OfflineSync] Failed to sync mutation: ${mutation.operation}`,
        error
      );
    }
  }

  isSyncing.value = false;
  lastSyncAt.value = Date.now();

  if (failed > 0) {
    syncError.value = `${failed} mutation(s) failed to sync`;
  }

  console.log(`[OfflineSync] Sync complete: ${synced} synced, ${failed} failed`);

  return { synced, failed };
}

/**
 * Clear all pending mutations (use with caution)
 */
export async function clearPendingMutations(): Promise<void> {
  await offlineQueueStore.clear();
  await updatePendingCount();
}

/**
 * Cache data locally for offline access
 */
export async function cacheData<T>(key: string, data: T): Promise<void> {
  await localCacheStore.setItem(key, {
    data,
    cachedAt: Date.now(),
  });
}

/**
 * Get cached data
 */
export async function getCachedData<T>(
  key: string
): Promise<{ data: T; cachedAt: number } | null> {
  return await localCacheStore.getItem(key);
}

/**
 * Clear cached data
 */
export async function clearCachedData(key?: string): Promise<void> {
  if (key) {
    await localCacheStore.removeItem(key);
  } else {
    await localCacheStore.clear();
  }
}

/**
 * Vue composable for offline sync
 */
export function useOfflineSync() {
  // Online/offline event handlers
  const handleOnline = () => {
    isOnline.value = true;
    console.log("[OfflineSync] Device is online");
  };

  const handleOffline = () => {
    isOnline.value = false;
    console.log("[OfflineSync] Device is offline");
  };

  onMounted(async () => {
    // Initialize client ID
    await getClientId();

    // Update pending count
    await updatePendingCount();

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  });

  onUnmounted(() => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  });

  return {
    // State
    isOnline: computed(() => isOnline.value),
    isSyncing: computed(() => isSyncing.value),
    pendingCount: computed(() => pendingCount.value),
    lastSyncAt: computed(() => lastSyncAt.value),
    syncError: computed(() => syncError.value),
    clientId: computed(() => clientId.value),

    // Actions
    queueMutation,
    syncPendingMutations,
    getPendingMutations,
    clearPendingMutations,
    cacheData,
    getCachedData,
    clearCachedData,
  };
}

/**
 * Type guard to check if we're offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}
