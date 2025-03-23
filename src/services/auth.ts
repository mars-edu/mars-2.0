import { useUserStore, Role } from "../stores/userStore";
import type { User } from "../stores/userStore";

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
  // API endpoint for authentication
  private static API_URL = "http://localhost:3001/api/auth";

  /**
   * Authenticate user with provided credentials
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Call the login API endpoint
      const response = await fetch(`${this.API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          remember: credentials.remember,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.user) {
        const userStore = useUserStore();
        userStore.setUser(data.user);

        if (credentials.remember && data.token) {
          userStore.setToken(data.token);
        }
      }

      return data;
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
      // Call the token validation API endpoint
      const response = await fetch(`${this.API_URL}/validate-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
        credentials: "include",
      });

      return await response.json();
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
    const userStore = useUserStore();
    userStore.logout();
  }
}
