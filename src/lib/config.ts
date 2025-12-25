/**
 * Centralized API configuration
 *
 * LEGACY - NO LONGER USED. Application uses Convex exclusively.
 * This file is kept for reference only.
 */

const DEFAULT_API_URL = "https://mars-backend.robanokssamit-1ba.workers.dev/api";

/**
 * Get API base URL from environment or use default
 * In development, you can set VITE_API_URL in .env.local
 *
 * @deprecated Use Convex instead (VITE_CONVEX_URL)
 */
export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
