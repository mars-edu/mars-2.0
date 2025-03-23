import { getPrismaClient } from "../utils/prismaClient.js";
import { compareSync, hashSync } from "bcryptjs";
import { sign, verify, SignOptions } from "jsonwebtoken";
import type { Context } from "hono";
import type { Env } from "../utils/env.js";
import type { User, UserRole } from "@prisma/client";

const SALT_ROUNDS = 10;

export interface LoginCredentials {
  username: string;
  password: string;
}

export const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

interface TokenPayload {
  userId: string;
  roles?: Role[];
}

class AuthService {
  private ctx: Context<{ Bindings: Env }>;
  private prisma: ReturnType<typeof getPrismaClient>;

  constructor(ctx: Context<{ Bindings: Env }>) {
    this.ctx = ctx;
    this.prisma = getPrismaClient(ctx.env);
  }

  async login(credentials: LoginCredentials) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.username },
        include: { userRoles: true },
      });

      if (!user) {
        return {
          success: false,
          message: "Invalid credentials",
        };
      }

      const isValidPassword = this.validatePassword(
        credentials.password,
        user.password
      );

      if (!isValidPassword) {
        return {
          success: false,
          message: "Invalid credentials",
        };
      }

      const roles = user.userRoles.map((ur: UserRole) => ur.role as Role);
      const { password, ...userBasicInfo } = user;

      const token = this.generateToken({
        userId: user.id,
        roles,
      });

      return {
        success: true,
        token,
        user: {
          ...userBasicInfo,
          roles,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "An error occurred during login",
      };
    }
  }

  async validateToken(token: string) {
    try {
      const decoded = verify(token, this.ctx.env.JWT_SECRET) as TokenPayload;

      if (!decoded || !decoded.userId) {
        return {
          success: false,
          message: "Invalid or expired token",
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { userRoles: true },
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const roles = user.userRoles.map((ur) => ur.role as Role);
      const { password, ...userBasicInfo } = user;

      return {
        success: true,
        user: {
          ...userBasicInfo,
          roles,
        },
      };
    } catch (error) {
      console.error("Token validation error:", error);
      return {
        success: false,
        message: "An error occurred while validating the session",
      };
    }
  }

  private generateToken(payload: TokenPayload): string {
    const options: SignOptions = {
      algorithm: "HS256",
      expiresIn: this.ctx.env.JWT_EXPIRY || ("24h" as any),
    };
    return sign(payload, this.ctx.env.JWT_SECRET, options);
  }

  hashPassword(password: string): string {
    return hashSync(password, SALT_ROUNDS);
  }

  validatePassword(password: string, hash: string): boolean {
    return compareSync(password, hash);
  }
}

export default AuthService;
