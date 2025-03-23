import prisma from "../utils/prisma.js";
import { compareSync, hashSync } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import env from "../utils/env.js";

const SALT_ROUNDS = 10;

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

interface UserRoleData {
  role: string;
}

class AuthService {
  async login(credentials: LoginCredentials) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: credentials.username },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          password: true,
          userRoles: {
            select: {
              role: true,
            },
          },
        },
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

      const roles = user.userRoles.map((ur: UserRoleData) => ur.role);

      const { password, userRoles, ...userBasicInfo } = user;

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
      const decoded = verify(token, env.JWT_SECRET) as TokenPayload;

      if (!decoded || !decoded.userId) {
        return {
          success: false,
          message: "Invalid or expired token",
        };
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userRoles: {
            select: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const roles = user.userRoles.map((ur: UserRoleData) => ur.role);

      const { userRoles, ...userBasicInfo } = user;

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
    return sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
  }

  hashPassword(password: string): string {
    return hashSync(password, SALT_ROUNDS);
  }

  validatePassword(password: string, hash: string): boolean {
    return compareSync(password, hash);
  }
}

export default new AuthService();
