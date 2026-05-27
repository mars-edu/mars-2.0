import { internalQuery, action } from "../_generated/server";
import { v } from "convex/values";
import { validateToken } from "../auth/helpers";
import { internal } from "../_generated/api";

export const listMakeupRequestsInternal = internalQuery({
  args: {
    userId: v.string(),
    userRoles: v.array(v.string()),
    selectedTeacherId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { userId, userRoles, selectedTeacherId } = args;
    const isAdmin = userRoles.includes("ADMIN");
    const isTeacher = userRoles.includes("TEACHER");

    if (!isAdmin && !isTeacher) return [];

    let requests;

    if (isTeacher && !isAdmin) {
      const teacherRecord = await ctx.db
        .query("teachers")
        .withIndex("by_userId", (q) => q.eq("userId", userId as any))
        .unique();
      if (!teacherRecord) return [];

      requests = await ctx.db
        .query("makeupRequests")
        .withIndex("by_teacher", (q) =>
          q.eq("teacherId", teacherRecord._id)
        )
        .collect();
    } else if (selectedTeacherId && selectedTeacherId !== "all") {
      requests = await ctx.db
        .query("makeupRequests")
        .withIndex("by_teacher", (q) =>
          q.eq("teacherId", selectedTeacherId)
        )
        .collect();
    } else {
      requests = await ctx.db.query("makeupRequests").collect();
    }

    const allTeachers = await ctx.db.query("teachers").collect();
    const teacherMap = new Map(
      allTeachers.map((t) => [t._id as string, t])
    );

    const enriched = requests.map((req) => ({
      ...req,
      teacher: teacherMap.get(req.teacherId),
    }));

    enriched.sort((a, b) => b.createdAt - a.createdAt);
    return enriched;
  },
});

export const listMakeupRequestsWithRoleAccess: any = action({
  args: {
    token: v.string(),
    selectedTeacherId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return [];

    let payload;
    try {
      payload = await validateToken(args.token, jwtSecret);
    } catch {
      return [];
    }

    return ctx.runQuery(
      internal.makeupRequests.queries.listMakeupRequestsInternal,
      {
        userId: payload.userId,
        userRoles: payload.roles,
        selectedTeacherId: args.selectedTeacherId,
      }
    );
  },
});
