import { ConvexError } from "convex/values";
import { f7 } from "framework7-vue";
import { notify } from "@/lib/notify";
import {
  common_error,
  error_not_found,
  error_unauthorized,
  error_forbidden,
  error_invalid_state,
  error_already_exists,
  error_cannot_delete_default_language,
  error_study_language_in_use,
  error_semester_has_references,
  error_title,
} from "@/paraglide/messages";

function getLocalizedMessageByCode(code: string): string | null {
  switch (code) {
    case "NOT_FOUND":
      return error_not_found();
    case "UNAUTHORIZED":
      return error_unauthorized();
    case "FORBIDDEN":
      return error_forbidden();
    case "INVALID_STATE":
      return error_invalid_state();
    case "ALREADY_EXISTS":
      return error_already_exists();
    case "CANNOT_DELETE_DEFAULT_LANGUAGE":
      return error_cannot_delete_default_language();
    case "STUDY_LANGUAGE_IN_USE":
      return error_study_language_in_use();
    case "SEMESTER_HAS_REFERENCES":
      return error_semester_has_references();
    default:
      return null;
  }
}

/**
 * Extracts a user-friendly, localized error message from any error type.
 */
export function getErrorMessage(err: unknown, fallback?: string): string {
  if (!err) return fallback || common_error();

  if (typeof err === "string") return err;

  if (err instanceof ConvexError) {
    const data = err.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const d = data as { code?: string; message?: string; references?: Record<string, unknown> };
      if (d.code) {
        const localized = getLocalizedMessageByCode(d.code);
        if (localized) return localized;
      }
      if (d.message) return d.message;
    }
  }

  if (err instanceof Error) {
    // Clean up Convex server exception wrapper prefixes if present
    const msg = err.message || "";
    const cleanMsg = msg
      .replace(/^Uncaught ConvexError:\s*/, "")
      .replace(/^Error:\s*/, "")
      .replace(/\[CONVEX\s+[^\]]+\]\s*/, "")
      .trim();
    return cleanMsg || fallback || common_error();
  }

  return fallback || common_error();
}

/**
 * Shows an error toast notification.
 */
export function showError(err: unknown, fallback?: string): void {
  const message = getErrorMessage(err, fallback);
  notify.error(message);
}

/**
 * Shows a modal error alert dialog.
 */
export function showErrorDialog(err: unknown, title?: string): void {
  const message = getErrorMessage(err);
  const dialogTitle = title || error_title();
  if (typeof window !== "undefined" && f7?.dialog) {
    f7.dialog.alert(message, dialogTitle);
  } else {
    notify.error(message);
  }
}
