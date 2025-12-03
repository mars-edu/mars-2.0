/**
 * Authentication utilities
 */

/**
 * Get common authentication headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  const language =
    localStorage.getItem("app_language") ||
    navigator.language?.split("-")[0] ||
    "en";

  const headers: Record<string, string> = {
    "X-Language": language,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

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
