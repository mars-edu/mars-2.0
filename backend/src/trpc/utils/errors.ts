import { TRPCError } from "@trpc/server";

/**
 * Standard service response interface
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  message?: string;
  token?: string;
  user?: T;
}

/**
 * Handle service response and throw appropriate TRPCError if failed
 * @param result Service response object
 * @param errorCode HTTP error code to use (default: BAD_REQUEST)
 * @param fallbackMessage Fallback error message
 */
export function handleServiceError(
  result: ServiceResponse,
  errorCode: "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR" = "BAD_REQUEST",
  fallbackMessage: string
): void {
  if (!result.success) {
    throw new TRPCError({
      code: errorCode,
      message: result.message || fallbackMessage,
    });
  }
}

/**
 * Extract and validate JWT token from authorization header
 * @param authHeader Authorization header value
 * @param errorMessage Error message to use if token is missing
 * @returns Extracted token
 */
export function extractBearerToken(
  authHeader: string | undefined,
  errorMessage: string
): string {
  if (!authHeader) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: errorMessage,
    });
  }

  const token = authHeader.replace("Bearer ", "");
  
  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: errorMessage,
    });
  }

  return token;
}
