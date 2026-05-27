import { query, internalQuery, action } from "../_generated/server";
import { v } from "convex/values";
import { validateToken } from "../auth/helpers";
import { internal } from "../_generated/api";

export const getTeacherSubstitutions = query({
  args: {
    toUserId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const substitutions = await ctx.db
      .query("substitutions")
      .withIndex("by_toUser_status", (q) => {
        const base = q.eq("toUserId", args.toUserId);
        return args.status ? base.eq("status", args.status) : base;
      })
      .collect();

    const allTeachers = await ctx.db.query("teachers").collect();
    const teacherMap = new Map(allTeachers.map((t) => [t._id as string, t]));

    const enriched = await Promise.all(
      substitutions.map(async (sub) => ({
        ...sub,
        journal: await ctx.db.get(sub.journalId),
        fromTeacher: teacherMap.get(sub.fromTeacherId),
        toTeacher: teacherMap.get(sub.toTeacherId),
      }))
    );

    return enriched;
  },
});

export const getCreatedSubstitutions = query({
  args: {
    fromTeacherId: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const substitutions = await ctx.db
      .query("substitutions")
      .withIndex("by_fromTeacher_status", (q) => {
        const base = q.eq("fromTeacherId", args.fromTeacherId);
        return args.status ? base.eq("status", args.status) : base;
      })
      .collect();

    const allTeachers = await ctx.db.query("teachers").collect();
    const teacherMap = new Map(allTeachers.map((t) => [t._id as string, t]));

    const enriched = await Promise.all(
      substitutions.map(async (sub) => ({
        ...sub,
        journal: await ctx.db.get(sub.journalId),
        toTeacher: teacherMap.get(sub.toTeacherId),
      }))
    );

    return enriched;
  },
});

export const getJournalSubstitutions = query({
  args: {
    journalId: v.id("journals"),
  },
  handler: async (ctx, args) => {
    const substitutions = await ctx.db
      .query("substitutions")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();

    const allTeachers = await ctx.db.query("teachers").collect();
    const teacherMap = new Map(allTeachers.map((t) => [t._id as string, t]));

    return substitutions.map((sub) => ({
      ...sub,
      fromTeacher: teacherMap.get(sub.fromTeacherId),
      toTeacher: teacherMap.get(sub.toTeacherId),
    }));
  },
});

export const getSubstitution = query({
  args: {
    substitutionId: v.id("substitutions"),
  },
  handler: async (ctx, args) => {
    const substitution = await ctx.db.get(args.substitutionId);
    if (!substitution) {
      throw new Error("Замена не найдена");
    }

    const [journal, fromTeacher, toTeacher] = await Promise.all([
      ctx.db.get(substitution.journalId),
      ctx.db.get(substitution.fromTeacherId as any),
      ctx.db.get(substitution.toTeacherId as any),
    ]);

    return { ...substitution, journal, fromTeacher, toTeacher };
  },
});

export const getPendingSubstitutionCount = query({
  args: {
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const pendingSubstitutions = await ctx.db
      .query("substitutions")
      .withIndex("by_toUser_status", (q) =>
        q.eq("toUserId", args.toUserId).eq("status", "pending")
      )
      .collect();

    return pendingSubstitutions.length;
  },
});

export const listProtocolWithRoleAccessInternal = internalQuery({
  args: {
    userId: v.string(),
    userRoles: v.array(v.string()),
    selectedTeacherId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { userId, userRoles, selectedTeacherId } = args;

    const isAdmin = userRoles.includes("ADMIN");
    const isTeacher = userRoles.includes("TEACHER");

    if (!isAdmin && !isTeacher) {
      return [];
    }

    let substitutions;

    if (isTeacher && !isAdmin) {
      const teacherRecord = await ctx.db
        .query("teachers")
        .withIndex("by_userId", (q) => q.eq("userId", userId as any))
        .unique();

      if (!teacherRecord) return [];

      substitutions = await ctx.db
        .query("substitutions")
        .withIndex("by_fromTeacher", (q) => q.eq("fromTeacherId", teacherRecord._id))
        .collect();
    } else {
      if (selectedTeacherId && selectedTeacherId !== "all") {
        const [sentSubstitutions, receivedSubstitutions] = await Promise.all([
          ctx.db
            .query("substitutions")
            .withIndex("by_fromTeacher", (q) => q.eq("fromTeacherId", selectedTeacherId))
            .collect(),
          ctx.db
            .query("substitutions")
            .withIndex("by_toTeacher", (q) => q.eq("toTeacherId", selectedTeacherId))
            .collect(),
        ]);

        const substitutionMap = new Map();
        for (const sub of [...sentSubstitutions, ...receivedSubstitutions]) {
          substitutionMap.set(sub._id, sub);
        }
        substitutions = Array.from(substitutionMap.values());
      } else {
        substitutions = await ctx.db.query("substitutions").collect();
      }
    }

    const [allTeachers, allClass9Items] = await Promise.all([
      ctx.db.query("teachers").collect(),
      ctx.db.query("class9Items").collect(),
    ]);
    const teacherMap = new Map(allTeachers.map((t) => [t._id as string, t]));
    const class9Map = new Map(allClass9Items.map((c) => [c._id, c]));

    const enriched = await Promise.all(
      substitutions.map(async (sub) => {
        const journal = await ctx.db.get(sub.journalId);

        let disciplineName = "Неизвестная дисциплина";
        if (journal && "disciplineId" in journal && journal.disciplineId) {
          const class9Item = class9Map.get(journal.disciplineId as any);
          if (class9Item) disciplineName = class9Item.learningOutcome;
        }

        return {
          ...sub,
          journal,
          fromTeacher: teacherMap.get(sub.fromTeacherId),
          toTeacher: teacherMap.get(sub.toTeacherId),
          disciplineName,
        };
      })
    );

    enriched.sort((a, b) => b.createdAt - a.createdAt);

    return enriched;
  },
});

export const listProtocolWithRoleAccess: any = action({
  args: {
    token: v.string(),
    selectedTeacherId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { token, selectedTeacherId } = args;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[listProtocolWithRoleAccess] JWT_SECRET not configured");
      return [];
    }

    let payload;
    try {
      payload = await validateToken(token, jwtSecret);
    } catch (error) {
      console.log("[listProtocolWithRoleAccess] Invalid token:", error);
      return [];
    }

    const protocolEntries = await ctx.runQuery(
      internal.substitutions.queries.listProtocolWithRoleAccessInternal,
      {
        userId: payload.userId,
        userRoles: payload.roles,
        selectedTeacherId,
      }
    );

    return protocolEntries;
  },
});
