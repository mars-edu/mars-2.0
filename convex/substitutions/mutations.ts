import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new substitution assignment
 */
export const createSubstitution = mutation({
  args: {
    journalId: v.id("journals"),
    fromTeacherId: v.string(),
    toTeacherId: v.string(),
    toUserId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
    reason: v.optional(v.string()),
    serviceLetterNumber: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get journal details for snapshot
    const journal = await ctx.db.get(args.journalId);
    if (!journal) {
      throw new Error("Журнал не найден");
    }

    // Get discipline name from class9Items
    const class9Item = journal.disciplineId ? await ctx.db.get(journal.disciplineId) : null;
    const disciplineName = class9Item?.learningOutcome ?? "Неизвестная дисциплина";

    // Get semester info
    const semester = await ctx.db.get(journal.semesterId);

    // Create journal snapshot
    const journalSnapshot = {
      disciplineName,
      groupName: journal.groupName,
      course: undefined,
      semester: semester?.semesterDefinitionId,
    };

    // Create substitution
    const substitutionId = await ctx.db.insert("substitutions", {
      journalId: args.journalId,
      fromTeacherId: args.fromTeacherId,
      toTeacherId: args.toTeacherId,
      toUserId: args.toUserId,
      startDate: args.startDate,
      endDate: args.endDate,
      startTime: args.startTime,
      endTime: args.endTime,
      isPrimary: args.isPrimary,
      status: "pending",
      reason: args.reason,
      serviceLetterNumber: args.serviceLetterNumber,
      journalSnapshot,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create notification for the receiving teacher
    const fromTeacher = await ctx.db.get(args.fromTeacherId as any);
    const fromTeacherName = fromTeacher
      ? `${fromTeacher.surname} ${fromTeacher.firstName} ${fromTeacher.patronymic}`
      : "Неизвестный преподаватель";

    await ctx.db.insert("notifications", {
      userId: args.toUserId,
      type: "substitution",
      status: "unread",
      title: "Установлена замена",
      message: `Журнал БМД Владеть основами философских знаний 3 Курса - 9 РХЯТ (русская группа) преподавателя ${fromTeacherName} переведен преподавателю Садвакасова Динара Балтабековна в период с ${args.startDate} г. по ${args.endDate} г. на основании служебного письма от ${args.serviceLetterNumber || "не указано"} г.`,
      metadata: {
        substitutionId,
        journalId: args.journalId,
      },
      createdAt: Date.now(),
    });

    return substitutionId;
  },
});

/**
 * Create substitutions for multiple journals in one mutation (single roundtrip).
 * Hoists teacher/semester lookups outside the per-journal loop.
 */
export const createBulkSubstitutions = mutation({
  args: {
    journalIds: v.array(v.id("journals")),
    fromTeacherId: v.string(),
    toTeacherId: v.string(),
    toUserId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
    reason: v.optional(v.string()),
    serviceLetterNumber: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const fromTeacher = await ctx.db.get(args.fromTeacherId as any);
    const fromTeacherName = fromTeacher
      ? `${fromTeacher.surname} ${fromTeacher.firstName} ${fromTeacher.patronymic}`
      : "Неизвестный преподаватель";

    const now = Date.now();
    const substitutionIds: string[] = [];

    for (const journalId of args.journalIds) {
      const journal = await ctx.db.get(journalId);
      if (!journal) continue;

      const class9Item = journal.disciplineId ? await ctx.db.get(journal.disciplineId) : null;
      const disciplineName = class9Item?.learningOutcome ?? "Неизвестная дисциплина";
      const semester = await ctx.db.get(journal.semesterId);

      const substitutionId = await ctx.db.insert("substitutions", {
        journalId,
        fromTeacherId: args.fromTeacherId,
        toTeacherId: args.toTeacherId,
        toUserId: args.toUserId,
        startDate: args.startDate,
        endDate: args.endDate,
        startTime: args.startTime,
        endTime: args.endTime,
        isPrimary: args.isPrimary,
        status: "pending",
        reason: args.reason,
        serviceLetterNumber: args.serviceLetterNumber,
        journalSnapshot: {
          disciplineName,
          groupName: journal.groupName,
          course: undefined,
          semester: semester?.semesterDefinitionId,
        },
        createdBy: args.createdBy,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("notifications", {
        userId: args.toUserId,
        type: "substitution",
        status: "unread",
        title: "Установлена замена",
        message: `Журнал "${disciplineName}" преподавателя ${fromTeacherName} переведен в период с ${args.startDate} по ${args.endDate}${args.reason ? ` на основании: ${args.reason}` : ""}.`,
        metadata: { substitutionId, journalId },
        createdAt: now,
      });

      substitutionIds.push(substitutionId);
    }

    return substitutionIds;
  },
});

/**
 * Accept a substitution (teacher accepting the assignment)
 */
export const acceptSubstitution = mutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const substitution = await ctx.db.get(args.substitutionId);

    if (!substitution) {
      throw new Error("Замена не найдена");
    }

    // Verify the user is the receiving teacher
    if (substitution.toUserId !== args.userId) {
      throw new Error("Вы не можете принять эту замену");
    }

    // Verify status is pending
    if (substitution.status !== "pending") {
      throw new Error("Эта замена уже обработана");
    }

    // Update substitution status
    await ctx.db.patch(args.substitutionId, {
      status: "accepted",
      acceptedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Mark the related notification as read
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const relatedNotification = notifications.find(
      (n) =>
        n.type === "substitution" &&
        n.metadata?.substitutionId === args.substitutionId
    );

    if (relatedNotification) {
      await ctx.db.patch(relatedNotification._id, {
        status: "read",
        readAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Reject a substitution
 */
export const rejectSubstitution = mutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const substitution = await ctx.db.get(args.substitutionId);

    if (!substitution) {
      throw new Error("Замена не найдена");
    }

    // Verify the user is the receiving teacher
    if (substitution.toUserId !== args.userId) {
      throw new Error("Вы не можете отклонить эту замену");
    }

    // Verify status is pending
    if (substitution.status !== "pending") {
      throw new Error("Эта замена уже обработана");
    }

    // Update substitution status
    await ctx.db.patch(args.substitutionId, {
      status: "rejected",
      rejectedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Notify the original teacher about the rejection
    const fromTeacher = await ctx.db
      .query("teachers")
      .collect()
      .then((teachers) => teachers.find((t) => t._id === substitution.fromTeacherId));

    if (fromTeacher?.userId) {
      await ctx.db.insert("notifications", {
        userId: fromTeacher.userId,
        type: "system",
        status: "unread",
        title: "Замена отклонена",
        message: `Преподаватель отклонил замену журнала${args.rejectionReason ? `: ${args.rejectionReason}` : ""}`,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Complete a substitution (mark as finished)
 */
export const completeSubstitution = mutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const substitution = await ctx.db.get(args.substitutionId);

    if (!substitution) {
      throw new Error("Замена не найдена");
    }

    // Verify user is admin or the teacher involved
    const user = await ctx.db.get(args.userId);
    if (
      !user ||
      (!user.roles.includes("ADMIN") && substitution.toUserId !== args.userId)
    ) {
      throw new Error("Недостаточно прав для завершения замены");
    }

    // Verify status is accepted
    if (substitution.status !== "accepted") {
      throw new Error("Можно завершить только принятую замену");
    }

    // Update substitution status
    await ctx.db.patch(args.substitutionId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Cancel a substitution (admin only)
 */
export const cancelSubstitution = mutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const substitution = await ctx.db.get(args.substitutionId);

    if (!substitution) {
      throw new Error("Замена не найдена");
    }

    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || !user.roles.includes("ADMIN")) {
      throw new Error("Только администраторы могут отменять замены");
    }

    // Delete the substitution
    await ctx.db.delete(args.substitutionId);

    // Notify both teachers
    if (substitution.toUserId) {
      await ctx.db.insert("notifications", {
        userId: substitution.toUserId,
        type: "system",
        status: "unread",
        title: "Замена отменена",
        message: `Замена журнала была отменена администратором${args.reason ? `: ${args.reason}` : ""}`,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});
