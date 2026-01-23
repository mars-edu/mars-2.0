import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a notification for a user
 */
export const createNotification = mutation({
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
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Уведомление не найдено");
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
export const markMultipleAsRead = mutation({
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
export const markAllAsRead = mutation({
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
export const archiveNotification = mutation({
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
export const deleteNotification = mutation({
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
export const createJournalClosureReminder = mutation({
  args: {
    academicYearId: v.string(),
    semesterId: v.optional(v.id("academicYearSemesters")),
    deadline: v.string(),
    message: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify creator is admin
    const creator = await ctx.db.get(args.createdBy);
    if (!creator || !creator.roles.includes("ADMIN")) {
      throw new Error("Только администраторы могут создавать напоминания о закрытии журналов");
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create notifications for all teachers
    const teachers = await ctx.db.query("teachers").collect();
    const teachersWithUsers = teachers.filter((t) => t.userId);

    await Promise.all(
      teachersWithUsers.map((teacher) =>
        ctx.db.insert("notifications", {
          userId: teacher.userId!,
          type: "journal_closure",
          status: "unread",
          title: "Объявление о закрытии журналов",
          message: args.message,
          metadata: {
            deadline: args.deadline,
          },
          createdAt: Date.now(),
        })
      )
    );

    return reminderId;
  },
});

/**
 * Deactivate a journal closure reminder
 */
export const deactivateJournalClosureReminder = mutation({
  args: {
    reminderId: v.id("journalClosureReminders"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || !user.roles.includes("ADMIN")) {
      throw new Error("Только администраторы могут деактивировать напоминания");
    }

    await ctx.db.patch(args.reminderId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
