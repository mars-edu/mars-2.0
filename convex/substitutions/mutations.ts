import type { MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { m, getUserLocale, type Locale, withI18nMutation, setLocale } from "../lib/i18n";
import { requirePermission } from "../lib/rbac";

async function getAdminUsers(ctx: MutationCtx) {
  const allUsers = await ctx.db.query("users").collect();
  return allUsers.filter((u) => u.roles.includes("ADMIN"));
}

function formatTeacherName(teacher: any | null) {
  if (!teacher) return m.backend_unknown_teacher();
  
  if (teacher.surname !== undefined) {
    return [teacher.surname, teacher.firstName, teacher.patronymic].filter(Boolean).join(" ");
  }
  
  if (teacher.lastName !== undefined) {
    return [teacher.lastName, teacher.firstName, teacher.middleName].filter(Boolean).join(" ");
  }
  
  return [teacher.firstName].filter(Boolean).join(" ") || m.backend_unknown_teacher();
}

async function buildJournalSnapshot(ctx: MutationCtx, journal: { disciplineId?: any; groupName?: string; semesterId: any }) {
  const [rupEntry, semester] = await Promise.all([
    journal.disciplineId ? ctx.db.get(journal.disciplineId as Id<"rupEntries">) : null,
    ctx.db.get(journal.semesterId as Id<"academicYearSemesters">),
  ]);

  return {
    disciplineName: rupEntry?.learningOutcome ?? m.backend_unknown_discipline(),
    groupName: journal.groupName,
    course: undefined,
    semester: semester?.semesterDefinitionId,
  };
}

export const createSubstitution = withI18nMutation({
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
    if (!journal) throw new Error(m.backend_journal_not_found());

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
    for (const admin of adminUsers) {
      const locale = await getUserLocale(ctx, admin._id);
      setLocale(locale); // Switch locale for this notification
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "substitution",
        status: "unread",
        title: m.backend_substitution_request_title(),
        message: m.backend_substitution_request_msg({ fromTeacher: fromTeacherName, discipline: journalSnapshot.disciplineName, startDate: args.startDate, endDate: args.endDate }),
        metadata: { substitutionId, journalId: args.journalId },
        createdAt: now,
      });
    }

    return substitutionId;
  },
});

export const createBulkSubstitutions = withI18nMutation({
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
      if (!event?.teacherId) throw new Error(m.backend_substitution_event_teacher_err({ eventId: String(calendarEventId) }));

      let journal = await ctx.db
        .query("journals")
        .withIndex("by_calendarEvent", (q) => q.eq("calendarEventId", calendarEventId))
        .first();

      if (!journal) {
        const semesterRecord = event.semester ? await ctx.db.get(event.semester as Id<"academicYearSemesters">) : null;
        if (!semesterRecord) throw new Error(m.backend_substitution_event_semester_err({ eventId: String(calendarEventId) }));

        const newJournalId = await ctx.db.insert("journals", {
          calendarEventId,
          disciplineId: event.rupEntryId ?? event.class9Id ?? "",
          semesterId: semesterRecord._id,
          academicYearId: semesterRecord.academicYearId as string,
          createdAt: now,
          updatedAt: now,
        });
        journal = await ctx.db.get(newJournalId);
      }

      if (!journal) throw new Error(m.backend_substitution_journal_create_err({ eventId: String(calendarEventId) }));

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
      for (const admin of adminUsers) {
        const locale = await getUserLocale(ctx, admin._id);
        setLocale(locale); // Switch locale for this notification
        await ctx.db.insert("notifications", {
          userId: admin._id,
          type: "substitution",
          status: "unread",
          title: m.backend_substitution_request_title(),
          message: m.backend_substitution_request_msg({ fromTeacher: fromTeacherName, discipline: journalSnapshot.disciplineName, startDate: args.startDate, endDate: args.endDate }),
          metadata: { substitutionId, journalId },
          createdAt: now,
        });
      }

      substitutionIds.push(substitutionId);
    }

    return substitutionIds;
  },
});

export const acceptSubstitution = withI18nMutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) throw new Error(m.backend_substitution_not_found());

    await requirePermission(ctx, args.userId, "substitutions", "write");

    if (substitution.status !== "pending") {
      throw new Error(m.backend_substitution_already_processed());
    }

    await ctx.db.patch(args.substitutionId, {
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    });

    // If isPrimary, update the calendar event's teacher and record history
    if (substitution.isPrimary) {
      const journal = await ctx.db.get(substitution.journalId);
      if (journal?.calendarEventId) {
        const calendarEvent = await ctx.db.get(journal.calendarEventId as Id<"calendarEvents">);
        if (calendarEvent) {
          const oldTeacherId = calendarEvent.teacherId ?? "";

          await ctx.db.patch(calendarEvent._id, {
            teacherId: substitution.toTeacherId,
            updatedAt: now,
          });

          const [fromTeacher, toTeacher] = await Promise.all([
            oldTeacherId ? ctx.db.get(oldTeacherId as Id<"teachers">) : null,
            ctx.db.get(substitution.toTeacherId as Id<"teachers">),
          ]);

          await ctx.db.insert("teacherChangeHistory", {
            calendarEventId: calendarEvent._id,
            journalId: substitution.journalId,
            substitutionId: args.substitutionId,
            fromTeacherId: oldTeacherId,
            toTeacherId: substitution.toTeacherId,
            fromTeacherName: formatTeacherName(fromTeacher),
            toTeacherName: formatTeacherName(toTeacher),
            reason: substitution.reason,
            changedBy: args.userId,
            createdAt: now,
          });
        }
      }
    }

    const disciplineName = substitution.journalSnapshot?.disciplineName ?? "";

    // Notify the receiving teacher in their locale
    const toLocale = await getUserLocale(ctx, substitution.toUserId);
    setLocale(toLocale);
    await ctx.db.insert("notifications", {
      userId: substitution.toUserId,
      type: "substitution",
      status: "unread",
      title: m.backend_substitution_accepted_title(),
      message: substitution.isPrimary
        ? m.backend_substitution_accepted_primary({ discipline: disciplineName })
        : m.backend_substitution_accepted_temp({ discipline: disciplineName, startDate: substitution.startDate, endDate: substitution.endDate }),
      metadata: { substitutionId: args.substitutionId, journalId: substitution.journalId },
      createdAt: now,
    });

    // Notify the original teacher in their locale
    const fromTeacher = await ctx.db.get(substitution.fromTeacherId as Id<"teachers">);
    if (fromTeacher?.userId) {
      const fromLocale = await getUserLocale(ctx, fromTeacher.userId as Id<"users">);
      setLocale(fromLocale);
      await ctx.db.insert("notifications", {
        userId: fromTeacher.userId,
        type: "system",
        status: "unread",
        title: substitution.isPrimary
          ? m.backend_teacher_changed_title()
          : m.backend_substitution_accepted_title(),
        message: substitution.isPrimary
          ? m.backend_substitution_accepted_from_primary({ discipline: disciplineName })
          : m.backend_substitution_accepted_from({ discipline: disciplineName }),
        createdAt: now,
      });
    }

    return { success: true };
  },
});

export const rejectSubstitution = withI18nMutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) throw new Error(m.backend_substitution_not_found());

    await requirePermission(ctx, args.userId, "substitutions", "write");

    if (substitution.status !== "pending") {
      throw new Error(m.backend_substitution_already_processed());
    }

    await ctx.db.patch(args.substitutionId, {
      status: "rejected",
      rejectedAt: now,
      updatedAt: now,
      rejectionReason: args.rejectionReason,
    });

    const fromTeacher = await ctx.db.get(substitution.fromTeacherId as Id<"teachers">);
    if (fromTeacher?.userId) {
      const locale = await getUserLocale(ctx, fromTeacher.userId as Id<"users">);
      setLocale(locale);
      const reasonSuffix = args.rejectionReason ? `: ${args.rejectionReason}` : ".";
      await ctx.db.insert("notifications", {
        userId: fromTeacher.userId,
        type: "system",
        status: "unread",
        title: m.backend_substitution_rejected_title(),
        message: m.backend_substitution_rejected_msg({ discipline: substitution.journalSnapshot?.disciplineName ?? "", reason: reasonSuffix }),
        createdAt: now,
      });
    }

    return { success: true };
  },
});

export const completeSubstitution = withI18nMutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) throw new Error(m.backend_substitution_not_found());

    const user = await ctx.db.get(args.userId);
    if (!user || (!user.roles.includes("ADMIN") && substitution.toUserId !== args.userId)) {
      throw new Error(m.backend_substitution_complete_denied());
    }

    if (substitution.status !== "accepted") {
      throw new Error(m.backend_substitution_complete_only_accepted());
    }

    await ctx.db.patch(args.substitutionId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const cancelSubstitution = withI18nMutation({
  args: {
    substitutionId: v.id("substitutions"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) throw new Error(m.backend_substitution_not_found());

    await requirePermission(ctx, args.userId, "substitutions", "write");

    await ctx.db.patch(args.substitutionId, {
      status: "cancelled",
      updatedAt: now,
    });

    const reasonSuffix = args.reason ? `: ${args.reason}` : "";
    const disciplineName = substitution.journalSnapshot?.disciplineName ?? "";

    if (substitution.toUserId) {
      const toLocale = await getUserLocale(ctx, substitution.toUserId);
      setLocale(toLocale);
      await ctx.db.insert("notifications", {
        userId: substitution.toUserId,
        type: "system",
        status: "unread",
        title: m.backend_substitution_cancelled_title(),
        message: m.backend_substitution_cancelled_msg({ discipline: disciplineName, reason: reasonSuffix }),
        createdAt: now,
      });
    }

    const fromTeacher = await ctx.db.get(substitution.fromTeacherId as Id<"teachers">);
    if (fromTeacher?.userId) {
      const fromLocale = await getUserLocale(ctx, fromTeacher.userId as Id<"users">);
      setLocale(fromLocale);
      await ctx.db.insert("notifications", {
        userId: fromTeacher.userId,
        type: "system",
        status: "unread",
        title: m.backend_substitution_cancelled_title(),
        message: m.backend_substitution_cancelled_msg({ discipline: disciplineName, reason: reasonSuffix }),
        createdAt: now,
      });
    }

    return { success: true };
  },
});
