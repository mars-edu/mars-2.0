/**
 * Convex Vue Client Setup
 *
 * This file provides Convex configuration for the Vue app.
 * The convex-vue plugin is registered in app.js
 */

import { convexVue } from "convex-vue";
import { ConvexClient } from "convex/browser";

// Get the Convex URL from environment variables
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const USE_CONVEX = import.meta.env.VITE_USE_CONVEX;

// DEBUG: Log environment variables on module load
console.log("=".repeat(60));
console.log("[ConvexClient] Module loaded with environment:");
console.log("  VITE_USE_CONVEX:", USE_CONVEX);
console.log("  VITE_CONVEX_URL:", CONVEX_URL);
console.log("  Type of VITE_USE_CONVEX:", typeof USE_CONVEX);
console.log("  Will use Convex:", USE_CONVEX === "true" && !!CONVEX_URL);
console.log("=".repeat(60));

if (!CONVEX_URL) {
  console.warn(
    "[ConvexClient] VITE_CONVEX_URL is not set. Convex features will not be available."
  );
}

/**
 * Convex Vue plugin instance
 * Use this with app.use() to register the plugin
 */
export const convexPlugin = convexVue;

/**
 * Convex URL for plugin configuration
 */
export const convexUrl = CONVEX_URL;

/**
 * Direct Convex client instance for use outside of Vue components
 * (e.g., in services, classes, utility functions)
 */
export const convex = CONVEX_URL ? new ConvexClient(CONVEX_URL) : null;

/**
 * Check if Convex is configured and available
 */
export function isConvexAvailable(): boolean {
  return !!CONVEX_URL;
}

/**
 * Feature flag to control Convex usage during migration
 */
export function useConvexFeatures(): boolean {
  const viteUseConvex = import.meta.env.VITE_USE_CONVEX;
  const available = isConvexAvailable();
  const result = viteUseConvex === "true" && available;

  // Debug logging
  console.log("[ConvexClient] Feature check:", {
    VITE_USE_CONVEX: viteUseConvex,
    VITE_CONVEX_URL: CONVEX_URL,
    isAvailable: available,
    willUseConvex: result
  });

  return result;
}
