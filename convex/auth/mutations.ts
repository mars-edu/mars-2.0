import { mutation, action, internalMutation, internalQuery } from "../functions";
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
import type { Id } from "../_generated/dataModel";

/**
 * Internal mutation to create a user (called from actions)
 */
export const createUserInternal = internalMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
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
    const trimmed = args.username.trim();
    const exact = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", trimmed))
      .unique();
    if (exact) return exact;

    // Fallback: case-insensitive match for mobile keyboards/autocapitalize
    const lower = trimmed.toLowerCase();
    const all = await ctx.db.query("users").collect();
    return all.find((u) => u.username?.trim().toLowerCase() === lower) ?? null;
  },
});

/**
 * Register a new user
 */
export const register = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
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
      middleName?: string;
      username: string;
      email: string;
      roles: string[];
      avatar?: string;
      phone?: string;
      office?: string;
      department?: string;
      degree?: string;
    };
  }> => {
    const trimmedUsername = args.username.trim();
    const trimmedEmail = args.email.trim();

    // Check if username is available
    const isUsernameAvailable = await ctx.runQuery(
      api.auth.queries.isUsernameAvailable,
      { username: trimmedUsername }
    );
    if (!isUsernameAvailable) {
      throw new ConvexError({ code: "auth_username_taken" });
    }

    // Check if email is available
    const isEmailAvailable = await ctx.runQuery(
      api.auth.queries.isEmailAvailable,
      { email: trimmedEmail }
    );
    if (!isEmailAvailable) {
      throw new ConvexError({ code: "auth_email_taken" });
    }

    // Hash password
    const passwordHash = hashPassword(args.password);

    // Create user
    const userId = await ctx.runMutation(internal.auth.mutations.createUserInternal, {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      middleName: args.middleName?.trim(),
      username: trimmedUsername,
      email: trimmedEmail,
      passwordHash,
      roles: args.roles || ["STUDENT"],
    });

    // Generate token with rich claims
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ConvexError({ code: "server_error" });
    }

    const token = await generateToken(
      {
        userId: userId,
        roles: args.roles || ["STUDENT"],
        username: trimmedUsername,
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
      },
      jwtSecret,
      true
    );

    return {
      userId,
      token,
      user: {
        id: userId,
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        middleName: args.middleName?.trim(),
        username: trimmedUsername,
        email: trimmedEmail,
        roles: args.roles || ["STUDENT"],
        avatar: undefined,
        phone: undefined,
        office: undefined,
        department: undefined,
        degree: undefined,
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
    remember: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    token: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      middleName?: string;
      username: string;
      email: string;
      roles: string[];
      avatar?: string;
      phone?: string;
      office?: string;
      department?: string;
      degree?: string;
    };
  }> => {
    const trimmedUsername = args.username.trim();

    // Get user by username with case-insensitive fallback
    const user = await ctx.runQuery(
      internal.auth.mutations.getUserWithPasswordInternal,
      { username: trimmedUsername }
    );

    if (!user) {
      throw new ConvexError({ code: "auth_invalid_credentials" });
    }

    const isValidPassword = verifyPassword(args.password, user.passwordHash);
    if (!isValidPassword) {
      throw new ConvexError({ code: "auth_invalid_credentials" });
    }

    // Generate token with rich claims and rememberMe duration
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ConvexError({ code: "server_error" });
    }

    const token = await generateToken(
      {
        userId: user._id,
        roles: user.roles,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      jwtSecret,
      args.remember !== false
    );

    return {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        username: user.username,
        email: user.email,
        roles: user.roles,
        avatar: user.avatar,
        phone: user.phone,
        office: user.office,
        department: user.department,
        degree: user.degree,
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
    isExplicitInvalid?: boolean;
  }> => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new ConvexError({ code: "server_error" });
    }

    let payload;
    try {
      payload = await validateToken(args.token, jwtSecret);
    } catch {
      // JWT decoding / signature / expiry error -> explicitly invalid
      return {
        valid: false,
        isExplicitInvalid: true,
        userId: null,
        roles: [],
        user: null,
      };
    }

    // Check if user still exists in database
    const user = await ctx.runQuery(api.auth.queries.getUser, {
      userId: payload.userId as any,
    });

    if (!user) {
      return {
        valid: false,
        isExplicitInvalid: true,
        userId: null,
        roles: [],
        user: null,
      };
    }

    return {
      valid: true,
      userId: payload.userId,
      roles: user.roles,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        username: user.username,
        email: user.email,
        roles: user.roles,
        avatar: user.avatar,
        phone: user.phone,
        office: user.office,
        department: user.department,
        degree: user.degree,
      },
    };
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
      middleName: args.middleName,
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
 * Set password for a user by username or ID
 */
export const setUserPassword = action({
  args: {
    username: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; userId: string; username: string }> => {
    const user = await ctx.runQuery(
      internal.auth.mutations.getUserWithPasswordInternal,
      { username: args.username.trim() }
    );

    if (!user) {
      throw new ConvexError({ code: "user_not_found" });
    }

    const passwordHash = hashPassword(args.newPassword);

    await ctx.runMutation(internal.auth.mutations.updatePasswordInternal, {
      userId: user._id,
      passwordHash,
    });

    return {
      success: true,
      userId: user._id,
      username: user.username,
    };
  },
});

/**
 * Internal mutation to assign roles to a user
 */
export const assignUserRoles = internalMutation({
  args: {
    username: v.string(),
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
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("username"), args.username.trim()))
      .first();
    if (!user) {
      throw new ConvexError({ code: "user_not_found" });
    }
    await ctx.db.patch(user._id, {
      roles: args.roles,
    });
    return {
      success: true,
      userId: user._id,
      roles: args.roles,
    };
  },
});
