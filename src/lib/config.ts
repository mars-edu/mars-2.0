/**
 * Centralized API configuration
 *
 * NOTE: This is LEGACY configuration for the old Cloudflare Workers backend.
 * When VITE_USE_CONVEX=true (default), this is NOT used.
 * Only used when falling back to tRPC/WebSocket backend.
 */

const DEFAULT_API_URL = "https://mars-backend.robanokssamit-1ba.workers.dev/api";

/**
 * Get API base URL from environment or use default
 * In development, you can set VITE_API_URL in .env.local
 *
 * @deprecated Use Convex instead (VITE_CONVEX_URL)
 */
export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
