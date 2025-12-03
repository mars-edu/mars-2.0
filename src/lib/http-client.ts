import { ofetch } from "ofetch";
import { API_URL } from "./config";
import { getAuthHeaders } from "./auth";

export const httpClient = ofetch.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45 * 1000,
  credentials: "include",
  onRequest({ options }) {
    const authHeaders = getAuthHeaders();
    const headers = new Headers(options.headers);
    
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    options.headers = headers;

    if (options.body && options.body instanceof FormData) {
      const headers = new Headers(options.headers);
      headers.delete("Content-Type");
      options.headers = headers;
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
