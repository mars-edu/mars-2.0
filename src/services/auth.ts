import { useUserStore } from "../stores/userStore";
import { Role, type User } from "../types/user";
import { trpcClient } from "../lib/trpcClient";

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
      console.log("[AuthService] Calling trpcClient.auth.login");
      const response = await trpcClient.auth.login.mutate({
        username: credentials.username,
        password: credentials.password,
        remember: credentials.remember,
      });
      
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
    } catch (error: any) {
      console.error("[AuthService] Login error occurred:", error);
      return {
        success: false,
        message: error?.message || "Произошла ошибка при входе. Попробуйте позже.",
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
      console.log("[AuthService] Calling trpcClient.auth.validateToken");
      const response = await trpcClient.auth.validateToken.query({ token });
      
      console.log("[AuthService] Token validation response:", {
        success: response.success,
        hasUser: !!response.user,
      });

      if (response.success && response.user) {
        console.log("[AuthService] Token is valid, user data received");
      } else {
        console.log("[AuthService] Token validation failed");
      }

      return response;
    } catch (error: any) {
      console.error("[AuthService] Token validation error:", error);
      return {
        success: false,
        message: error?.message || "Произошла ошибка при проверке сессии",
      };
    }
  }

  /**
   * Logout the current user
   */
  static async logout(): Promise<void> {
    console.log("[AuthService] Logout initiated");
    
    try {
      // Call tRPC logout (mostly for consistency, JWT logout is client-side)
      await trpcClient.auth.logout.mutate();
    } catch (error) {
      console.error("[AuthService] Logout error:", error);
    }
    
    localStorage.removeItem("auth_token");
    const userStore = useUserStore();
    userStore.logout();
    console.log("[AuthService] Logout completed");
  }

  /**
   * Register a new user
   */
  static async register(userData: {
    firstName: string;
    lastName: string;
    middleName?: string;
    iin?: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    console.log("[AuthService] Registration attempt initiated");

    try {
      console.log("[AuthService] Calling trpcClient.auth.register");
      const response = await trpcClient.auth.register.mutate(userData);
      
      console.log("[AuthService] Registration response received:", {
        success: response.success,
        hasUser: !!response.user,
        hasToken: !!response.token,
      });

      if (response.success && response.user && response.token) {
        console.log("[AuthService] Registration successful, setting up user session");
        const userStore = useUserStore();
        userStore.setUser(response.user);
        userStore.setToken(response.token);
        localStorage.setItem("auth_token", response.token);
      }

      return response;
    } catch (error: any) {
      console.error("[AuthService] Registration error occurred:", error);
      return {
        success: false,
        message: error?.message || "Произошла ошибка при регистрации. Попробуйте позже.",
      };
    }
  }
}
