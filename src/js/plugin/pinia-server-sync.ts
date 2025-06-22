import superjson from "superjson";
import { applyPatch, compare } from "fast-json-patch";
import type { Operation } from "fast-json-patch";
import type {
  PiniaPlugin,
  PiniaPluginContext,
  DefineStoreOptionsBase,
} from "pinia";

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
  serializer?: {
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

const connect = () => {
  if (ws || !pluginOptions) return;

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
    const serializer = pluginOptions!.serializer ?? {
      serialize: superjson.stringify,
      deserialize: superjson.parse,
    };

    ws.onopen = () => {
      console.log("[PiniaServerSync] Shared WebSocket connection established.");
      resolve();
    };

    ws.onclose = () => {
      console.log("[PiniaServerSync] Shared WebSocket connection closed.");
      ws = null;
      connectionPromise = null;
    };

    ws.onerror = (event) => {
      console.error("[PiniaServerSync] WebSocket error:", event);
      reject(new Error("WebSocket connection failed"));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WsMessage = superjson.parse(event.data);
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
            const newState = serializer.deserialize(message.state);
            store.$patch(newState);
            lastKnownState.set(store.$id, newState);
          } else if (
            message.type === "STATE_PATCH" &&
            message.patch &&
            message.timestamp
          ) {
            const currentLocalState =
              lastKnownState.get(store.$id) || store.$state;
            const { newDocument } = applyPatch(
              currentLocalState,
              message.patch,
              true,
              false
            );
            store.$patch(newDocument);
            lastKnownState.set(store.$id, newDocument);
            lastServerUpdateTimestamps.set(store.$id, message.timestamp);
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
    lastKnownState.set(store.$id, { ...store.$state });

    connectionPromise?.then(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        console.log(
          `[PiniaServerSync] Sending SYNC_REQUEST for store ${store.$id}.`
        );
        const message: WsMessage = {
          type: "SYNC_REQUEST",
          storeId: store.$id,
        };
        ws.send(superjson.stringify(message));
      }
    });

    store.$subscribe(
      (_mutation, state) => {
        if (patchingStores.has(store.$id)) {
          return;
        }

        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const serializer = pluginOptions?.serializer ?? {
          serialize: superjson.stringify,
          deserialize: superjson.parse,
        };

        const oldState = lastKnownState.get(store.$id) || {};
        const patch = compare(oldState, state);
        lastKnownState.set(store.$id, { ...state });

        if (patch.length === 0) {
          return;
        }

        console.log(
          `[PiniaServerSync] Local change detected. Sending STATE_PATCH for store ${store.$id}.`
        );
        const message: WsMessage = {
          type: "STATE_PATCH",
          patch,
          storeId: store.$id,
          timestamp: lastServerUpdateTimestamps.get(store.$id) || 0,
        };
        ws.send(superjson.stringify(message));
      },
      { detached: true }
    );
  };
}
