import { query, internalQuery, action } from "../_generated/server";
import { v } from "convex/values";
import { validateToken } from "../auth/helpers";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Get all calendar events, optionally filtered by teacher
 */
export const list = query({
  args: {
    teacherId: v.optional(v.string()),
    teacherUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If teacherId is provided, filter by teacher
    if (args.teacherId || args.teacherUserId) {
      const allEvents = await ctx.db.query("calendarEvents").collect();
      // Filter by either teacherId (teacher record ID) or teacherUserId (user ID)
      // because events may store either depending on who created them
      return allEvents.filter(
        (event) =>
          event.teacherId === args.teacherId ||
          event.teacherId === args.teacherUserId
      );
    }
    return await ctx.db.query("calendarEvents").collect();
  },
});

/**
 * Helper to fetch events by teacherId using index, handling the data inconsistency
 * where event.teacherId might be either teacher._id or user.id
 */
async function fetchEventsByTeacherIds(
  ctx: any,
  teacherRecordId: string,
  teacherUserId?: string
) {
  // Use by_teacherId index - O(log n + k) instead of O(n) full table scan
  const queries = [
    ctx.db
      .query("calendarEvents")
      .withIndex("by_teacherId", (q: any) => q.eq("teacherId", teacherRecordId))
      .collect(),
  ];

  // Also query by userId if different (handles data inconsistency)
  if (teacherUserId && teacherUserId !== teacherRecordId) {
    queries.push(
      ctx.db
        .query("calendarEvents")
        .withIndex("by_teacherId", (q: any) => q.eq("teacherId", teacherUserId))
        .collect()
    );
  }

  const results = await Promise.all(queries);

  // Dedupe by _id (same event might match both queries)
  const eventMap = new Map();
  for (const events of results) {
    for (const event of events) {
      eventMap.set(event._id, event);
    }
  }
  return Array.from(eventMap.values());
}

/**
 * Internal query to fetch events with role-based filtering.
 * Called by the listWithRoleAccess action after JWT validation.
 *
 * Optimizations:
 * - Uses by_teacherId index on calendarEvents (O(log n) vs O(n))
 * - Uses by_userId index on teachers (O(log n) vs O(n))
 * - Parallel queries with Promise.all where possible
 */
export const listWithRoleAccessInternal = internalQuery({
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

    // For teachers: only their own events
    if (isTeacher && !isAdmin) {
      const teacherRecord = await ctx.db
        .query("teachers")
        .withIndex("by_userId", (q) => q.eq("userId", userId as any))
        .unique();

      if (!teacherRecord) {
        return [];
      }

      return await fetchEventsByTeacherIds(ctx, teacherRecord._id, userId);
    }

    // For admins
    if (isAdmin) {
      if (selectedTeacherId) {
        const teacherRecord = await ctx.db
          .query("teachers")
          .filter((q) => q.eq(q.field("_id"), selectedTeacherId))
          .unique();

        return await fetchEventsByTeacherIds(
          ctx,
          selectedTeacherId,
          teacherRecord?.userId
        );
      }

      return await ctx.db.query("calendarEvents").collect();
    }

    return [];
  },
});

/** Calendar event type returned by queries */
export type CalendarEventDoc = {
  _id: string;
  _creationTime: number;
  rupEntryId: string;
  ktpId?: string;
  teacherId?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  participants: string[];
  color?: string;
  semester: string;
  useCustomPeriod: boolean;
  weeklySchedules?: Array<{
    weekId: number;
    startTime?: string;
    endTime?: string;
    startId?: string;
    endId?: string;
  }>;
  isIndividualJournal?: boolean;
  mergedJournalIds?: string[];
  parentIndividualJournalId?: string;
  isClosed?: boolean;
  journalSettings?: {
    calculationType: "calculated" | "manual";
    calculationMethod: "only-assigned" | "all-days";
  };
  createdAt: number;
  updatedAt: number;
};

/**
 * Get calendar events with role-based access control.
 * Validates JWT token on the backend and enforces role-based filtering.
 *
 * - ADMIN: Can see all events, or filter by a specific teacher using selectedTeacherId
 * - TEACHER: Can only see their own events (enforced by backend regardless of selectedTeacherId)
 * - Other roles: Returns empty array
 *
 * The backend validates the JWT token and enforces these rules,
 * making it impossible for a teacher to see other teachers' events.
 */
export const listWithRoleAccess = action({
  args: {
    // JWT token from frontend
    token: v.string(),
    // Optional teacher ID to filter (only works for admins)
    selectedTeacherId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args): Promise<CalendarEventDoc[]> => {
    const { token, selectedTeacherId } = args;

    // Validate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not configured");
    }

    let payload: { userId: string; roles: string[] };
    try {
      payload = await validateToken(token, jwtSecret);
    } catch (error) {
      // Invalid token - return empty array
      console.log("[listWithRoleAccess] Invalid token:", error);
      return [];
    }

    // Fetch events using internal query with validated user info
    const events = await ctx.runQuery(
      internal.calendarEvents.queries.listWithRoleAccessInternal,
      {
        userId: payload.userId,
        userRoles: payload.roles,
        selectedTeacherId,
      }
    );

    return events as CalendarEventDoc[];
  },
});

/**
 * Get calendar event by ID
 */
export const getById = query({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get calendar event by ID with participant names resolved server-side.
 * Eliminates the client-side race where participant rows render before the
 * global student store has loaded.
 */
export const getByIdWithParticipants = query({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) return null;
    const participants = await Promise.all(
      (event.participants ?? []).map((sid: string) =>
        ctx.db.get(sid as any),
      ),
    );
    const participantsResolved = participants
      .filter((s: any): s is any => Boolean(s))
      .map((s: any) => ({
        id: s._id,
        surname: s.surname ?? "",
        firstName: s.firstName ?? "",
        patronymic: s.patronymic ?? "",
      }));
    return { ...event, participantsResolved };
  },
});

/**
 * Get calendar events by semester
 */
export const getBySemester = query({
  args: { semester: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_semester", (q) => q.eq("semester", args.semester))
      .collect();
  },
});

/**
 * Get calendar events by teacher
 */
export const getByTeacher = query({
  args: { teacherId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", args.teacherId))
      .collect();
  },
});

/**
 * Get calendar events by RUP entry ID
 */
export const getByRupEntryId = query({
  args: { rupEntryId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", args.rupEntryId))
      .collect();
  },
});

/**
 * Get calendar events by date range
 */
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db.query("calendarEvents").collect();

    return allEvents.filter((event) => {
      return event.startDate >= args.startDate && event.startDate <= args.endDate;
    });
  },
});
