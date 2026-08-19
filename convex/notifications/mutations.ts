import { v } from "convex/values";
import { m, getUserLocale, withI18nMutation, setLocale } from "../lib/i18n";

/**
 * Create a notification for a user
 */
export const createNotification = withI18nMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("substitution"),
      v.literal("journal_closure"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(
      v.object({
        substitutionId: v.optional(v.id("substitutions")),
        journalId: v.optional(v.id("journals")),
        deadline: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      status: "unread",
      title: args.title,
      message: args.message,
      metadata: args.metadata,
      });

    return notificationId;
  },
});

/**
 * Mark a notification as read
 */
export const markAsRead = withI18nMutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error(m.backend_notification_not_found());
    }

    await ctx.db.patch(args.notificationId, {
      status: "read",
      readAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark multiple notifications as read
 */
export const markMultipleAsRead = withI18nMutation({
  args: {
    notificationIds: v.array(v.id("notifications")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await Promise.all(
      args.notificationIds.map((id) =>
        ctx.db.patch(id, {
          status: "read",
          readAt: now,
        })
      )
    );

    return { success: true, count: args.notificationIds.length };
  },
});

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = withI18nMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", "unread")
      )
      .collect();

    const now = Date.now();

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          status: "read",
          readAt: now,
        })
      )
    );

    return { success: true, count: unreadNotifications.length };
  },
});

/**
 * Archive a notification
 */
export const archiveNotification = withI18nMutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      status: "archived",
    });

    return { success: true };
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = withI18nMutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});

/**
 * Create a journal closure reminder (admin only)
 */
export const createJournalClosureReminder = withI18nMutation({
  args: {
    academicYearId: v.id("academicYears"),
    semesterId: v.optional(v.id("academicYearSemesters")),
    deadline: v.string(),
    message: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify creator is admin
    const creator = await ctx.db.get(args.createdBy);
    if (!creator || !creator.roles.includes("ADMIN")) {
      throw new Error(m.backend_admin_only_close_reminders());
    }

    // Deactivate existing reminders for this academic year/semester
    const existingReminders = await ctx.db
      .query("journalClosureReminders")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    for (const reminder of existingReminders) {
      if (
        reminder.academicYearId === args.academicYearId &&
        (args.semesterId ? reminder.semesterId === args.semesterId : true)
      ) {
        await ctx.db.patch(reminder._id, { isActive: false });
      }
    }

    // Create new reminder
    const reminderId = await ctx.db.insert("journalClosureReminders", {
      academicYearId: args.academicYearId,
      semesterId: args.semesterId,
      deadline: args.deadline,
      message: args.message,
      createdBy: args.createdBy,
      isActive: true,
      });

    // Create notifications for all teachers — each in their own locale
    const teachers = await ctx.db.query("teachers").collect();
    const teachersWithUsers = teachers.filter((t) => t.userId);

    for (const teacher of teachersWithUsers) {
      const locale = await getUserLocale(ctx, teacher.userId!);
      setLocale(locale);
      await ctx.db.insert("notifications", {
        userId: teacher.userId!,
        type: "journal_closure",
        status: "unread",
        title: m.backend_journal_close_reminder_title(),
        message: args.message,
        metadata: {
          deadline: args.deadline,
        },
        });
    }

    return reminderId;
  },
});

/**
 * Deactivate a journal closure reminder
 */
export const deactivateJournalClosureReminder = withI18nMutation({
  args: {
    reminderId: v.id("journalClosureReminders"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || !user.roles.includes("ADMIN")) {
      throw new Error(m.backend_admin_only_deactivate());
    }

    await ctx.db.patch(args.reminderId, {
      isActive: false,
      });

    return { success: true };
  },
});
