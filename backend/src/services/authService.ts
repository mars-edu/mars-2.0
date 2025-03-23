import dbService from "../utils/prisma.js";
import { compareSync, hashSync } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import env, { getEnv } from "../utils/env.js";

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
      const db = dbService.getDatabase();

      // Query to get user with email
      const { results: userResults } = await db
        .prepare(
          `SELECT id, firstName, lastName, email, password 
         FROM User WHERE email = ?`
        )
        .bind(credentials.username)
        .all();

      if (!userResults || userResults.length === 0) {
        return {
          success: false,
          message: "Неверное имя пользователя или пароль",
        };
      }

      const user = userResults[0];

      // Get user roles
      const { results: roleResults } = await db
        .prepare(`SELECT role FROM UserRole WHERE userId = ?`)
        .bind(user.id)
        .all();

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

      const roles = roleResults.map((ur: UserRoleData) => ur.role);

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
      // Get environment from context if available, otherwise use the default env
      const currentEnv = dbService.getEnv() || env;
      const decoded = verify(token, currentEnv.JWT_SECRET) as TokenPayload;

      if (!decoded || !decoded.userId) {
        return {
          success: false,
          message: "Invalid or expired token",
        };
      }

      const db = dbService.getDatabase();

      // Query to get user by ID
      const { results: userResults } = await db
        .prepare(
          `SELECT id, firstName, lastName, email 
         FROM User WHERE id = ?`
        )
        .bind(decoded.userId)
        .all();

      if (!userResults || userResults.length === 0) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const user = userResults[0];

      // Get user roles
      const { results: roleResults } = await db
        .prepare(`SELECT role FROM UserRole WHERE userId = ?`)
        .bind(user.id)
        .all();

      const roles = roleResults.map((ur: UserRoleData) => ur.role);

      return {
        success: true,
        user: {
          ...user,
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
    // Get environment from context if available, otherwise use the default env
    const currentEnv = dbService.getEnv() || env;
    return sign(payload, currentEnv.JWT_SECRET, {
      expiresIn: currentEnv.JWT_EXPIRY,
    });
  }

  hashPassword(password: string): string {
    return hashSync(password, SALT_ROUNDS);
  }

  validatePassword(password: string, hash: string): boolean {
    return compareSync(password, hash);
  }
}

export default new AuthService();
