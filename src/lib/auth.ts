/**
 * Authentication utilities
 */

/**
 * Helper to check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("auth_token");
};

/**
 * Helper to get auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};
