import type { Theme } from "./theme";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  roles: Role[];
  avatar?: string;
  theme?: Theme;
  username?: string;
  phone?: string;
  office?: string;
  department?: string;
  degree?: string;
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
