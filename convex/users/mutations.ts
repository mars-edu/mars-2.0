import { mutation, action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Update user's profile picture
 */
export const updateProfilePicture = mutation({
  args: {
    userId: v.id("users"),
    avatarUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      avatar: args.avatarUrl,
      updatedAt: Date.now(),
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
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      avatar: undefined,
      updatedAt: Date.now(),
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
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("lavanda")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      theme: args.theme,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      theme: args.theme,
    };
  },
});
