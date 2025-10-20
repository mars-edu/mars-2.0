import { useUserStore } from "../stores/userStore";
import { Role, type User } from "../types/user";
import { authClient } from "../lib/http-client";

console.log("[AuthService] Service module loaded");

interface LoginCredentials {
  username: string;
  password: string;
  remember?: boolean;
}

interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export default class AuthService {
  /**
   * Authenticate user with provided credentials
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    console.log("[AuthService] Login attempt initiated");
    console.log("[AuthService] Login credentials:", {
      username: credentials.username,
      password: credentials.password ? "[HIDDEN]" : "",
      remember: credentials.remember,
    });

    try {
      console.log("[AuthService] Calling authClient.login");
      const response = await authClient.login(credentials);
      console.log("[AuthService] Auth client response received:", {
        success: response.success,
        hasUser: !!response.user,
        hasToken: !!response.token,
      });

      if (response.success && response.user) {
        console.log("[AuthService] Login successful, setting up user session");
        const userStore = useUserStore();
        userStore.setUser(response.user);

        if (credentials.remember && response.token) {
          console.log("[AuthService] Remember me enabled, storing token");
          userStore.setToken(response.token);
          localStorage.setItem("auth_token", response.token);
        } else {
          console.log(
            "[AuthService] Remember me disabled or no token provided"
          );
        }
      } else {
        console.log("[AuthService] Login failed or no user data received");
      }

      console.log("[AuthService] Returning login response");
      return response;
    } catch (error) {
      console.error("[AuthService] Login error occurred:", error);
      return {
        success: false,
        message: "Произошла ошибка при входе. Попробуйте позже.",
      };
    }
  }

  /**
   * Validate stored token and load user data
   */
  static async validateToken(token: string): Promise<LoginResponse> {
    console.log("[AuthService] Token validation initiated");
    console.log("[AuthService] Token length:", token.length);

    try {
      console.log("[AuthService] Calling authClient.validateToken");
      const response = await authClient.validateToken(token);
      console.log("[AuthService] Token validation response:", {
        success: response.success,
        hasUser: !!response.user,
        hasToken: !!response.token,
      });

      if (response.success && response.user) {
        console.log("[AuthService] Token is valid, user data received");
      } else {
        console.log("[AuthService] Token validation failed");
      }

      return response;
    } catch (error) {
      console.error("[AuthService] Token validation error:", error);
      return {
        success: false,
        message: "Произошла ошибка при проверке сессии",
      };
    }
  }

  /**
   * Logout the current user
   */
  static logout(): void {
    console.log("[AuthService] Logout initiated");
    localStorage.removeItem("auth_token");
    const userStore = useUserStore();
    userStore.logout();
    console.log("[AuthService] Logout completed");
  }
}
