import { useUserStore, Role } from "../stores/userStore";
import type { User } from "../stores/userStore";
import { authClient } from "../lib/http-client";

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
    try {
      const response = await authClient.login(credentials);

      if (response.success && response.user) {
        const userStore = useUserStore();
        userStore.setUser(response.user);

        if (credentials.remember && response.token) {
          userStore.setToken(response.token);
          localStorage.setItem("auth_token", response.token);
        }
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
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
    try {
      const response = await authClient.validateToken(token);
      return response;
    } catch (error) {
      console.error("Token validation error:", error);
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
    localStorage.removeItem("auth_token");
    const userStore = useUserStore();
    userStore.logout();
  }
}
