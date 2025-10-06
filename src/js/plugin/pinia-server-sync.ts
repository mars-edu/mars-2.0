import superjson from "superjson";
import { applyPatch, compare } from "fast-json-patch";
import type { Operation } from "fast-json-patch";
import type {
  PiniaPlugin,
  PiniaPluginContext,
  DefineStoreOptionsBase,
} from "pinia";
import { useSyncStore } from "../../stores/syncStore";

declare module "pinia" {
  export interface DefineStoreOptionsBase<S, Store> {
    serverSync?: {
      enabled: boolean;
    };
  }
}

interface WsMessage {
  type: "STATE_UPDATE" | "SYNC_REQUEST" | "STATE_PATCH";
  state?: string;
  storeId?: string;
  patch?: Operation[];
  timestamp?: number;
}

interface PluginOptions {
  url: string;
  serializer: {
    serialize: (value: any) => string;
    deserialize: (value: string) => any;
  };
}

let ws: WebSocket | null = null;
const stores = new Map<string, any>();
const lastKnownState = new Map<string, any>();
const lastServerUpdateTimestamps = new Map<string, number>();
const patchingStores = new Set<string>();
let pluginOptions: PluginOptions | null = null;
let connectionPromise: Promise<void> | null = null;
let reconnectAttempts = 0;
let reconnectTimer: number | null = null;
let stoppedForAuth = false;

const sanitizeState = (state: any): any => {
  if (state === null || typeof state !== "object") return state;
  if (Array.isArray(state)) return state.map(sanitizeState);
  const result: any = {};
  for (const key in state) {
    if (key === "loading" || key === "isLoading") continue;
    const value = (state as any)[key];
    result[key] = sanitizeState(value);
  }
  return result;
};

const getBackoffDelayMs = () => {
  const base = 500;
  const max = 30000;
  const jitter = Math.floor(Math.random() * 200);
  const exp = Math.min(max, base * Math.pow(2, reconnectAttempts));
  return exp + jitter;
};

const scheduleReconnect = () => {
  if (stoppedForAuth) return;
  if (reconnectTimer !== null) return;
  const delay = getBackoffDelayMs();
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
};

const sendSyncRequestsForAllStores = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  stores.forEach((_store, storeId) => {
    const message: WsMessage = { type: "SYNC_REQUEST", storeId };
    ws!.send(pluginOptions!.serializer.serialize(message));
  });
};

const hasValidToken = () => {
  const token = localStorage.getItem("auth_token");
  return Boolean(token && token.length > 0);
};

const connect = () => {
  if (stoppedForAuth) return;
  if (ws || !pluginOptions) return;
  if (!hasValidToken()) return;

  connectionPromise = new Promise((resolve, reject) => {
    let url = pluginOptions!.url;
    const token = localStorage.getItem("auth_token");
    if (token) {
      const separator = url.includes("?") ? "&" : "?";
      url = `${url}${separator}token=${encodeURIComponent(token)}`;
    }

    console.log(
      `[PiniaServerSync] Creating shared WebSocket connection to ${url}`
    );
    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("[PiniaServerSync] Shared WebSocket connection established.");
      reconnectAttempts = 0;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      try {
        const syncStore = useSyncStore();
        syncStore.clearAll();
      } catch {}
      resolve();
      sendSyncRequestsForAllStores();
    };

    ws.onclose = (event) => {
      console.log("[PiniaServerSync] Shared WebSocket connection closed.");
      ws = null;
      connectionPromise = null;
      if (event.code === 1008 || event.code === 4001) {
        stoppedForAuth = true;
        console.warn("[PiniaServerSync] Stopping reconnect due to auth error.");
        return;
      }
      reconnectAttempts = Math.min(reconnectAttempts + 1, 10);
      scheduleReconnect();
    };

    ws.onerror = (event) => {
      console.error("[PiniaServerSync] WebSocket error:", event);
      // Ensure a reconnect is scheduled; onclose will also schedule it
      scheduleReconnect();
      // Reject the current connection attempt promise to unblock any awaiters
      reject(new Error("WebSocket connection failed"));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WsMessage = pluginOptions!.serializer.deserialize(
          event.data
        );
        console.log(
          `[PiniaServerSync] Received message of type ${message.type} for store ${message.storeId}`
        );

        if (!message.storeId) return;
        const store = stores.get(message.storeId);
        if (!store) {
          console.warn(
            `[PiniaServerSync] Store with id "${message.storeId}" not found for incoming message.`
          );
          return;
        }

        patchingStores.add(store.$id);
        try {
          if (
            message.type === "STATE_UPDATE" &&
            message.state &&
            message.timestamp
          ) {
            console.log(
              `[PiniaServerSync] Applying full STATE_UPDATE for store ${store.$id}.`
            );
            lastServerUpdateTimestamps.set(store.$id, message.timestamp);
            const newState = pluginOptions!.serializer.deserialize(
              message.state
            );
            store.$patch(newState);
            lastKnownState.set(store.$id, sanitizeState(newState));
            try {
              const syncStore = useSyncStore();
              syncStore.endSync(store.$id);
            } catch {}
          } else if (
            message.type === "STATE_PATCH" &&
            message.patch &&
            message.timestamp
          ) {
            const currentLocalState =
              lastKnownState.get(store.$id) || sanitizeState(store.$state);
            const { newDocument } = applyPatch(
              currentLocalState,
              message.patch,
              true,
              false
            );
            store.$patch(newDocument);
            lastKnownState.set(store.$id, sanitizeState(newDocument));
            lastServerUpdateTimestamps.set(store.$id, message.timestamp);
            try {
              const syncStore = useSyncStore();
              syncStore.endSync(store.$id);
            } catch {}
          }
        } finally {
          patchingStores.delete(store.$id);
        }
      } catch (error) {
        console.error(
          "[PiniaServerSync] Error handling message from server:",
          error
        );
      }
    };
  });
};

export function PiniaServerSync(options: PluginOptions): PiniaPlugin {
  pluginOptions = options;

  return (context: PiniaPluginContext) => {
    if (context.options.serverSync?.enabled === false) {
      return;
    }

    const { store } = context;
    if (!ws) {
      connect();
    }

    console.log(`[PiniaServerSync] Registering store: ${store.$id}`);
    stores.set(store.$id, store);
    lastKnownState.set(store.$id, sanitizeState({ ...store.$state }));

    connectionPromise?.then(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        console.log(
          `[PiniaServerSync] Sending SYNC_REQUEST for store ${store.$id}.`
        );
        const message: WsMessage = {
          type: "SYNC_REQUEST",
          storeId: store.$id,
        };
        ws.send(pluginOptions!.serializer.serialize(message));
      }
    });

    store.$subscribe(
      (_mutation, state) => {
        console.log(
          `[PiniaServerSync] Store ${store.$id} subscribed callback triggered.`
        );
        if (patchingStores.has(store.$id)) {
          console.log(
            `[PiniaServerSync] Store ${store.$id} is currently patching, skipping local change processing.`
          );
          return;
        }

        if (!ws) {
          console.log(
            `[PiniaServerSync] WebSocket not initialized for store ${store.$id}.`
          );
          return;
        }

        if (ws.readyState !== WebSocket.OPEN) {
          console.log(
            `[PiniaServerSync] WebSocket not open (${ws.readyState}) for store ${store.$id}.`
          );
          return;
        }

        const sanitizedState = sanitizeState({ ...state });
        const prev = lastKnownState.get(store.$id);
        if (prev) {
          const diff = compare(prev, sanitizedState);
          if (diff.length === 0) {
            return;
          }
        }
        lastKnownState.set(store.$id, sanitizedState);

        console.log(
          `[PiniaServerSync] Local change detected. Sending STATE_UPDATE for store ${store.$id}.`
        );

        const message: WsMessage = {
          type: "STATE_UPDATE",
          state: pluginOptions!.serializer.serialize(sanitizedState),
          storeId: store.$id,
          timestamp: lastServerUpdateTimestamps.get(store.$id) || 0,
        };
        try {
          const syncStore = useSyncStore();
          syncStore.startSync(store.$id);
        } catch {}
        ws.send(superjson.stringify(message));
      },
      { detached: true }
    );
  };
}
