import { ofetch } from "ofetch";
import type { FetchOptions } from "ofetch";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface RequestOptions {
  headers?: Record<string, string>;
}

export const httpClient = ofetch.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  onRequest({ options }) {
    const token = localStorage.getItem("auth_token");
    if (token) {
      options.headers = options.headers || {};
      (options.headers as any).Authorization = `Bearer ${token}`;
    }
  },
  onResponseError({ response }) {
    if (response?.status === 401) {
      localStorage.removeItem("auth_token");
    }
  },
});

export const authClient = {
  login: (credentials: {
    username: string;
    password: string;
    remember?: boolean;
  }) => {
    return httpClient("/auth/login", {
      method: "POST",
      body: credentials,
    });
  },

  validateToken: (token: string) => {
    return httpClient("/auth/validate-token", {
      method: "POST",
      body: { token },
    });
  },

  register: (userData: {
    firstName: string;
    lastName: string;
    middleName?: string;
    iin: string;
    email: string;
    password: string;
  }) => {
    return httpClient("/auth/register", {
      method: "POST",
      body: userData,
    });
  },
};
