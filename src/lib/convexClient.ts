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

// DEBUG: Log environment variables on module load
console.log("=".repeat(60));
console.log("[ConvexClient] Module loaded with environment:");
console.log("  VITE_CONVEX_URL:", CONVEX_URL);
console.log("  Type of VITE_CONVEX_URL:", typeof CONVEX_URL);
console.log("=".repeat(60));

// Validate that Convex URL is configured
if (!CONVEX_URL) {
  throw new Error(
    "[ConvexClient] VITE_CONVEX_URL is required. Convex is now mandatory for the application to function. Please configure your Convex URL in the environment variables."
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
export const convex = new ConvexClient(CONVEX_URL);

/**
 * Check if Convex is configured and available
 * Always returns true now since Convex is mandatory
 */
export function isConvexAvailable(): boolean {
  return true;
}
