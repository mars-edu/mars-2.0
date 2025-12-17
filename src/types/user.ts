export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  avatar?: string;
  theme?: "light" | "dark" | "lavanda";
  username?: string;
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
