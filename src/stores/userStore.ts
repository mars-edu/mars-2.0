import { defineStore } from "pinia";
import AuthService from "../services/auth";
import { computed, ref } from "vue";
import type { User } from "../types/user";
import { Role } from "../types/user";
import { f7 } from "framework7-vue";
import { convex } from "../lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

console.log("[UserStore] Store definition initiated");

let userLiveUnsub: (() => void) | null = null;

function decodeTokenPayload(tokenStr: string): {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  exp?: number;
} | null {
  try {
    const parts = tokenStr.split(".");
    if (parts.length !== 3) return null;
    
    // Base64Url decode with unicode support
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const payload = JSON.parse(jsonStr);

    if (!payload.userId || !Array.isArray(payload.roles)) return null;
    return {
      id: payload.userId,
      username: payload.username || "",
      firstName: payload.firstName || "",
      lastName: payload.lastName || "",
      roles: payload.roles as Role[],
      exp: payload.exp,
    };
  } catch (err) {
    console.error("[UserStore] Error decoding token payload:", err);
    return null;
  }
}

export const useUserStore = defineStore(
  "user",
  () => {
    console.log("[UserStore] Store instance created");

    const currentUser = ref<User | null>(null);
    const isAuthenticated = ref(false);
    const token = ref<string | null>(null);

    console.log("[UserStore] Initial state:", {
      currentUser: currentUser.value,
      isAuthenticated: isAuthenticated.value,
      token: token.value ? "[HIDDEN]" : null,
    });

    // Multi-tab logout & session synchronization
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (event) => {
        if (event.key === "auth_token") {
          if (!event.newValue) {
            console.log("[UserStore] auth_token cleared in another tab, syncing logout");
            logout();
            if (typeof f7 !== 'undefined' && f7?.views?.main?.router) {
              f7.views.main.router.navigate("/login/");
            }
          } else if (event.newValue !== token.value) {
            console.log("[UserStore] auth_token updated in another tab, syncing session");
            initialize();
          }
        }
      });
    }

    const hasRole = (role: Role) => {
      return currentUser.value?.roles.includes(role) || false;
    };

    const hasAnyRole = (roles: Role[]) => {
      return (
        currentUser.value?.roles.some((role) => roles.includes(role)) || false
      );
    };

    const fullName = computed((): string => {
      if (!currentUser.value) return "";
      return `${currentUser.value.firstName} ${currentUser.value.lastName}`;
    });

    const isAdmin = computed((): boolean => {
      return currentUser.value?.roles.includes(Role.ADMIN) || false;
    });

    const isTeacher = computed((): boolean => {
      return currentUser.value?.roles.includes(Role.TEACHER) || false;
    });

    const isStudent = computed((): boolean => {
      return currentUser.value?.roles.includes(Role.STUDENT) || false;
    });

    const isParent = computed((): boolean => {
      return currentUser.value?.roles.includes(Role.PARENT) || false;
    });

    function startLiveUserSubscription(userId: string) {
      if (userLiveUnsub) {
        userLiveUnsub();
        userLiveUnsub = null;
      }

      try {
        userLiveUnsub = convex.onUpdate(
          api.auth.queries.getUser,
          { userId: userId as Id<"users"> },
          (dbUser) => {
            if (dbUser && currentUser.value && currentUser.value.id === userId) {
              console.log("[UserStore] Live user data updated from Convex:", dbUser.roles);
              currentUser.value = {
                ...currentUser.value,
                firstName: dbUser.firstName,
                lastName: dbUser.lastName,
                middleName: dbUser.middleName,
                username: dbUser.username,
                email: dbUser.email,
                roles: dbUser.roles as Role[],
                avatar: dbUser.avatar,
                theme: dbUser.theme,
                locale: dbUser.locale,
                phone: dbUser.phone,
                office: dbUser.office,
                department: dbUser.department,
                degree: dbUser.degree,
              };
              localStorage.setItem("stored_user", JSON.stringify(currentUser.value));
            }
          }
        );
      } catch (err) {
        console.warn("[UserStore] Failed to establish live user subscription:", err);
      }
    }

    function setUser(user: User) {
      console.log("[UserStore] Setting user:", {
        userId: user.id,
        userRoles: user.roles,
      });
      currentUser.value = user;
      isAuthenticated.value = true;
      startLiveUserSubscription(user.id);
      console.log(
        "[UserStore] User set successfully, authentication state updated"
      );
    }

    function setToken(tokenValue: string) {
      console.log("[UserStore] Setting token");
      token.value = tokenValue;
      localStorage.setItem("auth_token", tokenValue);
      console.log("[UserStore] Token stored in localStorage");
    }

    function logout() {
      console.log("[UserStore] Logging out user");
      if (userLiveUnsub) {
        userLiveUnsub();
        userLiveUnsub = null;
      }

      const previousUser = currentUser.value;
      const previousAuthState = isAuthenticated.value;

      currentUser.value = null;
      isAuthenticated.value = false;
      token.value = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("stored_user");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("stored_user");

      console.log("[UserStore] Logout completed:", {
        previousUser: previousUser
          ? { id: previousUser.id, roles: previousUser.roles }
          : null,
        previousAuthState,
        currentAuthState: isAuthenticated.value,
      });
    }

    async function initialize() {
      console.log("[UserStore] Initializing user store");
      const storedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

      if (!storedToken) {
        console.log("[UserStore] No stored token found");
        return;
      }

      token.value = storedToken;

      // 1. Synchronously decode token payload for instant 0ms state
      const decoded = decodeTokenPayload(storedToken);
      if (!decoded) {
        console.log("[UserStore] Failed to decode token, logging out");
        logout();
        if (typeof f7 !== 'undefined' && f7?.views?.main?.router) {
          f7.views.main.router.navigate("/login/");
        }
        return;
      }

      // Check token expiration
      if (decoded.exp && Math.floor(Date.now() / 1000) >= decoded.exp) {
        console.log("[UserStore] Stored token is expired, logging out");
        logout();
        if (typeof f7 !== 'undefined' && f7?.views?.main?.router) {
          f7.views.main.router.navigate("/login/");
        }
        return;
      }

      // Set instantaneous synchronous user from JWT claims (0ms latency)
      currentUser.value = {
        id: decoded.id,
        username: decoded.username,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        email: "",
        roles: decoded.roles,
      };
      isAuthenticated.value = true;

      // 2. Restore full profile from cache if present
      const storedUser = localStorage.getItem("stored_user") || sessionStorage.getItem("stored_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user?.id && Array.isArray(user?.roles)) {
            console.log("[UserStore] Restored rich user profile from cache");
            currentUser.value = {
              ...currentUser.value,
              ...user,
            };
          }
        } catch {
          // ignore malformed cache
        }
      }

      // 3. Connect live Convex subscription for realtime role & profile updates
      startLiveUserSubscription(decoded.id);

      console.log("[UserStore] Initialization completed, validating token in background");
      // 4. Background validation — does not block render
      validateTokenInBackground(storedToken);
    }

    async function validateTokenInBackground(storedToken: string) {
      try {
        const response = await AuthService.validateToken(storedToken);
        if (response.success && response.user) {
          setUser(response.user);
          localStorage.setItem("stored_user", JSON.stringify(response.user));
        } else if (response.isExplicitInvalid) {
          console.log("[UserStore] Token is explicitly invalid on backend, logging out");
          logout();
          if (typeof f7 !== 'undefined' && f7?.views?.main?.router) {
            f7.views.main.router.navigate("/login/");
          }
        } else {
          // Network or server reconnection glitch — keep session intact!
          console.log("[UserStore] Background validation transient error, preserving active session");
        }
      } catch {
        // Network error: keep existing auth state, don't log out
        console.log("[UserStore] Background validation network error, keeping session");
      }
    }

    function updateRoles(roles: Role[]) {
      console.log("[UserStore] Updating user roles:", {
        oldRoles: currentUser.value?.roles,
        newRoles: roles,
      });
      if (currentUser.value) {
        currentUser.value.roles = roles;
        console.log("[UserStore] Roles updated successfully");
      } else {
        console.log("[UserStore] Cannot update roles - no current user");
      }
    }

    function addRole(role: Role) {
      console.log("[UserStore] Adding role:", role);
      if (currentUser.value && !currentUser.value.roles.includes(role)) {
        currentUser.value.roles.push(role);
        console.log("[UserStore] Role added successfully");
      } else {
        console.log(
          "[UserStore] Role not added - user not authenticated or role already exists"
        );
      }
    }

    function removeRole(role: Role) {
      console.log("[UserStore] Removing role:", role);
      if (currentUser.value) {
        const oldRoles = [...currentUser.value.roles];
        currentUser.value.roles = currentUser.value.roles.filter(
          (r) => r !== role
        );
        console.log("[UserStore] Role removed successfully:", {
          oldRoles,
          newRoles: currentUser.value.roles,
        });
      } else {
        console.log("[UserStore] Cannot remove role - no current user");
      }
    }

    function reset() {
      console.log("[UserStore] Resetting store");
      const previousState = {
        currentUser: currentUser.value,
        isAuthenticated: isAuthenticated.value,
        token: token.value ? "[HIDDEN]" : null,
      };

      currentUser.value = null;
      isAuthenticated.value = false;
      token.value = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("stored_user");

      console.log("[UserStore] Store reset completed:", {
        previousState,
        currentState: {
          currentUser: null,
          isAuthenticated: false,
          token: null,
        },
      });
    }

    return {
      currentUser,
      isAuthenticated,
      token,
      hasRole,
      hasAnyRole,
      fullName,
      isAdmin,
      isTeacher,
      isStudent,
      isParent,
      setUser,
      setToken,
      logout,
      initialize,
      validateTokenInBackground,
      updateRoles,
      addRole,
      removeRole,
      reset,
    };
  },
  {}
);
