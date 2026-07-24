import { query } from "../functions";
import { v } from "convex/values";
import { m, withI18nQuery } from "../lib/i18n";

/**
 * Get all notifications for a user
 */
export const getUserNotifications = withI18nQuery({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(
      v.literal("unread"),
      v.literal("read"),
      v.literal("archived")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc");

    const allNotifications = await notificationsQuery.collect();

    // Filter by status if provided
    let notifications = args.status
      ? allNotifications.filter((n) => n.status === args.status)
      : allNotifications;

    // Apply limit if provided
    if (args.limit) {
      notifications = notifications.slice(0, args.limit);
    }

    // Enrich notifications with related data
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const enriched: any = { ...notification };

        // If substitution notification, get substitution details
        if (
          notification.type === "substitution" &&
          notification.metadata?.substitutionId
        ) {
          const substitution = await ctx.db.get(
            notification.metadata.substitutionId
          );
          enriched.substitution = substitution;

          // Get journal details
          if (substitution?.journalId) {
            const journal = await ctx.db.get(substitution.journalId);
            enriched.journal = journal;
          }
        }

        // If journal closure notification, get journal details
        if (
          notification.type === "journal_closure" &&
          notification.metadata?.journalId
        ) {
          const journal = await ctx.db.get(notification.metadata.journalId);
          enriched.journal = journal;
        }

        return enriched;
      })
    );

    return enrichedNotifications;
  },
});

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", "unread")
      )
      .collect();

    return unreadNotifications.length;
  },
});

/**
 * Get a single notification by ID
 */
export const getNotification = withI18nQuery({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error(m.backend_notification_not_found());
    }

    return notification;
  },
});

/**
 * Get active journal closure reminders
 */
export const getActiveJournalClosureReminders = query({
  args: {
    academicYearId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("journalClosureReminders")
      .withIndex("by_isActive", (q) => q.eq("isActive", true));

    const reminders = await query.collect();

    // Filter by academic year if provided
    if (args.academicYearId) {
      return reminders.filter((r) => r.academicYearId === args.academicYearId);
    }

    return reminders;
  },
});
