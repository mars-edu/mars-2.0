import prisma from "../utils/prismaClient.js";
import { compareSync, hashSync } from "bcryptjs";
import { sign, verify, SignOptions } from "jsonwebtoken";
import env, { getEnv, Env } from "../utils/env.js";
import { Role, User, UserRole } from "@prisma/client";

const SALT_ROUNDS = 10;

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

class AuthService {
  async login(credentials: LoginCredentials) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: credentials.username },
        include: { userRoles: true },
      });

      if (!user) {
        return {
          success: false,
          message: "Неверное имя пользователя или пароль",
        };
      }

      const isPasswordValid = this.validatePassword(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        return {
          success: false,
          message: "Неверное имя пользователя или пароль",
        };
      }

      const token = this.generateToken({
        userId: user.id,
        email: user.email,
      });

      const roles = user.userRoles.map((ur) => ur.role);

      const { password, ...userBasicInfo } = user;

      return {
        success: true,
        user: {
          ...userBasicInfo,
          roles,
        },
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Произошла ошибка при входе. Попробуйте позже.",
      };
    }
  }

  async validateToken(token: string) {
    try {
      const jwtSecret = env.JWT_SECRET;
      const decoded = verify(token, jwtSecret) as TokenPayload;

      if (!decoded || !decoded.userId) {
        return {
          success: false,
          message: "Invalid or expired token",
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { userRoles: true },
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const roles = user.userRoles.map((ur) => ur.role);

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
        message: "Произошла ошибка при проверке сессии",
      };
    }
  }

  private generateToken(payload: TokenPayload): string {
    const jwtSecret = env.JWT_SECRET;
    const options: SignOptions = {
      algorithm: "HS256",
      expiresIn: "24h",
    };
    return sign(payload, jwtSecret, options);
  }

  hashPassword(password: string): string {
    return hashSync(password, SALT_ROUNDS);
  }

  validatePassword(password: string, hash: string): boolean {
    return compareSync(password, hash);
  }
}

export default new AuthService();
