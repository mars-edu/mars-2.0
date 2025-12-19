import type { User } from "./user";

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

/**
 * User registration data interface
 */
export interface RegisterData {
  firstName: string;
  lastName: string;
  middleName?: string;
  iin?: string;
  email: string;
  password: string;
}

/**
 * Authentication response interface
 */
export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

/**
 * Convex authentication response structure
 */
export interface ConvexAuthResponse {
  user: unknown;
  token: string;
}

/**
 * Convex token validation response structure
 */
export interface ConvexValidationResponse {
  valid: boolean;
  user?: unknown;
}

/**
 * Convex error data structure
 */
export interface ConvexErrorData {
  data?: {
    code?: string;
  };
  message?: string;
}
