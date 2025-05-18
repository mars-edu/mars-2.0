import { defineStore } from "pinia";
import AuthService from "../services/auth";


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

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    currentUser: null,
    isAuthenticated: false,
    token: null,
  }),

  getters: {
    hasRole: (state) => (role: Role) => {
      return state.currentUser?.roles.includes(role) || false;
    },

    hasAnyRole: (state) => (roles: Role[]) => {
      return (
        state.currentUser?.roles.some((role) => roles.includes(role)) || false
      );
    },

    fullName: (state): string => {
      if (!state.currentUser) return "";
      return `${state.currentUser.firstName} ${state.currentUser.lastName}`;
    },

    isAdmin: (state): boolean => {
      return state.currentUser?.roles.includes(Role.ADMIN) || false;
    },

    isTeacher: (state): boolean => {
      return state.currentUser?.roles.includes(Role.TEACHER) || false;
    },

    isStudent: (state): boolean => {
      return state.currentUser?.roles.includes(Role.STUDENT) || false;
    },

    isParent: (state): boolean => {
      return state.currentUser?.roles.includes(Role.PARENT) || false;
    },
  },

  actions: {
    setUser(user: User) {
      this.currentUser = user;
      this.isAuthenticated = true;
    },

    setToken(token: string) {
      this.token = token;
      localStorage.setItem("auth_token", token);
    },

    logout() {
      this.currentUser = null;
      this.isAuthenticated = false;
      this.token = null;
      localStorage.removeItem("auth_token");
    },

    async initialize() {
      const token = localStorage.getItem("auth_token");
      if (token) {
        this.token = token;

        try {
          const response = await AuthService.validateToken(token);

          if (response.success && response.user) {
            this.setUser(response.user);
          } else {
            this.logout();
          }
        } catch (error) {
          console.error("Failed to initialize user session:", error);
          this.logout();
        }
      }
    },

    // Example method to update user roles
    updateRoles(roles: Role[]) {
      if (this.currentUser) {
        this.currentUser.roles = roles;
      }
    },

    // Add a single role to the user
    addRole(role: Role) {
      if (this.currentUser && !this.currentUser.roles.includes(role)) {
        this.currentUser.roles.push(role);
      }
    },

    // Remove a single role from the user
    removeRole(role: Role) {
      if (this.currentUser) {
        this.currentUser.roles = this.currentUser.roles.filter(
          (r) => r !== role
        );
      }
    },
  },
});
