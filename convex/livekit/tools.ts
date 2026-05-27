// convex/livekit/tools.ts
import { dynamicTool } from 'ai';
import { z } from 'zod';
import { api } from '../_generated/api';
import type { ActionCtx } from '../_generated/server';
import type { Id, Doc } from '../_generated/dataModel';

export interface ResolvedUser {
  userId: Id<'users'>;
  roles: string[];
  firstName: string;
  lastName: string;
  teacherId?: Id<'teachers'>;
  studentId?: string; // students._id as string (no userId index on students table)
}

// Tool result: either data or a typed error object
type ToolError = { error: string };
type ToolResult = Record<string, unknown> | Record<string, unknown>[] | ToolError | unknown[];

// students.specialty stores a legacyId UUID, not a Convex Id<'specialties'>.
// Build a map from legacyId → name by loading all specialties once.
async function buildSpecialtyMap(ctx: ActionCtx): Promise<Record<string, string>> {
  const all = await ctx.runQuery(api.specialties.queries.list, {});
  const map: Record<string, string> = {};
  for (const sp of all) {
    if (sp.legacyId) map[sp.legacyId] = sp.name;
  }
  return map;
}

function accessDenied(): ToolError {
  return { error: 'Access denied' };
}

export function createMarsTools(
  ctx: ActionCtx,
  user: ResolvedUser,
): Record<string, ReturnType<typeof dynamicTool>> {
  const isAdmin = user.roles.includes('ADMIN');
  const isTeacher = user.roles.includes('TEACHER');
  const isStudent = user.roles.includes('STUDENT');

  return {
    // ── Identity ─────────────────────────────────────────────────────────────
    getCurrentUser: dynamicTool({
      description: 'Get the current logged-in user: name, roles, linked IDs.',
      inputSchema: z.object({}).passthrough(),
      execute: async (): Promise<ToolResult> => ({
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles,
        teacherId: user.teacherId ?? null,
        studentId: user.studentId ?? null,
      }),
    }),

    // ── Academic Year ─────────────────────────────────────────────────────────
    getAcademicYear: dynamicTool({
      description: 'Get the current active academic year and its semesters.',
      inputSchema: z.object({}).passthrough(),
      execute: async (): Promise<ToolResult> => {
        const year = await ctx.runQuery(api.academicYears.queries.getActive, {});
        return (year as Record<string, unknown>) ?? { error: 'No active academic year found' };
      },
    }),

    // ── Disciplines ───────────────────────────────────────────────────────────
    getDisciplineList: dynamicTool({
      description: 'List all disciplines (subjects) in the system.',
      inputSchema: z.object({}).passthrough(),
      execute: async (): Promise<ToolResult> =>
        await ctx.runQuery(api.disciplines.queries.list, {}),
    }),

    // ── Journals ──────────────────────────────────────────────────────────────
    listMyJournals: dynamicTool({
      description:
        'List journals for the current user. Teachers see their own journals. Students see journals they are enrolled in. Admins see all.',
      inputSchema: z.object({}).passthrough(),
      execute: async (): Promise<ToolResult> => {
        if (isAdmin) {
          return await ctx.runQuery(api.journals.queries.list, {});
        }
        if (isTeacher && user.teacherId) {
          const events = await ctx.runQuery(
            api.calendarEvents.queries.getByTeacher,
            { teacherId: user.teacherId },
          );
          const eventIds = new Set(events.map((e) => e._id));
          const allJournals = await ctx.runQuery(api.journals.queries.list, {});
          return allJournals.filter((j) => eventIds.has(j.calendarEventId as Id<'calendarEvents'>));
        }
        if (isStudent && user.studentId) {
          return (await ctx.runQuery(api.journals.queries.getByStudentId, {
            studentId: user.studentId,
          })) as Doc<'journals'>[];
        }
        return accessDenied();
      },
    }),

    getJournalMarks: dynamicTool({
      description:
        'Get marks in a specific journal. Teachers and admins see all marks. Students only see their own marks.',
      inputSchema: z.object({
        journalId: z.string().describe('The journal _id'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        const { journalId } = input as { journalId: string };
        if (isAdmin || isTeacher) {
          return await ctx.runQuery(api.marks.queries.getJournalMarks, {
            journalId: journalId as Id<'journals'>,
          });
        }
        if (isStudent && user.studentId) {
          return await ctx.runQuery(api.marks.queries.getStudentMarks, {
            journalId: journalId as Id<'journals'>,
            studentId: user.studentId,
          });
        }
        return accessDenied();
      },
    }),

    getMyMarks: dynamicTool({
      description:
        'Get all marks for the current student across all enrolled journals. Only works for STUDENT role.',
      inputSchema: z.object({}).passthrough(),
      execute: async (): Promise<ToolResult> => {
        if (!isStudent || !user.studentId) {
          return { error: 'Only students can use this tool' };
        }
        return await ctx.runQuery(api.marks.queries.getAllByStudentId, {
          studentId: user.studentId,
        });
      },
    }),

    // ── Schedule ──────────────────────────────────────────────────────────────
    getSchedule: dynamicTool({
      description:
        'Get calendar events / schedule. Teachers see their own events. Students see events they are participants in. Admins see all. Optionally filter by date range (ISO date strings).',
      inputSchema: z.object({
        startDate: z.string().optional().describe('ISO date, e.g. 2026-03-01'),
        endDate: z.string().optional().describe('ISO date, e.g. 2026-03-31'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        const { startDate, endDate } = input as { startDate?: string; endDate?: string };
        if (isTeacher && user.teacherId) {
          const events = await ctx.runQuery(
            api.calendarEvents.queries.getByTeacher,
            { teacherId: user.teacherId },
          );
          return applyDateFilter(events, startDate, endDate);
        }
        if (isAdmin) {
          if (startDate && endDate) {
            return await ctx.runQuery(api.calendarEvents.queries.getByDateRange, {
              startDate: startDate,
              endDate: endDate,
            } as { startDate: string; endDate: string });
          }
          return await ctx.runQuery(api.calendarEvents.queries.list, {});
        }
        if (isStudent && user.studentId) {
          const studentId = user.studentId;
          const allEvents = await ctx.runQuery(api.calendarEvents.queries.list, {});
          const myEvents = allEvents.filter(
            (e) => Array.isArray(e.participants) && e.participants.includes(studentId),
          );
          return applyDateFilter(myEvents, startDate, endDate);
        }
        return accessDenied();
      },
    }),

    // ── Students ──────────────────────────────────────────────────────────────
    getStudentList: dynamicTool({
      description:
        'List students. Use this FIRST when looking up a student by name — pass the name as "search" to get their _id. Returns specialtyName resolved to a human-readable string. Optionally filter by specialty. Teacher and admin only.',
      inputSchema: z.object({
        search: z.string().optional().describe('Name fragment to search'),
        specialty: z.string().optional().describe('Filter by specialty'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        if (!isAdmin && !isTeacher) return accessDenied();
        const { search, specialty } = input as { search?: string; specialty?: string };
        let students: Doc<'students'>[];
        if (search) {
          students = (await ctx.runQuery(api.students.queries.search, { searchTerm: search })) as Doc<'students'>[];
        } else if (specialty) {
          students = (await ctx.runQuery(api.students.queries.getBySpecialty, { specialty })) as Doc<'students'>[];
        } else {
          students = await ctx.runQuery(api.students.queries.list, {});
        }
        // students.specialty stores legacyId (UUID), not Convex _id — resolve via map.
        const specialtyMap = await buildSpecialtyMap(ctx);
        return students.map((s) => ({
          ...s,
          specialtyName: s.specialty ? (specialtyMap[s.specialty] ?? null) : null,
        }));
      },
    }),

    getStudentCard: dynamicTool({
      description:
        'Get full info for one student by their _id. Use after finding the student via getStudentList. Never ask the user for this ID — resolve it from search results. Teacher and admin only.',
      inputSchema: z.object({
        studentId: z.string().describe('The student _id'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        if (!isAdmin && !isTeacher) return accessDenied();
        const { studentId } = input as { studentId: string };
        const student = await ctx.runQuery(api.students.queries.getById, {
          id: studentId as Id<'students'>,
        });
        if (!student) return { error: 'Student not found' };
        // students.specialty stores legacyId (UUID), not Convex _id — resolve via map.
        const specialtyMap = await buildSpecialtyMap(ctx);
        return {
          ...student,
          specialtyName: student.specialty ? (specialtyMap[student.specialty] ?? null) : null,
        };
      },
    }),

    getStudentJournals: dynamicTool({
      description:
        "Get all journals a specific student is enrolled in, with human-readable discipline names resolved. Use when asked about a student's subjects, classes, or journals. Call after finding the student via getStudentList. Teacher and admin only.",
      inputSchema: z.object({
        studentId: z.string().describe('The student _id (from getStudentList results)'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        if (!isAdmin && !isTeacher) return accessDenied();
        const { studentId } = input as { studentId: string };
        const journals = (await ctx.runQuery(api.journals.queries.getByStudentId, {
          studentId,
        })) as Doc<'journals'>[];
        // Resolve disciplineId → moduleName from rupEntries so AI never shows raw UUIDs
        return Promise.all(
          journals.map(async (j) => {
            let disciplineName: string | null = null;
            if (j.disciplineId) {
              const item = await ctx.runQuery(api.rupEntries.queries.getById, {
                id: j.disciplineId as Id<'rupEntries'>,
              });
              disciplineName = item?.moduleName ?? null;
            }
            return { ...j, disciplineName };
          }),
        );
      },
    }),

    getMarksForStudent: dynamicTool({
      description:
        'Get ALL marks for a specific student across all their journals in one call. Use this instead of calling getJournalMarks for each journal separately — it avoids hitting tool call limits. Returns marks with columnDate (ISO date) and columnLabel for sorting. Teacher and admin only.',
      inputSchema: z.object({
        studentId: z.string().describe('The student _id (from getStudentList results)'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        if (!isAdmin && !isTeacher) return accessDenied();
        const { studentId } = input as { studentId: string };
        return await ctx.runQuery(api.marks.queries.getAllByStudentId, { studentId });
      },
    }),

    // ── Teachers ──────────────────────────────────────────────────────────────
    getTeacherList: dynamicTool({
      description: 'List all teachers. Admin only.',
      inputSchema: z.object({
        search: z.string().optional().describe('Name fragment to search'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        if (!isAdmin) return { error: 'Access denied — admin only' };
        const { search } = input as { search?: string };
        if (search) {
          return (await ctx.runQuery(api.teachers.queries.search, { searchTerm: search })) as Record<string, unknown>[];
        }
        return (await ctx.runQuery(api.teachers.queries.list, {})) as Record<string, unknown>[];
      },
    }),

    // ── KTP ───────────────────────────────────────────────────────────────────
    getKTP: dynamicTool({
      description:
        'Get the calendar-thematic plan (КТП) for a calendar event. Teacher and admin only.',
      inputSchema: z.object({
        eventId: z.string().describe('calendarEvent _id'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        if (!isAdmin && !isTeacher) return accessDenied();
        const { eventId } = input as { eventId: string };
        return (await ctx.runQuery(api.ktps.queries.getByEventId, {
          eventId: eventId as Id<'calendarEvents'>,
        })) as unknown as Record<string, unknown>[];
      },
    }),

    // ── Substitutions ─────────────────────────────────────────────────────────
    getSubstitutions: dynamicTool({
      description:
        'Get substitution (замена) requests involving the current teacher. Optionally filter by status.',
      inputSchema: z.object({
        status: z
          .enum(['pending', 'accepted', 'rejected', 'completed'])
          .optional()
          .describe('Filter by status'),
      }),
      execute: async (input: unknown): Promise<ToolResult> => {
        const { status } = input as { status?: 'pending' | 'accepted' | 'rejected' | 'completed' };
        if (isTeacher) {
          return (await ctx.runQuery(
            api.substitutions.queries.getTeacherSubstitutions,
            { toUserId: user.userId, status },
          )) as Record<string, unknown>[];
        }
        if (isAdmin && user.teacherId) {
          return (await ctx.runQuery(
            api.substitutions.queries.getCreatedSubstitutions,
            { fromTeacherId: user.teacherId, status },
          )) as Record<string, unknown>[];
        }
        return { error: 'No substitution query available for this role. Use the Substitutions page instead.' };
      },
    }),

    // ── Notifications ─────────────────────────────────────────────────────────
    getNotifications: dynamicTool({
      description: 'Get unread notifications for the current user.',
      inputSchema: z.object({}).passthrough(),
      execute: async (): Promise<ToolResult> =>
        (await ctx.runQuery(api.notifications.queries.getUserNotifications, {
          userId: user.userId,
          status: 'unread',
        })) as Record<string, unknown>[],
    }),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyDateFilter<T extends { startDate?: string; endDate?: string }>(
  events: T[],
  startDate?: string,
  endDate?: string,
): T[] {
  return events.filter((e) => {
    if (startDate && e.startDate && e.startDate < startDate) return false;
    if (endDate && e.endDate && e.endDate > endDate) return false;
    return true;
  });
}
