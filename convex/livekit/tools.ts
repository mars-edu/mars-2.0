// convex/livekit/tools.ts
import { tool, dynamicTool } from 'ai';
import { z } from 'zod';
import { api } from '../_generated/api';
import type { ActionCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

export interface ResolvedUser {
  userId: Id<'users'>;
  roles: string[];
  firstName: string;
  lastName: string;
  teacherId?: Id<'teachers'>;
  studentId?: string; // students._id as string (no userId index on students table)
}

export function createMarsTools(ctx: ActionCtx, user: ResolvedUser): any {
  const isAdmin = user.roles.includes('ADMIN');
  const isTeacher = user.roles.includes('TEACHER');
  const isStudent = user.roles.includes('STUDENT');

  return {
    // ── Identity ─────────────────────────────────────────────────────────────
    getCurrentUser: dynamicTool({
      description: 'Get the current logged-in user: name, roles, linked IDs.',
      inputSchema: z.object({}).passthrough(),
      execute: async () => {
        const result = {
          name: `${user.firstName} ${user.lastName}`,
          roles: user.roles,
          teacherId: user.teacherId ?? null,
          studentId: user.studentId ?? null,
        };
        return result as any;
      },
    } as any),

    // ── Academic Year ─────────────────────────────────────────────────────────
    getAcademicYear: dynamicTool({
      description: 'Get the current active academic year and its semesters.',
      inputSchema: z.object({}).passthrough(),
      execute: async () => {
        const year = await ctx.runQuery(api.academicYears.queries.getActive, {});
        return (year ?? { error: 'No active academic year found' }) as any;
      },
    } as any),

    // ── Disciplines ───────────────────────────────────────────────────────────
    getDisciplineList: dynamicTool({
      description: 'List all disciplines (subjects) in the system.',
      inputSchema: z.object({}).passthrough(),
      execute: async () => {
        const result = await ctx.runQuery(api.disciplines.queries.list, {});
        return result as any;
      },
    } as any),

    // ── Journals ──────────────────────────────────────────────────────────────
    listMyJournals: dynamicTool({
      description:
        'List journals for the current user. Teachers see their own journals. Students see journals they are enrolled in. Admins see all.',
      inputSchema: z.object({}).passthrough(),
      execute: async () => {
        if (isAdmin) {
          return (await ctx.runQuery(api.journals.queries.list, {})) as any;
        }
        if (isTeacher && user.teacherId) {
          const events = await ctx.runQuery(
            api.calendarEvents.queries.getByTeacher,
            { teacherId: user.teacherId },
          );
          const eventIds = new Set((events as any[]).map((e: any) => e._id));
          const allJournals = await ctx.runQuery(api.journals.queries.list, {});
          return (allJournals as any[]).filter((j: any) =>
            eventIds.has(j.calendarEventId),
          ) as any;
        }
        if (isStudent && user.studentId) {
          return (await ctx.runQuery(api.journals.queries.getByStudentId, {
            studentId: user.studentId,
          })) as any;
        }
        return { error: 'Access denied' } as any;
      },
    } as any),

    getJournalMarks: dynamicTool({
      description:
        'Get marks in a specific journal. Teachers and admins see all marks. Students only see their own marks.',
      inputSchema: z.object({
        journalId: z.string().describe('The journal _id'),
      }),
      execute: async (input: { journalId: string }, options: any): Promise<unknown> => {
        if (isAdmin || isTeacher) {
          return (await ctx.runQuery(api.marks.queries.getJournalMarks, {
            journalId: input.journalId as Id<'journals'>,
          })) as any;
        }
        if (isStudent && user.studentId) {
          return (await ctx.runQuery(api.marks.queries.getStudentMarks, {
            journalId: input.journalId as Id<'journals'>,
            studentId: user.studentId,
          })) as any;
        }
        return { error: 'Access denied' } as any;
      },
    } as any),

    getMyMarks: dynamicTool({
      description:
        'Get all marks for the current student across all enrolled journals. Only works for STUDENT role.',
      inputSchema: z.object({}).passthrough(),
      execute: async () => {
        if (!isStudent || !user.studentId) {
          return { error: 'Only students can use this tool' } as any;
        }
        return (await ctx.runQuery(api.marks.queries.getAllByStudentId, {
          studentId: user.studentId,
        })) as any;
      },
    } as any),

    // ── Schedule ──────────────────────────────────────────────────────────────
    getSchedule: dynamicTool({
      description:
        'Get calendar events / schedule. Teachers see their own events. Students see events they are participants in. Admins see all. Optionally filter by date range (ISO date strings).',
      inputSchema: z.object({
        startDate: z.string().optional().describe('ISO date, e.g. 2026-03-01'),
        endDate: z.string().optional().describe('ISO date, e.g. 2026-03-31'),
      }),
      execute: async (input: { startDate?: string; endDate?: string }, options: any): Promise<unknown> => {
        if (isTeacher && user.teacherId) {
          const events = await ctx.runQuery(
            api.calendarEvents.queries.getByTeacher,
            { teacherId: user.teacherId },
          );
          return applyDateFilter(events as any[], input.startDate, input.endDate) as any;
        }
        if (isAdmin) {
          if (input.startDate && input.endDate) {
            return (await ctx.runQuery(api.calendarEvents.queries.getByDateRange, {
              startDate: input.startDate,
              endDate: input.endDate,
            })) as any;
          }
          return (await ctx.runQuery(api.calendarEvents.queries.list, {})) as any;
        }
        if (isStudent && user.studentId) {
          const allEvents = await ctx.runQuery(
            api.calendarEvents.queries.list,
            {},
          );
          const myEvents = (allEvents as any[]).filter((e: any) =>
            Array.isArray(e.participants) &&
            e.participants.includes(user.studentId),
          );
          return applyDateFilter(myEvents, input.startDate, input.endDate) as any;
        }
        return { error: 'Access denied' } as any;
      },
    } as any),

    // ── Students ──────────────────────────────────────────────────────────────
    getStudentList: dynamicTool({
      description:
        'List students. Optionally filter by specialty or search by name. Teacher and admin only.',
      inputSchema: z.object({
        search: z.string().optional().describe('Name fragment to search'),
        specialty: z.string().optional().describe('Filter by specialty'),
      }),
      execute: async (input: { search?: string; specialty?: string }, options: any): Promise<unknown> => {
        if (!isAdmin && !isTeacher) return { error: 'Access denied' } as any;
        if (input.search) {
          return (await ctx.runQuery(api.students.queries.search, {
            searchTerm: input.search,
          })) as any;
        }
        if (input.specialty) {
          return (await ctx.runQuery(api.students.queries.getBySpecialty, {
            specialty: input.specialty,
          })) as any;
        }
        return (await ctx.runQuery(api.students.queries.list, {})) as any;
      },
    } as any),

    getStudentCard: dynamicTool({
      description:
        'Get full info for one student by their ID. Teacher and admin only.',
      inputSchema: z.object({
        studentId: z.string().describe('The student _id'),
      }),
      execute: async (input: { studentId: string }, options: any): Promise<unknown> => {
        if (!isAdmin && !isTeacher) return { error: 'Access denied' } as any;
        const student = await ctx.runQuery(api.students.queries.getById, {
          id: input.studentId as Id<'students'>,
        });
        return (student ?? { error: 'Student not found' }) as any;
      },
    } as any),

    // ── Teachers ──────────────────────────────────────────────────────────────
    getTeacherList: dynamicTool({
      description: 'List all teachers. Admin only.',
      inputSchema: z.object({
        search: z.string().optional().describe('Name fragment to search'),
      }),
      execute: async (input: { search?: string }, options: any): Promise<unknown> => {
        if (!isAdmin) return { error: 'Access denied — admin only' } as any;
        if (input.search) {
          return (await ctx.runQuery(api.teachers.queries.search, { searchTerm: input.search })) as any;
        }
        return (await ctx.runQuery(api.teachers.queries.list, {})) as any;
      },
    } as any),

    // ── KTP ───────────────────────────────────────────────────────────────────
    getKTP: dynamicTool({
      description:
        'Get the calendar-thematic plan (КТП) for a calendar event. Teacher and admin only.',
      inputSchema: z.object({
        eventId: z.string().describe('calendarEvent _id'),
      }),
      execute: async (input: { eventId: string }, options: any): Promise<unknown> => {
        if (!isAdmin && !isTeacher) return { error: 'Access denied' } as any;
        return (await ctx.runQuery(api.ktps.queries.getByEventId, {
          eventId: input.eventId as Id<'calendarEvents'>,
        })) as any;
      },
    } as any),

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
      execute: async (input: { status?: 'pending' | 'accepted' | 'rejected' | 'completed' }, options: any): Promise<unknown> => {
        // getTeacherSubstitutions uses toUserId (the user receiving the substitution)
        if (isTeacher) {
          return (await ctx.runQuery(
            api.substitutions.queries.getTeacherSubstitutions,
            { toUserId: user.userId, status: input.status },
          )) as any;
        }
        if (isAdmin && user.teacherId) {
          return (await ctx.runQuery(
            api.substitutions.queries.getCreatedSubstitutions,
            { fromTeacherId: user.teacherId, status: input.status },
          )) as any;
        }
        // Admin without teacherId: no all-substitutions query exists yet
        return { error: 'No substitution query available for this role. Use the Substitutions page instead.' } as any;
      },
    } as any),

    // ── Notifications ─────────────────────────────────────────────────────────
    getNotifications: dynamicTool({
      description: 'Get unread notifications for the current user.',
      inputSchema: z.object({}).passthrough(),
      execute: async () =>
        (await ctx.runQuery(api.notifications.queries.getUserNotifications, {
          userId: user.userId,
          status: 'unread',
        })) as any,
    } as any),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function applyDateFilter(
  events: any[],
  startDate?: string,
  endDate?: string,
): any[] {
  return events.filter((e) => {
    if (startDate && e.startDate < startDate) return false;
    if (endDate && e.endDate > endDate) return false;
    return true;
  });
}
