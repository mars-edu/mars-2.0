import { ConvexError } from "convex/values";
import { f7 } from "framework7-vue";
import { notify } from "@/lib/notify";
import { common_error } from "@/paraglide/messages";

const KNOWN_ERROR_CODES: Record<string, string> = {
  NOT_FOUND: "Запрашиваемый ресурс не найден",
  UNAUTHORIZED: "У вас нет прав для выполнения этого действия",
  FORBIDDEN: "Доступ запрещен",
  INVALID_STATE: "Операция не может быть выполнена в текущем состоянии",
  ALREADY_EXISTS: "Такая запись уже существует",
  CANNOT_DELETE_DEFAULT_LANGUAGE:
    "Нельзя удалить язык по умолчанию — сначала назначьте другой язык по умолчанию",
  STUDY_LANGUAGE_IN_USE: "Язык используется и не может быть удален",
  SEMESTER_HAS_REFERENCES: "Семестр используется связанными записями",
};

/**
 * Extracts a user-friendly error message from any error type.
 */
export function getErrorMessage(err: unknown, fallback?: string): string {
  if (!err) return fallback || common_error();

  if (typeof err === "string") return err;

  if (err instanceof ConvexError) {
    const data = err.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const d = data as { code?: string; message?: string; references?: Record<string, unknown> };
      if (d.message) return d.message;
      if (d.code && KNOWN_ERROR_CODES[d.code]) return KNOWN_ERROR_CODES[d.code];
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
export function showErrorDialog(err: unknown, title = "Ошибка"): void {
  const message = getErrorMessage(err);
  if (typeof window !== "undefined" && f7?.dialog) {
    f7.dialog.alert(message, title);
  } else {
    notify.error(message);
  }
}
