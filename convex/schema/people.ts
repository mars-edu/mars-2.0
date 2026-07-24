import { defineTable } from "convex/server";
import { v } from "convex/values";

export const peopleTables = {
  /**
   * Students enrolled in the system
   * Migrated from: studentStore.ts
   */
  students: defineTable({
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    searchName: v.optional(v.string()), // denormalized for Convex text search
    specialty: v.string(), // specialty ID reference
    language: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    base: v.optional(v.number()), // 9 or 11
    academicYearId: v.optional(v.string()), // academic year ID reference
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("expelled"),
        v.literal("academic_leave"),
        v.literal("debt"),
        v.literal("graduated")
      )
    ),
    history: v.optional(
      v.array(
        v.object({
          date: v.string(),
          type: v.union(
            v.literal("transfer"),
            v.literal("expulsion"),
            v.literal("status_change"),
            v.literal("admission"),
            v.literal("restoration")
          ),
          orderNumber: v.string(),
          description: v.string(),
        })
      )
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_specialty", ["specialty"])
    .index("by_academicYear", ["academicYearId"])
    .index("by_specialty_academicYear", ["specialty", "academicYearId"])
    .searchIndex("search_by_name", {
      searchField: "searchName",
      filterFields: ["gender", "specialty", "language"],
    }),

  /**
   * Teachers/Instructors
   * Migrated from: teacherStore.ts
   */
  teachers: defineTable({
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    searchName: v.optional(v.string()), // denormalized for Convex text search
    position: v.string(),
    employmentYear: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    userId: v.optional(v.id("users")), // linked user account
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_position", ["position"])
    .searchIndex("search_by_name", {
      searchField: "searchName",
      filterFields: ["gender", "position"],
    }),

  /**
   * Teacher change history - audit trail for when a calendar event's primary teacher is changed
   * Triggered when a substitution with isPrimary=true is accepted
   */
  teacherChangeHistory: defineTable({
    calendarEventId: v.id("calendarEvents"),
    journalId: v.optional(v.id("journals")),
    substitutionId: v.optional(v.id("substitutions")),
    fromTeacherId: v.string(), // Previous primary teacher
    toTeacherId: v.string(), // New primary teacher
    fromTeacherName: v.optional(v.string()), // Snapshot of previous teacher name
    toTeacherName: v.optional(v.string()), // Snapshot of new teacher name
    reason: v.optional(v.string()),
    changedBy: v.id("users"), // Admin who approved the change
    createdAt: v.string(),
  })
    .index("by_calendarEvent", ["calendarEventId"])
    .index("by_createdAt", ["createdAt"]),
};
