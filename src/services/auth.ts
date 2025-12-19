import { useUserStore } from "../stores/userStore";
import { type User } from "../types/user";
import { convex } from "../lib/convexClient";
import { api } from "@convex/_generated/api";
import { t } from "../utils/messages";
import { getErrorMessage } from "../utils/errorHandler";
import type {
  LoginCredentials,
  RegisterData,
  LoginResponse,
  ConvexAuthResponse,
  ConvexValidationResponse,
} from "../types/auth";

// Constants
const AUTH_TOKEN_KEY = "auth_token";

/**
 * Session Manager handles token and user session storage
 */
class SessionManager {
  /**
   * Store authentication token
   */
  static setToken(token: string, remember: boolean = true): void {
    if (remember) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  }

  /**
   * Retrieve stored authentication token
   */
  static getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  }

  /**
   * Remove stored authentication token
   */
  static clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }

  /**
   * Setup user session with token and user data
   */
  static setupSession(user: User, token: string, remember: boolean = true): void {
    const userStore = useUserStore();
    userStore.setUser(user);
    userStore.setToken(token);
    this.setToken(token, remember);
  }

  /**
   * Clear user session
   */
  static clearSession(): void {
    this.clearToken();
    const userStore = useUserStore();
    userStore.logout();
  }
}

/**
 * Type guard to validate User object
 */
function isValidUser(user: unknown): user is User {
  if (!user || typeof user !== "object") return false;
  const u = user as any;
  return (
    typeof u.id === "string" &&
    typeof u.username === "string" &&
    Array.isArray(u.roles)
  );
}

export default class AuthService {
  /**
   * Authenticate user with provided credentials
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const result = await convex.action(api.auth.mutations.login, {
        username: credentials.username,
        password: credentials.password,
      }) as ConvexAuthResponse;

      if (!isValidUser(result.user)) {
        return {
          success: false,
          message: t("server_error"),
        };
      }

      const user = result.user;
      const token = result.token;

      SessionManager.setupSession(user, token, credentials.remember ?? true);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      console.error("[AuthService] Login failed:", error);
      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }

  /**
   * Validate stored token and load user data
   */
  static async validateToken(token: string): Promise<LoginResponse> {
    try {
      const result = await convex.action(
        api.auth.mutations.validateTokenAction,
        { token }
      ) as ConvexValidationResponse;

      if (!result.valid || !result.user) {
        return {
          success: false,
          message: t("invalid_token"),
        };
      }

      if (!isValidUser(result.user)) {
        return {
          success: false,
          message: t("server_error"),
        };
      }

      return {
        success: true,
        user: result.user,
      };
    } catch (error) {
      console.error("[AuthService] Token validation failed:", error);
      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }

  /**
   * Logout the current user
   */
  static logout(): void {
    SessionManager.clearSession();
  }

  /**
   * Register a new user
   */
  static async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const result = await convex.action(api.auth.mutations.register, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.email,
        email: userData.email,
        password: userData.password,
        roles: ["STUDENT"],
      }) as ConvexAuthResponse;

      if (!isValidUser(result.user)) {
        return {
          success: false,
          message: t("server_error"),
        };
      }

      const user = result.user;
      const token = result.token;

      SessionManager.setupSession(user, token, true);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      console.error("[AuthService] Registration failed:", error);
      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }
}
