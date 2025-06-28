import { defineStore } from "pinia";
import AuthService from "../services/auth";
import { computed, ref } from "vue";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  avatar?: string;
}

export enum Role {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}

export interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export const useUserStore = defineStore(
  "user",
  () => {
    // state
    const currentUser = ref<User | null>(null);
    const isAuthenticated = ref(false);
    const token = ref<string | null>(null);

    // getters
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

    // actions
    function setUser(user: User) {
      currentUser.value = user;
      isAuthenticated.value = true;
    }

    function setToken(tokenValue: string) {
      token.value = tokenValue;
      localStorage.setItem("auth_token", tokenValue);
    }

    function logout() {
      currentUser.value = null;
      isAuthenticated.value = false;
      token.value = null;
      localStorage.removeItem("auth_token");
    }

    async function initialize() {
      const storedToken = localStorage.getItem("auth_token");
      if (storedToken) {
        token.value = storedToken;

        try {
          const response = await AuthService.validateToken(storedToken);

          if (response.success && response.user) {
            setUser(response.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error("Failed to initialize user session:", error);
          logout();
        }
      }
    }

    function updateRoles(roles: Role[]) {
      if (currentUser.value) {
        currentUser.value.roles = roles;
      }
    }

    function addRole(role: Role) {
      if (currentUser.value && !currentUser.value.roles.includes(role)) {
        currentUser.value.roles.push(role);
      }
    }

    function removeRole(role: Role) {
      if (currentUser.value) {
        currentUser.value.roles = currentUser.value.roles.filter(
          (r) => r !== role
        );
      }
    }

    function reset() {
      currentUser.value = null;
      isAuthenticated.value = false;
      token.value = null;
      localStorage.removeItem("auth_token");
    }

    return {
      // state
      currentUser,
      isAuthenticated,
      token,

      // getters
      hasRole,
      hasAnyRole,
      fullName,
      isAdmin,
      isTeacher,
      isStudent,
      isParent,

      // actions
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
