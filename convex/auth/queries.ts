import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get user by ID
 */
export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      firstName: v.string(),
      lastName: v.string(),
      middleName: v.optional(v.string()),
      username: v.string(),
      email: v.string(),
      roles: v.array(
        v.union(
          v.literal("ADMIN"),
          v.literal("TEACHER"),
          v.literal("STUDENT"),
          v.literal("PARENT")
        )
      ),
      avatar: v.optional(v.string()),
      theme: v.optional(
        v.union(
          v.literal("light"),
          v.literal("dark"),
          v.literal("lavanda"),
          v.literal("coral"),
          v.literal("graphite")
        )
      ),
      locale: v.optional(
        v.union(v.literal("ru"), v.literal("kk"), v.literal("en"))
      ),
      phone: v.optional(v.string()),
      office: v.optional(v.string()),
      department: v.optional(v.string()),
      degree: v.optional(v.string()),
      createdAt: v.string(),
      updatedAt: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

/**
 * Get user by username (for login)
 */
export const getUserByUsername = query({
  args: { username: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
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
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.trim()))
      .first();
  },
});

/**
 * Check if username is available
 */
export const isUsernameAvailable = query({
  args: { username: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.trim()))
      .first();

    return !existingUser;
  },
});

/**
 * Check if email is available
 */
export const isEmailAvailable = query({
  args: { email: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim()))
      .first();

    return !existingUser;
  },
});

/**
 * Check if username is available (excluding a specific user)
 */
export const isUsernameAvailableForUser = query({
  args: {
    username: v.string(),
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.trim()))
      .first();

    if (!existingUser) {
      return true;
    }

    return existingUser._id === args.userId;
  },
});

/**
 * Check if email is available (excluding a specific user)
 */
export const isEmailAvailableForUser = query({
  args: {
    email: v.string(),
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim()))
      .first();

    if (!existingUser) {
      return true;
    }

    return existingUser._id === args.userId;
  },
});
