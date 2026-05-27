import { MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { m, getUserLocale, withI18nMutation, setLocale } from "../lib/i18n";

async function getAdminUsers(ctx: MutationCtx) {
  const allUsers = await ctx.db.query("users").collect();
  return allUsers.filter((u) => u.roles.includes("ADMIN"));
}

async function requireAdmin(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !user.roles.includes("ADMIN")) {
    throw new Error(m.backend_admin_only());
  }
}

export const createMakeupRequest = withI18nMutation({
  args: {
    journalId: v.id("journals"),
    teacherId: v.string(),
    createdBy: v.id("users"),
    reason: v.optional(v.string()),
    dates: v.array(
      v.object({
        existingDate: v.string(),
        newDate: v.string(),
        startScheduleId: v.string(),
        endScheduleId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const journal = await ctx.db.get(args.journalId);
    if (!journal) throw new Error(m.backend_journal_not_found());

    const class9Item =
      journal.disciplineId
        ? await ctx.db.get(journal.disciplineId as Id<"class9Items">)
        : null;
    const journalSnapshot = {
      disciplineName: class9Item?.learningOutcome ?? m.backend_unknown_discipline(),
      groupName: journal.groupName,
    };

    const id = await ctx.db.insert("makeupRequests", {
      journalId: args.journalId,
      teacherId: args.teacherId,
      createdBy: args.createdBy,
      reason: args.reason,
      dates: args.dates,
      status: "pending",
      journalSnapshot,
      createdAt: now,
      updatedAt: now,
    });

    const adminUsers = await getAdminUsers(ctx);
    const teacherRecord = await ctx.db.get(
      args.teacherId as Id<"teachers">
    );
    const teacherName = teacherRecord
      ? `${teacherRecord.surname} ${teacherRecord.firstName} ${teacherRecord.patronymic}`.trim()
      : m.backend_teacher_label();

    for (const admin of adminUsers) {
      const locale = await getUserLocale(ctx, admin._id);
      setLocale(locale);
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "substitution",
        status: "unread",
        title: m.backend_makeup_request_title(),
        message: m.backend_makeup_request_msg({ teacher: teacherName, discipline: journalSnapshot.disciplineName }),
        metadata: { journalId: args.journalId },
        createdAt: now,
      });
    }

    return id;
  },
});

export const acceptMakeupRequest = withI18nMutation({
  args: {
    makeupRequestId: v.id("makeupRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const request = await ctx.db.get(args.makeupRequestId);
    if (!request) throw new Error(m.backend_makeup_request_not_found());

    await requireAdmin(ctx, args.userId);

    if (request.status !== "pending") {
      throw new Error(m.backend_makeup_already_processed());
    }

    await ctx.db.patch(args.makeupRequestId, {
      status: "accepted",
      updatedAt: now,
    });

    return { success: true };
  },
});

export const rejectMakeupRequest = withI18nMutation({
  args: {
    makeupRequestId: v.id("makeupRequests"),
    userId: v.id("users"),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const request = await ctx.db.get(args.makeupRequestId);
    if (!request) throw new Error(m.backend_makeup_request_not_found());

    await requireAdmin(ctx, args.userId);

    if (request.status !== "pending") {
      throw new Error(m.backend_makeup_already_processed());
    }

    await ctx.db.patch(args.makeupRequestId, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
      updatedAt: now,
    });

    return { success: true };
  },
});
