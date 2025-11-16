import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { TRPCError } from "@trpc/server";
import AuthService from "../../services/authService.js";
import * as m from "../../paraglide/messages.js";
import { handleServiceError, extractBearerToken } from "../utils/errors.js";

/**
 * Input validation schemas for auth operations
 * Using z.lazy() with factory functions to ensure messages are evaluated at request time
 * after i18n middleware has set the locale.
 */

const createLoginSchema = () => z.lazy(() =>
  z.object({
    username: z.string().min(1, { message: m.auth_username_required() }),
    password: z.string().min(1, { message: m.auth_password_required() }),
    remember: z.boolean().optional(),
  })
);

const createRegisterSchema = () => z.lazy(() =>
  z.object({
    firstName: z.string().min(1, { message: m.auth_firstname_required() }),
    lastName: z.string().min(1, { message: m.auth_lastname_required() }),
    middleName: z.string().optional(),
    iin: z.string().optional(),
    password: z.string().min(6, { message: m.auth_password_min_length({ minLength: "6" }) }),
    email: z.string().email({ message: m.auth_email_invalid() }),
  })
);

const createValidateTokenSchema = () => z.lazy(() =>
  z.object({
    token: z.string().min(1, { message: m.auth_token_required() }),
  })
);

// Base schemas without custom messages for input type inference
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
  remember: z.boolean().optional(),
});

const registerSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().optional(),
  iin: z.string().optional(),
  password: z.string(),
  email: z.string(),
});

const validateTokenSchema = z.object({
  token: z.string(),
});

/**
 * Auth tRPC router
 * Handles authentication operations (login, register, validate, logout)
 */
export const authRouter = router({
  /**
   * Login with username and password
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate with localized messages after i18n middleware has run
      const validationResult = createLoginSchema().safeParse(input);
      if (!validationResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: JSON.stringify(validationResult.error.issues),
        });
      }

      const authService = new AuthService(ctx.c);
      const result = await authService.login({
        username: input.username,
        password: input.password,
      });

      handleServiceError(result, "UNAUTHORIZED", m.auth_invalid_credentials());

      return {
        success: true,
        token: result.token!,
        user: result.user!,
      };
    }),

  /**
   * Register a new user
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate with localized messages after i18n middleware has run
      const validationResult = createRegisterSchema().safeParse(input);
      if (!validationResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: JSON.stringify(validationResult.error.issues),
        });
      }

      const authService = new AuthService(ctx.c);
      const result = await authService.register({
        firstName: input.firstName,
        lastName: input.lastName,
        middleName: input.middleName,
        iin: input.iin,
        password: input.password,
        email: input.email,
      });

      handleServiceError(result, "BAD_REQUEST", m.auth_registration_error());

      return {
        success: true,
        token: result.token!,
        user: result.user!,
      };
    }),

  /**
   * Validate a JWT token and return user info
   */
  validateToken: publicProcedure
    .input(validateTokenSchema)
    .query(async ({ ctx, input }) => {
      // Validate with localized messages after i18n middleware has run
      const validationResult = createValidateTokenSchema().safeParse(input);
      if (!validationResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: JSON.stringify(validationResult.error.issues),
        });
      }

      const authService = new AuthService(ctx.c);
      const result = await authService.validateToken(input.token);

      handleServiceError(result, "UNAUTHORIZED", m.auth_token_invalid());

      return {
        success: true,
        user: result.user!,
      };
    }),

  /**
   * Get current user info (requires authentication)
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const authService = new AuthService(ctx.c);
    const authHeader = ctx.c.req.header("Authorization");
    const token = extractBearerToken(authHeader, m.auth_no_token());

    const result = await authService.validateToken(token);
    handleServiceError(result, "UNAUTHORIZED", m.auth_token_invalid());

    return {
      success: true,
      user: result.user!,
    };
  }),

  /**
   * Logout (client-side only, no server action needed)
   */
  logout: publicProcedure.mutation(async () => {
    // In a JWT-based auth system, logout is typically handled client-side
    // by removing the token from storage
    return {
      success: true,
      message: "Logged out successfully",
    };
  }),
});
