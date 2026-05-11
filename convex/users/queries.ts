import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get user profile with avatar
 */
export const getUserProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    // Return user data without password hash
    return {
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

/**
 * Get user avatar URL
 */
export const getUserAvatar = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    return user.avatar || null;
  },
});
