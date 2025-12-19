import { t, type MessageKey } from "./messages";
import type { ConvexErrorData } from "../types/auth";

/**
 * Extract a user-friendly error message from a Convex error
 * @param error - The error object (unknown type for safety)
 * @returns A localized user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const convexError = error as ConvexErrorData;

  // Check if it's a ConvexError with a code
  if (convexError?.data?.code) {
    const code = convexError.data.code as MessageKey;
    return t(code);
  }

  // Fallback to error message or default
  if (convexError?.message) {
    return convexError.message;
  }

  return t("server_error");
}
