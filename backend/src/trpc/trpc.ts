import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { Env } from "../types/env.js";
import jwt from "jsonwebtoken";
import superjson from "superjson";
import { setLocale, getLocale, locales } from "../paraglide/runtime.js";

/**
 * Context type for all tRPC procedures
 * Includes Prisma client, authenticated user ID, and Hono context
 */
export interface TRPCContext extends Record<string, unknown> {
  prisma: PrismaClient;
  userId?: string;
  c: Context<{ Bindings: Env }>;
}

/**
 * Initialize tRPC with context
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

/**
 * Middleware to set locale from request headers
 */
const i18nMiddleware = t.middleware(async ({ ctx, next }) => {
  // Check for custom language header first
  const customLang = ctx.c.req.header("X-Language") || ctx.c.req.header("x-language");
  
  if (customLang && locales.includes(customLang as any)) {
    setLocale(customLang as any);
  } else {
    // Fall back to Accept-Language header
    const acceptLanguage = ctx.c.req.header("Accept-Language");
    
    if (acceptLanguage) {
      const preferredLang = parseAcceptLanguage(acceptLanguage);
      if (preferredLang && locales.includes(preferredLang as any)) {
        setLocale(preferredLang as any);
      }
    }
  }
  
  // Default to 'en' if no valid language found
  const currentLocale = getLocale();
  if (!locales.includes(currentLocale as any)) {
    setLocale("en");
  }

  return next();
});

/**
 * Parse Accept-Language header to get the best matching language
 */
function parseAcceptLanguage(header: string): string | null {
  const languages = header
    .split(",")
    .map((lang) => {
      const parts = lang.trim().split(";");
      const code = parts[0].split("-")[0];
      const quality = parts[1] ? parseFloat(parts[1].split("=")[1]) : 1.0;
      return { code, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const lang of languages) {
    if (locales.includes(lang.code as any)) {
      return lang.code;
    }
  }

  return null;
}

/**
 * Export reusable router and procedure builders
 */
export const router = t.router;

// Base procedure with i18n middleware
const baseProcedure = t.procedure.use(i18nMiddleware);

// Public procedure with i18n
export const publicProcedure = baseProcedure;

/**
 * Protected procedure requiring authentication
 * Throws UNAUTHORIZED error if no valid user session
 */
export const protectedProcedure = baseProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // Type-safe user ID
    },
  });
});

/**
 * Create tRPC context from Hono context
 * Extracts JWT token from Authorization header and validates it
 */
export const createContext = async (
  _opts: any,
  c: Context<{ Bindings: Env }>
): Promise<TRPCContext> => {
  const adapter = new PrismaD1(c.env.DB);
  const prisma = new PrismaClient({ adapter });

  // Extract JWT token from Authorization header
  const authHeader = c.req.header("Authorization");
  let userId: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, c.env.JWT_SECRET) as {
        userId: string;
      };
      userId = decoded.userId;
    } catch (err) {
      // Token invalid or expired, userId remains undefined
      console.warn("[tRPC] Invalid JWT token:", err);
    }
  }

  return {
    prisma,
    userId,
    c,
  };
};
