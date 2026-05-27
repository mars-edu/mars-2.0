import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

async function getAdminUsers(ctx: MutationCtx) {
  const allUsers = await ctx.db.query("users").collect();
  return allUsers.filter((u) => u.roles.includes("ADMIN"));
}

async function requireAdmin(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !user.roles.includes("ADMIN")) {
    throw new Error("Только администратор может выполнить это действие");
  }
  return user;
}

function formatTeacherName(teacher: any | null) {
  if (!teacher) return "Неизвестный преподаватель";
  
  if (teacher.surname !== undefined) {
    return [teacher.surname, teacher.firstName, teacher.patronymic].filter(Boolean).join(" ");
  }
  
  if (teacher.lastName !== undefined) {
    return [teacher.lastName, teacher.firstName, teacher.middleName].filter(Boolean).join(" ");
  }
  
  return [teacher.firstName].filter(Boolean).join(" ") || "Неизвестный преподаватель";
}

async function buildJournalSnapshot(ctx: MutationCtx, journal: { disciplineId?: any; groupName?: string; semesterId: any }) {
  const [class9Item, semester] = await Promise.all([
    journal.disciplineId ? ctx.db.get(journal.disciplineId as Id<"class9Items">) : null,
    ctx.db.get(journal.semesterId as Id<"academicYearSemesters">),
  ]);

  return {
    disciplineName: class9Item?.learningOutcome ?? "Неизвестная дисциплина",
    groupName: journal.groupName,
    course: undefined,
    semester: semester?.semesterDefinitionId,
  };
}

async function notifyAdmins(
  ctx: MutationCtx,
  adminUsers: Array<{ _id: Id<"users"> }>,
  params: { substitutionId: Id<"substitutions">; journalId: Id<"journals">; message: string; timestamp: number }
) {
  for (const admin of adminUsers) {
    await ctx.db.insert("notifications", {
      userId: admin._id,
      type: "substitution",
      status: "unread",
      title: "Запрос замены",
      message: params.message,
      metadata: { substitutionId: params.substitutionId, journalId: params.journalId },
      createdAt: params.timestamp,
    });
  }
}

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
    const now = Date.now();
    const journal = await ctx.db.get(args.journalId);
    if (!journal) throw new Error("Журнал не найден");

    const [journalSnapshot, fromTeacher, adminUsers] = await Promise.all([
      buildJournalSnapshot(ctx, journal),
      ctx.db.get(args.fromTeacherId as Id<"teachers">),
      getAdminUsers(ctx),
    ]);

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
      createdAt: now,
      updatedAt: now,
    });

    const fromTeacherName = formatTeacherName(fromTeacher);
    await notifyAdmins(ctx, adminUsers, {
      substitutionId,
      journalId: args.journalId,
      message: `${fromTeacherName} запрашивает замену журнала "${journalSnapshot.disciplineName}" на ${args.startDate}–${args.endDate}.`,
      timestamp: now,
    });

    return substitutionId;
  },
});

export const createBulkSubstitutions = mutation({
  args: {
    calendarEventIds: v.array(v.id("calendarEvents")),
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
    const now = Date.now();
    const substitutionIds: string[] = [];
    const adminUsers = await getAdminUsers(ctx);

    for (const calendarEventId of args.calendarEventIds) {
      const event = await ctx.db.get(calendarEventId);
      if (!event?.teacherId) throw new Error(`Не удалось определить преподавателя для события ${calendarEventId}`);

      let journal = await ctx.db
        .query("journals")
        .withIndex("by_calendarEvent", (q) => q.eq("calendarEventId", calendarEventId))
        .first();

      if (!journal) {
        const semesterRecord = event.semester ? await ctx.db.get(event.semester as Id<"academicYearSemesters">) : null;
        if (!semesterRecord) throw new Error(`Не удалось определить семестр для события ${calendarEventId}`);

        const newJournalId = await ctx.db.insert("journals", {
          calendarEventId,
          disciplineId: event.class9Id,
          semesterId: semesterRecord._id,
          academicYearId: semesterRecord.academicYearId as string,
          createdAt: now,
          updatedAt: now,
        });
        journal = await ctx.db.get(newJournalId);
      }

      if (!journal) throw new Error(`Не удалось создать журнал для события ${calendarEventId}`);

      const journalId = journal._id;
      const fromTeacherId = event.teacherId;

      const [journalSnapshot, fromTeacher] = await Promise.all([
        buildJournalSnapshot(ctx, journal),
        ctx.db.get(fromTeacherId as Id<"teachers">),
      ]);

      const substitutionId = await ctx.db.insert("substitutions", {
        journalId,
        fromTeacherId,
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
        createdAt: now,
        updatedAt: now,
      });

      const fromTeacherName = formatTeacherName(fromTeacher);
      await notifyAdmins(ctx, adminUsers, {
        substitutionId,
        journalId,
        message: `${fromTeacherName} запрашивает замену журнала "${journalSnapshot.disciplineName}" на ${args.startDate}–${args.endDate}.`,
        timestamp: now,
      });

      substitutionIds.push(substitutionId);
    }

    return substitutionIds;
  },
});

export const acceptSubstitution = mutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) throw new Error("Замена не найдена");

    await requireAdmin(ctx, args.userId);

    if (substitution.status !== "pending") {
      throw new Error("Эта замена уже обработана");
    }

    await ctx.db.patch(args.substitutionId, {
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    });

    const disciplineName = substitution.journalSnapshot?.disciplineName ?? "";

    await ctx.db.insert("notifications", {
      userId: substitution.toUserId,
      type: "substitution",
      status: "unread",
      title: "Замена одобрена",
      message: `Администратор одобрил замену журнала "${disciplineName}". Вы назначены заместителем с ${substitution.startDate} по ${substitution.endDate}.`,
      metadata: { substitutionId: args.substitutionId, journalId: substitution.journalId },
      createdAt: now,
    });

    const fromTeacher = await ctx.db.get(substitution.fromTeacherId as Id<"teachers">);
    if (fromTeacher?.userId) {
      await ctx.db.insert("notifications", {
        userId: fromTeacher.userId,
        type: "system",
        status: "unread",
        title: "Замена одобрена",
        message: `Замена журнала "${disciplineName}" одобрена администратором.`,
        createdAt: now,
      });
    }

    return { success: true };
  },
});

export const rejectSubstitution = mutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) throw new Error("Замена не найдена");

    await requireAdmin(ctx, args.userId);

    if (substitution.status !== "pending") {
      throw new Error("Эта замена уже обработана");
    }

    await ctx.db.patch(args.substitutionId, {
      status: "rejected",
      rejectedAt: now,
      updatedAt: now,
      rejectionReason: args.rejectionReason,
    });

    const fromTeacher = await ctx.db.get(substitution.fromTeacherId as Id<"teachers">);
    if (fromTeacher?.userId) {
      await ctx.db.insert("notifications", {
        userId: fromTeacher.userId,
        type: "system",
        status: "unread",
        title: "Замена отклонена",
        message: `Замена журнала "${substitution.journalSnapshot?.disciplineName ?? ""}" отклонена администратором${args.rejectionReason ? `: ${args.rejectionReason}` : "."}`,
        createdAt: now,
      });
    }

    return { success: true };
  },
});

export const completeSubstitution = mutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) throw new Error("Замена не найдена");

    const user = await ctx.db.get(args.userId);
    if (!user || (!user.roles.includes("ADMIN") && substitution.toUserId !== args.userId)) {
      throw new Error("Недостаточно прав для завершения замены");
    }

    if (substitution.status !== "accepted") {
      throw new Error("Можно завершить только принятую замену");
    }

    await ctx.db.patch(args.substitutionId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const cancelSubstitution = mutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) throw new Error("Замена не найдена");

    await requireAdmin(ctx, args.userId);

    await ctx.db.patch(args.substitutionId, {
      status: "cancelled",
      updatedAt: now,
    });

    const reasonSuffix = args.reason ? `: ${args.reason}` : "";
    const disciplineName = substitution.journalSnapshot?.disciplineName ?? "";

    if (substitution.toUserId) {
      await ctx.db.insert("notifications", {
        userId: substitution.toUserId,
        type: "system",
        status: "unread",
        title: "Замена отменена",
        message: `Замена журнала "${disciplineName}" отменена администратором${reasonSuffix}`,
        createdAt: now,
      });
    }

    const fromTeacher = await ctx.db.get(substitution.fromTeacherId as Id<"teachers">);
    if (fromTeacher?.userId) {
      await ctx.db.insert("notifications", {
        userId: fromTeacher.userId,
        type: "system",
        status: "unread",
        title: "Замена отменена",
        message: `Замена журнала "${disciplineName}" отменена администратором${reasonSuffix}`,
        createdAt: now,
      });
    }

    return { success: true };
  },
});
