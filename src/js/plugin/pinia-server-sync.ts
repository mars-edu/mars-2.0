import superjson from "superjson";
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
  type: "STATE_UPDATE" | "SYNC_REQUEST";
  state?: string;
  storeId?: string;
  timestamp?: number;
}

interface PluginOptions {
  url: string;
  serializer?: {
    serialize: (value: any) => string;
    deserialize: (value: string) => any;
  };
}

const GRACE_PERIOD = 100;

let ws: WebSocket | null = null;
const stores = new Map<string, any>();
const lastServerUpdateTimestamps = new Map<string, number>();
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

        if (
          message.type === "STATE_UPDATE" &&
          message.state &&
          message.timestamp
        ) {
          console.log(
            `[PiniaServerSync] Applying full STATE_UPDATE for store ${store.$id}.`
          );
          lastServerUpdateTimestamps.set(store.$id, message.timestamp);
          const data = serializer.deserialize(message.state);
          store.$patch(data);
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

    store.$subscribe((_mutation, state) => {
      const lastServerTimestamp =
        lastServerUpdateTimestamps.get(store.$id) || 0;
      const now = Date.now();
      if (now - lastServerTimestamp < GRACE_PERIOD) {
        return;
      }

      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const serializer = pluginOptions?.serializer ?? {
        serialize: superjson.stringify,
        deserialize: superjson.parse,
      };

      console.log(
        `[PiniaServerSync] Local change detected. Sending STATE_UPDATE for store ${store.$id}.`
      );
      const message: WsMessage = {
        type: "STATE_UPDATE",
        state: serializer.serialize(state),
        storeId: store.$id,
      };
      ws.send(superjson.stringify(message));
    });
  };
}
