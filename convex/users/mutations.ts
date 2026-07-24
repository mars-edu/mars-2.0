import { mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { requirePermission } from "../lib/rbac";

/**
 * Update user's profile picture
 */
export const updateProfilePicture = mutation({
  args: {
    userId: v.id("users"),
    avatarUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.userId, "settings", "navigate");
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      avatar: args.avatarUrl,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      avatarUrl: args.avatarUrl,
    };
  },
});

/**
 * Upload profile picture to storage
 */
export const uploadProfilePicture = action({
  args: {
    userId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(args.storageId);

    if (!url) {
      throw new Error("Failed to get storage URL");
    }

    // Update user's avatar (cast string to Id<"users">)
    await ctx.runMutation(api.users.mutations.updateProfilePicture, {
      userId: args.userId as Id<"users">,
      avatarUrl: url,
    });

    return {
      success: true,
      url,
    };
  },
});

/**
 * Remove user's profile picture
 */
export const removeProfilePicture = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.userId, "settings", "navigate");
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      avatar: undefined,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  },
});

/**
 * Update user's theme preference
 */
export const updateTheme = mutation({
  args: {
    userId: v.id("users"),
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("lavanda"), v.literal("coral"), v.literal("graphite")),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.userId, "settings", "navigate");
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      theme: args.theme,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      theme: args.theme,
    };
  },
});

/**
 * Update user's profile information
 */
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    office: v.optional(v.string()),
    department: v.optional(v.string()),
    degree: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.userId, "settings", "navigate");
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    const { userId, ...profileData } = args;

    await ctx.db.patch(args.userId, {
      ...profileData,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  },
});

/**
 * Sync user's locale preference from the frontend
 */
export const updateLocale = mutation({
  args: {
    userId: v.id("users"),
    locale: v.union(v.literal("ru"), v.literal("kk"), v.literal("en")),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.userId, "settings", "navigate");
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      locale: args.locale,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
