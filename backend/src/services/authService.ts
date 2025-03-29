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

export interface RegisterData {
  firstName: string;
  lastName: string;
  middleName?: string;
  iin: string;
  password: string;
  email: string;
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
      const lowercaseUsername = credentials.username.toLowerCase();
      const user = await this.prisma.user.findFirst({
        where: {
          username: {
            equals: lowercaseUsername,
          },
        },
      });

      if (!user) {
        return {
          success: false,
          message: "Invalid credentials",
        };
      }

      const foundUser = user as User;

      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: foundUser.id },
      });

      const isValidPassword = this.validatePassword(
        credentials.password,
        foundUser.password
      );

      if (!isValidPassword) {
        return {
          success: false,
          message: "Invalid credentials",
        };
      }

      const roles = userRoles.map((ur) => ur.role as Role);
      const { password, ...userBasicInfo } = foundUser;

      const token = this.generateToken({
        userId: foundUser.id,
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
      return {
        success: false,
        message: "An error occurred during login",
      };
    }
  }

  async register(data: RegisterData) {
    try {
      const username = `${data.lastName} ${data.firstName}`;
      // const baseUsername = this.generateBaseUsername(
      //   data.lastName,
      //   data.firstName
      // );
      // const username = await this.generateUniqueUsername(baseUsername);

      const hashedPassword = this.hashPassword(data.password);

      const user = await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          username,
          email: data.email,
          password: hashedPassword,
        },
      });

      const token = this.generateToken({
        userId: user.id,
      });

      const { password, ...userBasicInfo } = user;

      return {
        success: true,
        token,
        user: {
          ...userBasicInfo,
          roles: [],
        },
      };
    } catch (error) {
      return {
        success: false,
        message: "An error occurred during registration",
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

  private generateBaseUsername(lastName: string, firstName: string): string {
    const transliterateToLatin = (text: string) => {
      const transliterationMap: Record<string, string> = {
        Ә: "A",
        ә: "a",
        Ғ: "Gh",
        ғ: "gh",
        Қ: "Q",
        қ: "q",
        Ң: "Ng",
        ң: "ng",
        Ө: "O",
        ө: "o",
        Ұ: "U",
        ұ: "u",
        Ү: "U",
        ү: "u",
        Һ: "H",
        һ: "h",
        І: "I",
        і: "i",
        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        е: "e",
        ё: "e",
        ж: "zh",
        з: "z",
        и: "i",
        й: "y",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "kh",
        ц: "ts",
        ч: "ch",
        ш: "sh",
        щ: "shch",
        ъ: "",
        ы: "y",
        ь: "",
        э: "e",
        ю: "yu",
        я: "ya",
        А: "A",
        Б: "B",
        В: "V",
        Г: "G",
        Д: "D",
        Е: "E",
        Ё: "E",
        Ж: "Zh",
        З: "Z",
        И: "I",
        Й: "Y",
        К: "K",
        Л: "L",
        М: "M",
        Н: "N",
        О: "O",
        П: "P",
        Р: "R",
        С: "S",
        Т: "T",
        У: "U",
        Ф: "F",
        Х: "Kh",
        Ц: "Ts",
        Ч: "Ch",
        Ш: "Sh",
        Щ: "Shch",
        Ъ: "",
        Ы: "Y",
        Ь: "",
        Э: "E",
        Ю: "Yu",
        Я: "Ya",
      };

      return text
        .split("")
        .map((char) => transliterationMap[char] || char)
        .join("");
    };

    const cleanLastName = transliterateToLatin(lastName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const cleanFirstName = transliterateToLatin(firstName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return `${cleanLastName}${cleanFirstName}`;
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: "insensitive",
          },
        },
      });

      if (!existingUser) {
        isUnique = true;
      } else {
        username = `${baseUsername}${counter}`;
        counter++;
      }
    }

    return username;
  }

  async usernameExists(username: string): Promise<boolean> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    return !!existingUser;
  }
}

export default AuthService;
