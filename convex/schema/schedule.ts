import { defineTable } from "convex/server";
import { v } from "convex/values";

export const scheduleTables = {
  /**
   * Education schedule time slots
   * Migrated from: educationScheduleStore.ts
   */
  educationSchedules: defineTable({
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    order: v.number(),
    academicYearId: v.id("academicYears"),
    semesterId: v.id("academicYearSemesters"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_order", ["order"])
    .index("by_academicYear", ["academicYearId"])
    .index("by_semester", ["semesterId"]),

  /**
   * Vacation periods
   * Migrated from: vacationStore.ts
   */
  vacations: defineTable({
    shortName: v.string(),
    fullName: v.string(),
    academicYearId: v.id("academicYears"), // Reference to academicYears
    semesterId: v.id("academicYearSemesters"),
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_semester", ["semesterId"]),

  /**
   * Substitutions - journal substitution assignments (замена)
   * NEW: When a teacher transfers a journal to another teacher
   */
  substitutions: defineTable({
    journalId: v.id("journals"),
    fromTeacherId: v.string(), // Original teacher (references teachers table)
    toTeacherId: v.string(), // Teacher receiving the substitution
    toUserId: v.id("users"), // User account of receiving teacher
    startDate: v.string(), // ISO date - substitution period start
    endDate: v.string(), // ISO date - substitution period end
    startTime: v.optional(v.string()), // Optional time restriction start (HH:mm)
    endTime: v.optional(v.string()), // Optional time restriction end (HH:mm)
    isPrimary: v.optional(v.boolean()), // Whether substitute becomes primary teacher
    // Keep in sync with src/constants/substitution.ts
    status: v.union(
      v.literal("pending"), // Awaiting admin approval
      v.literal("accepted"), // Admin approved
      v.literal("rejected"), // Admin rejected
      v.literal("completed"), // Substitution period ended
      v.literal("cancelled") // Admin cancelled
    ),
    reason: v.optional(v.string()), // Reason for substitution
    rejectionReason: v.optional(v.string()), // Admin rejection reason
    serviceLetterNumber: v.optional(v.string()), // Official letter/order number (служебное письмо)
    // Journal snapshot at time of transfer
    journalSnapshot: v.optional(
      v.object({
        disciplineName: v.string(),
        groupName: v.optional(v.string()),
        course: v.optional(v.string()),
        semester: v.optional(v.string()),
      })
    ),
    createdBy: v.id("users"), // User who created the substitution
    acceptedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_journal", ["journalId"])
    .index("by_fromTeacher", ["fromTeacherId"])
    .index("by_fromTeacher_status", ["fromTeacherId", "status"])
    .index("by_toTeacher", ["toTeacherId"])
    .index("by_toUser", ["toUserId"])
    .index("by_toUser_status", ["toUserId", "status"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  /**
   * Makeup hour requests - teacher requests to reschedule missed sessions
   */
  makeupRequests: defineTable({
    journalId: v.id("journals"),
    teacherId: v.string(), // references teachers table _id
    createdBy: v.id("users"),
    reason: v.optional(v.string()),
    dates: v.array(
      v.object({
        existingDate: v.string(), // ISO YYYY-MM-DD from journal schedule
        newDate: v.string(), // ISO YYYY-MM-DD for makeup session
        startScheduleId: v.string(), // educationSchedules._id
        endScheduleId: v.string(),
      })
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    rejectionReason: v.optional(v.string()),
    journalSnapshot: v.optional(
      v.object({
        disciplineName: v.string(),
        groupName: v.optional(v.string()),
      })
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_journal", ["journalId"])
    .index("by_teacher", ["teacherId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),
};
