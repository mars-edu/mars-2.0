/**
 * Unified storage keys for localStorage and sessionStorage.
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  STORED_USER: "stored_user",
  THEME: "theme",
  LOCALE: "paraglide_lang",
  CACHED_PERMISSIONS: "cached_permissions",
  ACTIVE_SEMESTER: "active_semester",
  ACTIVE_ACADEMIC_YEAR: "active_academic_year",
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
