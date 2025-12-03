/**
 * Centralized API configuration
 */

const DEFAULT_API_URL = "https://mars-backend.robanokssamit-1ba.workers.dev/api";

/**
 * Get API base URL from environment or use default
 * In development, you can set VITE_API_URL in .env.local
 */
export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
