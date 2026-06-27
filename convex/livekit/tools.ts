// convex/livekit/tools.ts
import { dynamicTool } from 'ai';
import { z } from 'zod';
import { api } from '../_generated/api';
import type { ActionCtx } from '../_generated/server';
import type { Id, Doc } from '../_generated/dataModel';

import { MARS_TOOLS_CONFIG } from './toolsConfig';

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

// students.specialty stores the canonical specialties._id (legacy D1 ids were
// migrated). Map _id → name; keep legacyId as a fallback for any env not yet
// migrated.
async function buildSpecialtyMap(ctx: ActionCtx): Promise<Record<string, string>> {
  const all = await ctx.runQuery(api.specialties.queries.list, {});
  const map: Record<string, string> = {};
  for (const sp of all) {
    map[sp._id] = sp.name;
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
      description: MARS_TOOLS_CONFIG.getCurrentUser.description,
      inputSchema: MARS_TOOLS_CONFIG.getCurrentUser.parameters,
      execute: async (): Promise<ToolResult> => ({
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles,
        teacherId: user.teacherId ?? null,
        studentId: user.studentId ?? null,
      }),
    }),

    // ── Academic Year ─────────────────────────────────────────────────────────
    getAcademicYear: dynamicTool({
      description: MARS_TOOLS_CONFIG.getAcademicYear.description,
      inputSchema: MARS_TOOLS_CONFIG.getAcademicYear.parameters,
      execute: async (): Promise<ToolResult> => {
        const year = await ctx.runQuery(api.academicYears.queries.getActive, {});
        return (year as Record<string, unknown>) ?? { error: 'No active academic year found' };
      },
    }),

    // ── Disciplines ───────────────────────────────────────────────────────────
    getDisciplineList: dynamicTool({
      description: MARS_TOOLS_CONFIG.getDisciplineList.description,
      inputSchema: MARS_TOOLS_CONFIG.getDisciplineList.parameters,
      execute: async (): Promise<ToolResult> =>
        await ctx.runQuery(api.disciplines.queries.list, {}),
    }),

    // ── Journals ──────────────────────────────────────────────────────────────
    listMyJournals: dynamicTool({
      description: MARS_TOOLS_CONFIG.listMyJournals.description,
      inputSchema: MARS_TOOLS_CONFIG.listMyJournals.parameters,
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
      description: MARS_TOOLS_CONFIG.getJournalMarks.description,
      inputSchema: MARS_TOOLS_CONFIG.getJournalMarks.parameters,
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
      description: MARS_TOOLS_CONFIG.getMyMarks.description,
      inputSchema: MARS_TOOLS_CONFIG.getMyMarks.parameters,
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
      description: MARS_TOOLS_CONFIG.getSchedule.description,
      inputSchema: MARS_TOOLS_CONFIG.getSchedule.parameters,
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
      description: MARS_TOOLS_CONFIG.getStudentList.description,
      inputSchema: MARS_TOOLS_CONFIG.getStudentList.parameters,
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
        // resolve student.specialty (canonical specialties._id) to a name via the map.
        const specialtyMap = await buildSpecialtyMap(ctx);
        return students.map((s) => ({
          ...s,
          specialtyName: s.specialty ? (specialtyMap[s.specialty] ?? null) : null,
        }));
      },
    }),

    getStudentCard: dynamicTool({
      description: MARS_TOOLS_CONFIG.getStudentCard.description,
      inputSchema: MARS_TOOLS_CONFIG.getStudentCard.parameters,
      execute: async (input: unknown): Promise<ToolResult> => {
        if (!isAdmin && !isTeacher) return accessDenied();
        const { studentId } = input as { studentId: string };
        const student = await ctx.runQuery(api.students.queries.getById, {
          id: studentId as Id<'students'>,
        });
        if (!student) return { error: 'Student not found' };
        // resolve student.specialty (canonical specialties._id) to a name via the map.
        const specialtyMap = await buildSpecialtyMap(ctx);
        return {
          ...student,
          specialtyName: student.specialty ? (specialtyMap[student.specialty] ?? null) : null,
        };
      },
    }),

    getStudentJournals: dynamicTool({
      description: MARS_TOOLS_CONFIG.getStudentJournals.description,
      inputSchema: MARS_TOOLS_CONFIG.getStudentJournals.parameters,
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
      description: MARS_TOOLS_CONFIG.getMarksForStudent.description,
      inputSchema: MARS_TOOLS_CONFIG.getMarksForStudent.parameters,
      execute: async (input: unknown): Promise<ToolResult> => {
        if (!isAdmin && !isTeacher) return accessDenied();
        const { studentId } = input as { studentId: string };
        return await ctx.runQuery(api.marks.queries.getAllByStudentId, { studentId });
      },
    }),

    // ── Teachers ──────────────────────────────────────────────────────────────
    getTeacherList: dynamicTool({
      description: MARS_TOOLS_CONFIG.getTeacherList.description,
      inputSchema: MARS_TOOLS_CONFIG.getTeacherList.parameters,
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
      description: MARS_TOOLS_CONFIG.getKTP.description,
      inputSchema: MARS_TOOLS_CONFIG.getKTP.parameters,
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
      description: MARS_TOOLS_CONFIG.getSubstitutions.description,
      inputSchema: MARS_TOOLS_CONFIG.getSubstitutions.parameters,
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
      description: MARS_TOOLS_CONFIG.getNotifications.description,
      inputSchema: MARS_TOOLS_CONFIG.getNotifications.parameters,
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
