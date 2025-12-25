import { mutation, action, internalMutation, internalQuery } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { createTimestamps } from "../lib/validators";
import { api, internal } from "../_generated/api";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  validateToken,
  generateUsername,
  generateRandomPassword,
} from "./helpers";

/**
 * Internal mutation to create a user (called from actions)
 */
export const createUserInternal = internalMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    username: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    roles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT")
      )
    ),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();
    const userId = await ctx.db.insert("users", {
      ...args,
      ...timestamps,
    });
    return userId;
  },
});

/**
 * Internal query to get user by username with password
 * Note: This is a query, not a mutation, so it can be called from actions
 */
export const getUserWithPasswordInternal = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

/**
 * Register a new user
 */
export const register = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    username: v.string(),
    email: v.string(),
    password: v.string(),
    roles: v.optional(
      v.array(
        v.union(
          v.literal("ADMIN"),
          v.literal("TEACHER"),
          v.literal("STUDENT"),
          v.literal("PARENT")
        )
      )
    ),
  },
  handler: async (ctx, args): Promise<{
    userId: string;
    token: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
      roles: string[];
      avatar?: string;
    };
  }> => {
    // Check if username is available
    const isUsernameAvailable = await ctx.runQuery(
      api.auth.queries.isUsernameAvailable,
      { username: args.username }
    );
    if (!isUsernameAvailable) {
      throw new ConvexError({ code: "auth_username_taken" });
    }

    // Check if email is available
    const isEmailAvailable = await ctx.runQuery(
      api.auth.queries.isEmailAvailable,
      { email: args.email }
    );
    if (!isEmailAvailable) {
      throw new ConvexError({ code: "auth_email_taken" });
    }

    // Hash password
    const passwordHash = hashPassword(args.password);

    // Create user
    const userId = await ctx.runMutation(internal.auth.mutations.createUserInternal, {
      firstName: args.firstName,
      lastName: args.lastName,
      username: args.username,
      email: args.email,
      passwordHash,
      roles: args.roles || ["STUDENT"],
    });

    // Generate token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ConvexError({ code: "server_error" });
    }

    const token = await generateToken(
      { userId: userId, roles: args.roles || ["STUDENT"] },
      jwtSecret
    );

    return {
      userId,
      token,
      user: {
        id: userId,
        firstName: args.firstName,
        lastName: args.lastName,
        username: args.username,
        email: args.email,
        roles: args.roles || ["STUDENT"],
        avatar: undefined,
      },
    };
  },
});

/**
 * Login with username and password
 */
export const login = action({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{
    token: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
      roles: string[];
      avatar?: string;
    };
  }> => {
    // Get user by username
    const user = await ctx.runQuery(
      internal.auth.mutations.getUserWithPasswordInternal,
      { username: args.username }
    );

    if (!user) {
      throw new ConvexError({ code: "auth_invalid_credentials" });
    }

    // Verify password
    const isValidPassword = verifyPassword(args.password, user.passwordHash);
    if (!isValidPassword) {
      throw new ConvexError({ code: "auth_invalid_credentials" });
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ConvexError({ code: "server_error" });
    }

    const token = await generateToken(
      { userId: user._id, roles: user.roles },
      jwtSecret
    );

    return {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        roles: user.roles,
        avatar: user.avatar,
      },
    };
  },
});

/**
 * Validate a JWT token
 */
export const validateTokenAction = action({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<{
    valid: boolean;
    userId: string | null;
    roles: string[];
    user: any;
  }> => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ConvexError({ code: "server_error" });
    }

    try {
      console.log("[validateTokenAction] Validating token...");
      const payload = await validateToken(args.token, jwtSecret);
      console.log("[validateTokenAction] Token payload:", payload);

      // Get user to ensure they still exist
      const user = await ctx.runQuery(api.auth.queries.getUser, {
        userId: payload.userId as any,
      });

      if (!user) {
        console.log("[validateTokenAction] User not found:", payload.userId);
        throw new ConvexError({ code: "auth_token_invalid" });
      }

      console.log("[validateTokenAction] Token valid, user found");
      return {
        valid: true,
        userId: payload.userId,
        roles: payload.roles,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          roles: user.roles,
          avatar: user.avatar,
        },
      };
    } catch (error) {
      console.log("[validateTokenAction] Token validation failed:", error);
      return {
        valid: false,
        userId: null,
        roles: [],
        user: null,
      };
    }
  },
});

/**
 * Register a teacher with auto-generated credentials
 */
export const registerTeacher = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    position: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    employmentYear: v.number(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    teacherId: string;
    userId: string;
    username: string;
    email: string;
    password: string;
  }> => {
    // Generate username
    let baseUsername = generateUsername(args.lastName, args.firstName);
    let username = baseUsername;
    let counter = 1;

    // Ensure unique username
    while (
      !(await ctx.runQuery(api.auth.queries.isUsernameAvailable, { username }))
    ) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate password
    const password = generateRandomPassword();
    const passwordHash = hashPassword(password);

    // Generate email
    const email = `${username}@iam-mars.kz`;

    // Create user
    const userId = await ctx.runMutation(internal.auth.mutations.createUserInternal, {
      firstName: args.firstName,
      lastName: args.lastName,
      username,
      email,
      passwordHash,
      roles: ["TEACHER"],
    });

    // Create teacher record
    const timestamps = createTimestamps();
    const teacherId = await ctx.runMutation(internal.teachers.mutations.createTeacherInternal, {
      firstName: args.firstName,
      surname: args.lastName,
      patronymic: args.middleName || "",
      position: args.position,
      employmentYear: args.employmentYear,
      gender: args.gender,
      userId,
      email,
      username,
      ...timestamps,
    });

    // Log initial password creation in history
    await ctx.runMutation(internal.passwordHistory.mutations.logPasswordChange, {
      userId,
      changeType: "initial",
      teacherId,
      notes: `Initial password created for new teacher account`,
    });

    return {
      success: true,
      teacherId,
      userId,
      username,
      email,
      password, // Return password for initial setup
    };
  },
});

/**
 * Regenerate password for a teacher
 */
export const regenerateTeacherPassword = action({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    password: string;
  }> => {
    // Get user by username
    const user = await ctx.runQuery(
      internal.auth.mutations.getUserWithPasswordInternal,
      { username: args.username }
    );

    if (!user) {
      throw new ConvexError({ code: "user_not_found" });
    }

    // Verify user is a teacher
    if (!user.roles.includes("TEACHER")) {
      throw new ConvexError({ code: "unauthorized" });
    }

    // Generate new password
    const newPassword = generateRandomPassword();
    const passwordHash = hashPassword(newPassword);

    // Update user password
    await ctx.runMutation(internal.auth.mutations.updatePasswordInternal, {
      userId: user._id,
      passwordHash,
    });

    // Log password change in history
    await ctx.runMutation(internal.passwordHistory.mutations.logPasswordChange, {
      userId: user._id,
      changeType: "regenerated",
      notes: `Password regenerated for teacher via admin panel`,
    });

    return {
      success: true,
      password: newPassword,
    };
  },
});

/**
 * Internal mutation to update user password
 */
export const updatePasswordInternal = internalMutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
    });
  },
});

/**
 * Update user password
 */
export const updatePassword = action({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.runQuery(api.auth.queries.getUserByUsername, {
      username: "", // We need a different approach
    });

    // This needs to be implemented with proper user lookup
    throw new Error("Not implemented - needs user lookup by ID");
  },
});
