import { query } from "../_generated/server";
import { v } from "convex/values";

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
