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
}

export const createMakeupRequest = mutation({
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
    if (!journal) throw new Error("Журнал не найден");

    const class9Item =
      journal.disciplineId
        ? await ctx.db.get(journal.disciplineId as Id<"class9Items">)
        : null;
    const journalSnapshot = {
      disciplineName: class9Item?.learningOutcome ?? "Неизвестная дисциплина",
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
      : "Преподаватель";

    for (const admin of adminUsers) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        type: "substitution",
        status: "unread",
        title: "Запрос на отработку часов",
        message: `${teacherName} запрашивает отработку часов по дисциплине "${journalSnapshot.disciplineName}".`,
        metadata: { journalId: args.journalId },
        createdAt: now,
      });
    }

    return id;
  },
});

export const acceptMakeupRequest = mutation({
  args: {
    makeupRequestId: v.id("makeupRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const request = await ctx.db.get(args.makeupRequestId);
    if (!request) throw new Error("Запрос на отработку не найден");

    await requireAdmin(ctx, args.userId);

    if (request.status !== "pending") {
      throw new Error("Этот запрос уже обработан");
    }

    await ctx.db.patch(args.makeupRequestId, {
      status: "accepted",
      updatedAt: now,
    });

    return { success: true };
  },
});

export const rejectMakeupRequest = mutation({
  args: {
    makeupRequestId: v.id("makeupRequests"),
    userId: v.id("users"),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const request = await ctx.db.get(args.makeupRequestId);
    if (!request) throw new Error("Запрос на отработку не найден");

    await requireAdmin(ctx, args.userId);

    if (request.status !== "pending") {
      throw new Error("Этот запрос уже обработан");
    }

    await ctx.db.patch(args.makeupRequestId, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
      updatedAt: now,
    });

    return { success: true };
  },
});
