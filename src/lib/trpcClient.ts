import { createTRPCProxyClient, httpBatchLink, type TRPCLink } from "@trpc/client";
import type { AppRouter } from "../../backend/src/trpc/routers/index";
import superjson from "superjson";
import { observable } from "@trpc/server/observable";
import { useSyncStore } from "@/stores/syncStore";
import { API_URL } from "./config";
import { getAuthHeaders } from "./auth";

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
      url: `${API_URL}/trpc`,

      // Add authentication headers
      headers: getAuthHeaders,

      // Use superjson for serialization (same as backend)
      // This handles Date, Map, Set, BigInt, etc.
      transformer: superjson,
    }),
  ],
});
