import { defineStore } from "pinia";
import AuthService from "../services/auth";
import { computed, ref } from "vue";
import type { User, UserState } from "../types/user";
import { Role } from "../types/user";

console.log("[UserStore] Store definition initiated");

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

    const hasRole = (role: Role) => {
      const result = currentUser.value?.roles.includes(role) || false;
      console.log("[UserStore] Checking role:", {
        role,
        hasRole: result,
        userRoles: currentUser.value?.roles,
      });
      return result;
    };

    const hasAnyRole = (roles: Role[]) => {
      const result =
        currentUser.value?.roles.some((role) => roles.includes(role)) || false;
      console.log("[UserStore] Checking any role:", {
        roles,
        hasAnyRole: result,
        userRoles: currentUser.value?.roles,
      });
      return result;
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

    function setUser(user: User) {
      console.log("[UserStore] Setting user:", {
        userId: user.id,
        userRoles: user.roles,
      });
      currentUser.value = user;
      isAuthenticated.value = true;
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
      const previousUser = currentUser.value;
      const previousAuthState = isAuthenticated.value;

      currentUser.value = null;
      isAuthenticated.value = false;
      token.value = null;
      localStorage.removeItem("auth_token");

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
      const storedToken = localStorage.getItem("auth_token");

      if (storedToken) {
        console.log("[UserStore] Found stored token, validating");
        token.value = storedToken;
        try {
          const response = await AuthService.validateToken(storedToken);
          console.log("[UserStore] Token validation response:", {
            success: response.success,
            hasUser: !!response.user,
          });

          if (response.success && response.user) {
            console.log("[UserStore] Token valid, setting user");
            setUser(response.user);
          } else {
            console.log("[UserStore] Token invalid, logging out");
            logout();
          }
        } catch (error) {
          console.error("[UserStore] Token validation error:", error);
          logout();
        }
      } else {
        console.log("[UserStore] No stored token found");
      }

      console.log("[UserStore] Initialization completed");
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
      updateRoles,
      addRole,
      removeRole,
      reset,
    };
  },
  {
    serverSync: {
      enabled: false,
    },
  }
);
