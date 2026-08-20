import { STORAGE_KEYS } from "@/constants/storage";
/**
 * Authentication utilities
 */

/**
 * Helper to check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Helper to get auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};
