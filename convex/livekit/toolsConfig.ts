import { z } from 'zod';

export const MARS_TOOLS_CONFIG = {
  getCurrentUser: {
    description: 'Get the current logged-in user: name, roles, linked IDs.',
    parameters: z.object({}).passthrough(),
  },
  getAcademicYear: {
    description: 'Get the current active academic year and its semesters.',
    parameters: z.object({}).passthrough(),
  },
  getDisciplineList: {
    description: 'List all disciplines (subjects) in the system.',
    parameters: z.object({}).passthrough(),
  },
  listMyJournals: {
    description: 'List journals for the current user. Teachers see their own journals. Students see journals they are enrolled in. Admins see all.',
    parameters: z.object({}).passthrough(),
  },
  getJournalMarks: {
    description: 'Get marks in a specific journal. Teachers and admins see all marks. Students only see their own marks.',
    parameters: z.object({ journalId: z.string().describe('The journal _id') }),
  },
  getMyMarks: {
    description: 'Get all marks for the current student across all enrolled journals. Only works for STUDENT role.',
    parameters: z.object({}).passthrough(),
  },
  getSchedule: {
    description: 'Get calendar events / schedule. Teachers see their own events. Students see events they are participants in. Admins see all. Optionally filter by date range (ISO date strings).',
    parameters: z.object({
      startDate: z.string().optional().describe('ISO date, e.g. 2026-03-01'),
      endDate: z.string().optional().describe('ISO date, e.g. 2026-03-31'),
    }),
  },
  getStudentList: {
    description: 'List students. Use this FIRST when looking up a student by name — pass the name as "search" to get their _id. Returns specialtyName resolved to a human-readable string. Optionally filter by specialty. Teacher and admin only.',
    parameters: z.object({
      search: z.string().optional().describe('Name fragment to search'),
      specialty: z.string().optional().describe('Filter by specialty'),
    }),
  },
  getStudentCard: {
    description: 'Get full info for one student by their _id. Use after finding the student via getStudentList. Never ask the user for this ID — resolve it from search results. Teacher and admin only.',
    parameters: z.object({ studentId: z.string().describe('The student _id') }),
  },
  getStudentJournals: {
    description: "Get all journals a specific student is enrolled in, with human-readable discipline names resolved. Use when asked about a student's subjects, classes, or journals. Call after finding the student via getStudentList. Teacher and admin only.",
    parameters: z.object({ studentId: z.string().describe('The student _id (from getStudentList results)') }),
  },
  getMarksForStudent: {
    description: 'Get ALL marks for a specific student across all their journals in one call. Use this instead of calling getJournalMarks for each journal separately — it avoids hitting tool call limits. Returns marks with columnDate (ISO date) and columnLabel for sorting. Teacher and admin only.',
    parameters: z.object({ studentId: z.string().describe('The student _id (from getStudentList results)') }),
  },
  getTeacherList: {
    description: 'List all teachers. Admin only.',
    parameters: z.object({ search: z.string().optional().describe('Name fragment to search') }),
  },
  getKTP: {
    description: 'Get the calendar-thematic plan (КТП) for a calendar event. Teacher and admin only.',
    parameters: z.object({ eventId: z.string().describe('calendarEvent _id') }),
  },
  getSubstitutions: {
    description: 'Get substitution (замена) requests involving the current teacher. Optionally filter by status.',
    parameters: z.object({ status: z.enum(['pending', 'accepted', 'rejected', 'completed']).optional().describe('Filter by status') }),
  },
  getNotifications: {
    description: 'Get unread notifications for the current user.',
    parameters: z.object({}).passthrough(),
  },
} as const;
