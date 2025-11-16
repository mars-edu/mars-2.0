import { createTRPCProxyClient, httpBatchLink, type TRPCLink } from "@trpc/client";
import type { AppRouter } from "../../backend/src/trpc/routers/index";
import superjson from "superjson";
import { observable } from "@trpc/server/observable";
import { useSyncStore } from "@/stores/syncStore";

/**
 * Get API URL from environment or use default
 */
const getApiUrl = () => {
  // return "http://localhost:3001";
  return "https://mars-backend.robanokssamit-1ba.workers.dev";
};

const API_URL = getApiUrl();
let trpcRequestCounter = 0;

const safeSyncStore = () => {
  try {
    return useSyncStore();
  } catch (error) {
    console.warn("[tRPC] Unable to access sync store", error);
    return null;
  }
};

const getOperationLabel = (type: string, path: string) => {
  if (type === "mutation") return `Сохраняем ${path}`;
  if (type === "subscription") return `Подписка ${path}`;
  return `Загружаем ${path}`;
};

const syncOverlayLink: TRPCLink<AppRouter> = () => ({ next, op }) => {
  const syncStore = safeSyncStore();
  const entryId = syncStore
    ? `trpc:${op.type}:${op.path}:${++trpcRequestCounter}`
    : null;

  if (syncStore && entryId) {
    syncStore.startSync(entryId, 12000, getOperationLabel(op.type, op.path));
  }

  return observable((observer) => {
    let cleanedUp = false;
    const finalize = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (syncStore && entryId) {
        syncStore.endSync(entryId);
      }
    };

    const subscription = next(op).subscribe({
      next(result) {
        observer.next(result);
      },
      error(err) {
        finalize();
        observer.error(err);
      },
      complete() {
        finalize();
        observer.complete();
      },
    });

    return () => {
      finalize();
      subscription.unsubscribe?.();
    };
  });
};

/**
 * tRPC client with batching and authentication
 */
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    syncOverlayLink,
    httpBatchLink({
      url: `${API_URL}/api/trpc`,

      // Add authentication headers
      headers() {
        const token = localStorage.getItem("auth_token");
        const language = localStorage.getItem("app_language") || navigator.language?.split("-")[0] || "en";
        
        const headers: Record<string, string> = {
          "X-Language": language,
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        return headers;
      },

      // Use superjson for serialization (same as backend)
      // This handles Date, Map, Set, BigInt, etc.
      transformer: superjson,
    }),
  ],
});

/**
 * Helper to check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("auth_token");
};

/**
 * Helper to get auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};
