import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../backend/src/trpc/routers/index";
import superjson from "superjson";

/**
 * Get API URL from environment or use default
 */
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // return "http://localhost:3001";
  return "https://mars-backend.robanokssamit-1ba.workers.dev";
};

const API_URL = getApiUrl();

/**
 * tRPC client with batching and authentication
 */
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
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
