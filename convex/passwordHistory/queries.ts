import { query } from "../functions";
import { v } from "convex/values";

/**
 * Get password change history for a user
 */
export const getPasswordHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const history = await ctx.db
      .query("passwordChangeHistory")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrich with user information
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const changedByUser = entry.changedBy
          ? await ctx.db.get(entry.changedBy)
          : null;

        return {
          ...entry,
          changedByName: changedByUser
            ? `${changedByUser.firstName} ${changedByUser.lastName}`
            : "System",
        };
      })
    );

    return enrichedHistory;
  },
});

/**
 * Get password change history for a teacher
 */
export const getTeacherPasswordHistory = query({
  args: {
    teacherId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const history = await ctx.db
      .query("passwordChangeHistory")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", args.teacherId))
      .order("desc")
      .take(limit);

    // Enrich with user information
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        const changedByUser = entry.changedBy
          ? await ctx.db.get(entry.changedBy)
          : null;

        return {
          ...entry,
          userName: user
            ? `${user.firstName} ${user.lastName}`
            : "Unknown User",
          changedByName: changedByUser
            ? `${changedByUser.firstName} ${changedByUser.lastName}`
            : "System",
        };
      })
    );

    return enrichedHistory;
  },
});

/**
 * Get all recent password changes (for admin view)
 */
export const getRecentPasswordChanges = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const history = await ctx.db
      .query("passwordChangeHistory")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);

    // Enrich with user information
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        const changedByUser = entry.changedBy
          ? await ctx.db.get(entry.changedBy)
          : null;

        return {
          ...entry,
          userName: user
            ? `${user.firstName} ${user.lastName}`
            : "Unknown User",
          userEmail: user?.email,
          changedByName: changedByUser
            ? `${changedByUser.firstName} ${changedByUser.lastName}`
            : "System",
        };
      })
    );

    return enrichedHistory;
  },
});
