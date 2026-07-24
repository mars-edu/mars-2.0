import { defineTable } from "convex/server";
import { v } from "convex/values";

export const journalsTables = {
  /**
   * Journals - grade books for classes
   * Migrated from: journalStore.ts + Prisma Journal
   */
  journals: defineTable({
    calendarEventId: v.optional(v.string()), // Reference to calendarEvents
    disciplineId: v.string(), // Reference to rupEntries
    groupName: v.optional(v.string()),
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    isMixedGroup: v.optional(v.boolean()),
    isIndividualJournal: v.optional(v.boolean()),
    mergedJournalIds: v.optional(v.array(v.string())),
    parentIndividualJournalId: v.optional(v.string()),
    workloadId: v.optional(v.string()), // Back-ref when generated from a workload
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_calendarEvent", ["calendarEventId"])
    .index("by_academicYear_semester", ["academicYearId", "semesterId"])
    .index("by_workload", ["workloadId"]),

  /**
   * Journal-Student relationships
   * Migrated from: Prisma JournalStudent
   */
  journalStudents: defineTable({
    journalId: v.id("journals"),
    studentId: v.string(), // Reference to students
    createdAt: v.string(),
  })
    .index("by_journal", ["journalId"])
    .index("by_student", ["studentId"])
    .index("by_journal_student", ["journalId", "studentId"]),

  /**
   * Marks/Grades for students
   * Migrated from: marksStore.ts + Prisma Mark
   */
  marks: defineTable({
    journalId: v.id("journals"),
    studentId: v.string(), // Reference to students
    columnIndex: v.number(),
    rowIndex: v.number(),
    value: v.optional(v.string()),
    columnType: v.union(v.literal("date"), v.literal("session")),
    columnDate: v.optional(v.string()), // ISO date for date columns
    columnLabel: v.optional(v.string()), // Label for session columns
    controlType: v.optional(
      v.union(v.literal("intermediate"), v.literal("final"))
    ),
    controlId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    scheduledControlId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_journal", ["journalId"])
    .index("by_student", ["studentId"])
    .index("by_journal_student", ["journalId", "studentId"])
    .index("by_journal_student_column_row", [
      "journalId",
      "studentId",
      "columnIndex",
      "rowIndex",
    ]),

  /**
   * Mark history - audit trail for grade changes
   * Migrated from: journalHistoryStore.ts + Prisma MarkHistory
   */
  markHistory: defineTable({
    journalId: v.id("journals"),
    studentId: v.string(),
    columnIndex: v.number(),
    rowIndex: v.number(),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    columnLabel: v.optional(v.string()),
    columnDate: v.optional(v.string()),
    changedBy: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_journal", ["journalId"])
    .index("by_journal_student", ["journalId", "studentId"])
    .index("by_createdAt", ["createdAt"]),

  /**
   * Journal closure reminders - tracks journal closure deadlines
   * NEW: System-wide journal closure notifications
   */
  journalClosureReminders: defineTable({
    academicYearId: v.string(),
    semesterId: v.optional(v.id("academicYearSemesters")),
    deadline: v.string(), // ISO date - when journals must be closed
    message: v.string(), // Announcement text
    createdBy: v.id("users"), // Admin who created the reminder
    isActive: v.boolean(), // Whether this reminder is currently active
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_semester", ["semesterId"])
    .index("by_isActive", ["isActive"])
    .index("by_deadline", ["deadline"]),
};
