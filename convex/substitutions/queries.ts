import { query, internalQuery, action } from "../_generated/server";
import { v } from "convex/values";
import { validateToken } from "../auth/helpers";
import { internal } from "../_generated/api";

/**
 * Get all substitutions for a teacher (receiving)
 */
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
    let substitutionsQuery = ctx.db
      .query("substitutions")
      .withIndex("by_toUser_status", (q) => q.eq("toUserId", args.toUserId));

    const allSubstitutions = await substitutionsQuery.collect();

    // Filter by status if provided
    const substitutions = args.status
      ? allSubstitutions.filter((s) => s.status === args.status)
      : allSubstitutions;

    // Enrich with journal and teacher data
    const enrichedSubstitutions = await Promise.all(
      substitutions.map(async (sub) => {
        const journal = await ctx.db.get(sub.journalId);

        // Get from teacher details
        const fromTeachers = await ctx.db.query("teachers").collect();
        const fromTeacher = fromTeachers.find((t) => t._id === sub.fromTeacherId);

        // Get to teacher details
        const toTeachers = await ctx.db.query("teachers").collect();
        const toTeacher = toTeachers.find((t) => t._id === sub.toTeacherId);

        return {
          ...sub,
          journal,
          fromTeacher,
          toTeacher,
        };
      })
    );

    return enrichedSubstitutions;
  },
});

/**
 * Get all substitutions created by a teacher (original teacher)
 */
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
    let substitutionsQuery = ctx.db
      .query("substitutions")
      .withIndex("by_fromTeacher", (q) =>
        q.eq("fromTeacherId", args.fromTeacherId)
      );

    const allSubstitutions = await substitutionsQuery.collect();

    // Filter by status if provided
    const substitutions = args.status
      ? allSubstitutions.filter((s) => s.status === args.status)
      : allSubstitutions;

    // Enrich with journal and teacher data
    const enrichedSubstitutions = await Promise.all(
      substitutions.map(async (sub) => {
        const journal = await ctx.db.get(sub.journalId);

        // Get to teacher details
        const toTeachers = await ctx.db.query("teachers").collect();
        const toTeacher = toTeachers.find((t) => t._id === sub.toTeacherId);

        return {
          ...sub,
          journal,
          toTeacher,
        };
      })
    );

    return enrichedSubstitutions;
  },
});

/**
 * Get substitutions for a specific journal
 */
export const getJournalSubstitutions = query({
  args: {
    journalId: v.id("journals"),
  },
  handler: async (ctx, args) => {
    const substitutions = await ctx.db
      .query("substitutions")
      .withIndex("by_journal", (q) => q.eq("journalId", args.journalId))
      .collect();

    // Enrich with teacher data
    const enrichedSubstitutions = await Promise.all(
      substitutions.map(async (sub) => {
        // Get from teacher details
        const fromTeachers = await ctx.db.query("teachers").collect();
        const fromTeacher = fromTeachers.find((t) => t._id === sub.fromTeacherId);

        // Get to teacher details
        const toTeachers = await ctx.db.query("teachers").collect();
        const toTeacher = toTeachers.find((t) => t._id === sub.toTeacherId);

        return {
          ...sub,
          fromTeacher,
          toTeacher,
        };
      })
    );

    return enrichedSubstitutions;
  },
});

/**
 * Get a single substitution by ID
 */
export const getSubstitution = query({
  args: {
    substitutionId: v.id("substitutions"),
  },
  handler: async (ctx, args) => {
    const substitution = await ctx.db.get(args.substitutionId);

    if (!substitution) {
      throw new Error("Замена не найдена");
    }

    // Enrich with related data
    const journal = await ctx.db.get(substitution.journalId);

    // Get teacher details
    const teachers = await ctx.db.query("teachers").collect();
    const fromTeacher = teachers.find((t) => t._id === substitution.fromTeacherId);
    const toTeacher = teachers.find((t) => t._id === substitution.toTeacherId);

    return {
      ...substitution,
      journal,
      fromTeacher,
      toTeacher,
    };
  },
});

/**
 * Get pending substitution count for a teacher
 */
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

/**
 * Internal query to fetch protocol entries (substitutions) with role-based filtering.
 * Called by the listProtocolWithRoleAccess action after JWT validation.
 */
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

    // For teachers: only their own substitutions (both sent and received)
    if (isTeacher && !isAdmin) {
      // Get teacher record to find teacher ID
      const teacherRecord = await ctx.db
        .query("teachers")
        .withIndex("by_userId", (q) => q.eq("userId", userId as any))
        .unique();

      if (!teacherRecord) {
        return [];
      }

      // Get both sent and received substitutions
      const [sentSubstitutions, receivedSubstitutions] = await Promise.all([
        ctx.db
          .query("substitutions")
          .withIndex("by_fromTeacher", (q) =>
            q.eq("fromTeacherId", teacherRecord._id)
          )
          .collect(),
        ctx.db
          .query("substitutions")
          .withIndex("by_toTeacher", (q) =>
            q.eq("toTeacherId", teacherRecord._id)
          )
          .collect(),
      ]);

      // Merge and deduplicate by _id
      const substitutionMap = new Map();
      for (const sub of [...sentSubstitutions, ...receivedSubstitutions]) {
        substitutionMap.set(sub._id, sub);
      }
      substitutions = Array.from(substitutionMap.values());
    } else {
      // For admins: all substitutions OR filtered by selectedTeacherId
      if (selectedTeacherId && selectedTeacherId !== "all") {
        // Admin viewing a specific teacher's substitutions
        const [sentSubstitutions, receivedSubstitutions] = await Promise.all([
          ctx.db
            .query("substitutions")
            .withIndex("by_fromTeacher", (q) =>
              q.eq("fromTeacherId", selectedTeacherId)
            )
            .collect(),
          ctx.db
            .query("substitutions")
            .withIndex("by_toTeacher", (q) =>
              q.eq("toTeacherId", selectedTeacherId)
            )
            .collect(),
        ]);

        // Merge and deduplicate
        const substitutionMap = new Map();
        for (const sub of [...sentSubstitutions, ...receivedSubstitutions]) {
          substitutionMap.set(sub._id, sub);
        }
        substitutions = Array.from(substitutionMap.values());
      } else {
        // Admin viewing all substitutions
        substitutions = await ctx.db.query("substitutions").collect();
      }
    }

    // Enrich with journal and teacher data
    const enrichedSubstitutions = await Promise.all(
      substitutions.map(async (sub) => {
        const [journal, fromTeacher, toTeacher] = await Promise.all([
          ctx.db.get(sub.journalId),
          ctx.db
            .query("teachers")
            .collect()
            .then((teachers) => teachers.find((t) => t._id === sub.fromTeacherId)),
          ctx.db
            .query("teachers")
            .collect()
            .then((teachers) => teachers.find((t) => t._id === sub.toTeacherId)),
        ]);

        // Get discipline name from journal
        let disciplineName = "Неизвестная дисциплина";
        if (journal && "disciplineId" in journal) {
          const class9Items = await ctx.db.query("class9Items").collect();
          const class9Item = class9Items.find((c) => c._id === journal.disciplineId);
          if (class9Item) {
            disciplineName = class9Item.learningOutcome;
          }
        }

        return {
          ...sub,
          journal,
          fromTeacher,
          toTeacher,
          disciplineName,
        };
      })
    );

    // Sort by creation date (newest first)
    enrichedSubstitutions.sort((a, b) => b.createdAt - a.createdAt);

    return enrichedSubstitutions;
  },
});

/**
 * Get protocol entries (substitutions) with role-based access control.
 * Action that validates JWT and delegates to internal query.
 *
 * @param token - JWT token for authentication
 * @param selectedTeacherId - Optional teacher ID for admin filtering
 * @returns Array of protocol entries (substitutions) with enriched data
 */
export const listProtocolWithRoleAccess: any = action({
  args: {
    token: v.string(),
    selectedTeacherId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args): Promise<any> => {
    const { token, selectedTeacherId } = args;

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("[listProtocolWithRoleAccess] JWT_SECRET not configured");
      return [];
    }

    // Validate token
    let payload;
    try {
      payload = await validateToken(token, jwtSecret);
    } catch (error) {
      console.log("[listProtocolWithRoleAccess] Invalid token:", error);
      return [];
    }

    // Fetch protocol entries using internal query with validated user info
    const protocolEntries: any = await ctx.runQuery(
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
