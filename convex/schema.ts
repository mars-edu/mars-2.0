import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================================
// MARS 2.0 Education Management System - Convex Schema
// Migrated from Pinia stores + D1/Prisma backend
// ============================================================================

export default defineSchema({
  // ==========================================================================
  // AUTHENTICATION & USERS
  // ==========================================================================

  /**
   * Users table - stores user accounts for authentication
   * Migrated from: Prisma User + UserRole models
   */
  users: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()), // Middle name/patronymic
    username: v.string(),
    email: v.string(),
    passwordHash: v.string(), // bcrypt hash
    roles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT")
      )
    ),
    avatar: v.optional(v.string()), // Profile picture URL or storage ID
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("lavanda"))), // User theme preference
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  // ==========================================================================
  // ACADEMIC STRUCTURE
  // ==========================================================================

  /**
   * Academic years - tracks school year periods
   * Migrated from: academicYearStore.ts
   */
  academicYears: defineTable({
    name: v.string(),
    startYear: v.number(),
    endYear: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_startYear", ["startYear"]),

  /**
   * Semesters within academic years
   * Migrated from: semesterStore.ts, academicYearSemesterStore.ts
   */
  semesters: defineTable({
    name: v.string(),
    shortName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    number: v.optional(v.number()),
    academicYearId: v.id("academicYears"),
    startDate: v.optional(v.string()), // ISO date
    endDate: v.optional(v.string()), // ISO date
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_active", ["isActive"]),

  /**
   * Specialties/Programs offered
   * Migrated from: specialtyStore.ts
   */
  specialties: defineTable({
    name: v.string(),
    code: v.string(),
    codeName: v.string(),
    details: v.optional(v.string()),
    hasModule: v.optional(v.boolean()),
    isHighlighted: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

  /**
   * Courses/Year levels
   * Migrated from: courseStore.ts
   */
  courses: defineTable({
    number: v.string(),
    name: v.optional(v.string()),
    semesters: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  /**
   * Base education levels (9 or 11 year base)
   * Migrated from: baseStore.ts
   */
  bases: defineTable({
    value: v.number(), // 9 or 11
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  /**
   * Teacher positions/roles
   * Migrated from: positionStore.ts
   */
  positions: defineTable({
    name: v.string(),
    shortName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  /**
   * Disciplines/Subjects
   * Migrated from: disciplineStore.ts
   */
  disciplines: defineTable({
    moduleIndex: v.string(),
    moduleName: v.string(),
    learningOutcome: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  /**
   * Modules for modular education
   * Migrated from: moduleStore.ts
   */
  modules: defineTable({
    name: v.string(),
    index: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ==========================================================================
  // PEOPLE
  // ==========================================================================

  /**
   * Students enrolled in the system
   * Migrated from: studentStore.ts
   */
  students: defineTable({
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    specialty: v.string(), // specialty ID reference
    language: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    base: v.optional(v.number()), // 9 or 11
    academicYearId: v.optional(v.string()), // academic year ID reference
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_specialty", ["specialty"])
    .index("by_academicYear", ["academicYearId"])
    .index("by_specialty_academicYear", ["specialty", "academicYearId"]),

  /**
   * Teachers/Instructors
   * Migrated from: teacherStore.ts
   */
  teachers: defineTable({
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    position: v.string(),
    employmentYear: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    userId: v.optional(v.id("users")), // linked user account
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_position", ["position"]),

  // ==========================================================================
  // CURRICULUM (CLASS9 - Learning Outcomes)
  // ==========================================================================

  /**
   * Class9 items - curriculum modules with learning outcomes
   * Migrated from: class9Store.ts
   */
  class9Items: defineTable({
    specialtyIds: v.array(v.string()), // Multiple specialty IDs
    academicYearId: v.string(),
    moduleIndex: v.string(),
    moduleName: v.string(),
    learningOutcome: v.string(),
    totalCredits: v.string(),
    totalHours: v.string(),
    theoreticalHours: v.string(),
    labPracticalHours: v.string(),
    field3Value: v.string(),
    srspHours: v.string(),
    srsHours: v.string(),
    trainingPracticeHours: v.string(),
    individualHours: v.string(),
    position: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_position", ["academicYearId", "position"]),

  /**
   * Distribution entries for class9 items across semesters
   * Migrated from: class9Store.ts (nested distributionEntries)
   */
  distributionEntries: defineTable({
    class9ItemId: v.id("class9Items"),
    academicYearId: v.string(),
    semesterId: v.string(),
    hours: v.string(),
    intermediateControlId: v.optional(v.string()),
    finalControlId: v.optional(v.string()),
    examEnabled: v.optional(v.boolean()),
    creditEnabled: v.optional(v.boolean()),
    controlLessonEnabled: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class9Item", ["class9ItemId"])
    .index("by_semester", ["semesterId"]),

  // ==========================================================================
  // ASSESSMENT & CONTROL TYPES
  // ==========================================================================

  /**
   * Intermediate control types (quizzes, tests, etc.)
   * Migrated from: intermediateControlStore.ts
   */
  intermediateControls: defineTable({
    name: v.string(),
    shortName: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  /**
   * Final control types (exams, finals)
   * Migrated from: finalControlStore.ts
   */
  finalControls: defineTable({
    name: v.string(),
    shortName: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  /**
   * Scheduled intermediate controls for specific class9 items
   * Migrated from: scheduledIntermediateControlStore.ts
   */
  scheduledIntermediateControls: defineTable({
    intermediateControlId: v.string(), // Reference to intermediateControls
    class9Id: v.string(), // Reference to class9Items
    semesterId: v.string(),
    date: v.optional(v.string()), // ISO date
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class9Id", ["class9Id"])
    .index("by_semester", ["semesterId"]),

  /**
   * Scheduled final controls for specific class9 items
   * Migrated from: scheduledFinalControlStore.ts
   */
  scheduledFinalControls: defineTable({
    finalControlId: v.string(), // Reference to finalControls
    class9Id: v.string(), // Reference to class9Items
    semesterId: v.string(),
    date: v.optional(v.string()), // ISO date
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class9Id", ["class9Id"])
    .index("by_semester", ["semesterId"]),

  // ==========================================================================
  // CALENDAR & JOURNALS
  // ==========================================================================

  /**
   * Calendar events - class schedules and events
   * Migrated from: calendarStore.ts
   */
  calendarEvents: defineTable({
    class9Id: v.string(), // Reference to class9Items
    ktpId: v.optional(v.string()), // Reference to ktps
    teacherId: v.optional(v.string()), // Reference to teachers
    startDate: v.string(), // ISO date
    startTime: v.optional(v.string()),
    endDate: v.string(), // ISO date
    endTime: v.optional(v.string()),
    participants: v.array(v.string()), // Array of student IDs
    color: v.optional(v.string()),
    semester: v.string(), // Semester ID
    useCustomPeriod: v.boolean(),
    weeklySchedules: v.optional(
      v.array(
        v.object({
          weekId: v.number(),
          startTime: v.optional(v.string()),
          endTime: v.optional(v.string()),
          startId: v.optional(v.string()),
          endId: v.optional(v.string()),
        })
      )
    ),
    isIndividualJournal: v.optional(v.boolean()),
    mergedJournalIds: v.optional(v.array(v.string())),
    parentIndividualJournalId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class9Id", ["class9Id"])
    .index("by_teacherId", ["teacherId"])
    .index("by_semester", ["semester"])
    .index("by_startDate", ["startDate"]),

  // ==========================================================================
  // LESSON PLANS (KTP)
  // ==========================================================================

  /**
   * KTP (Calendar-Thematic Plan) headers
   * Migrated from: ktpStore.ts
   */
  ktps: defineTable({
    class9Id: v.string(), // Reference to class9Items
    academicYearId: v.string(),
    semesterId: v.string(),
    eventId: v.optional(v.string()), // Reference to calendarEvents
    name: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class9Id", ["class9Id"])
    .index("by_eventId", ["eventId"])
    .index("by_academicYear_semester", ["academicYearId", "semesterId"]),

  /**
   * KTP details - individual lesson plans
   * Migrated from: ktpStore.ts (ktpDetails)
   */
  ktpDetails: defineTable({
    ktpId: v.id("ktps"),
    position: v.number(),
    theme: v.string(),
    totalHours: v.optional(v.number()),
    srsp: v.optional(v.number()),
    srs: v.optional(v.number()),
    homework: v.string(),
    notes: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ktpId", ["ktpId"])
    .index("by_ktpId_position", ["ktpId", "position"]),

  // ==========================================================================
  // MARKS & JOURNALS
  // ==========================================================================

  /**
   * Journals - grade books for classes
   * Migrated from: journalStore.ts + Prisma Journal
   */
  journals: defineTable({
    calendarEventId: v.optional(v.string()), // Reference to calendarEvents
    disciplineId: v.string(), // Reference to class9Items
    groupName: v.optional(v.string()),
    academicYearId: v.string(),
    semesterId: v.string(),
    isMixedGroup: v.optional(v.boolean()),
    isIndividualJournal: v.optional(v.boolean()),
    mergedJournalIds: v.optional(v.array(v.string())),
    parentIndividualJournalId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_calendarEvent", ["calendarEventId"])
    .index("by_academicYear_semester", ["academicYearId", "semesterId"]),

  /**
   * Journal-Student relationships
   * Migrated from: Prisma JournalStudent
   */
  journalStudents: defineTable({
    journalId: v.id("journals"),
    studentId: v.string(), // Reference to students
    createdAt: v.number(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
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
    createdAt: v.number(),
  })
    .index("by_journal", ["journalId"])
    .index("by_journal_student", ["journalId", "studentId"])
    .index("by_createdAt", ["createdAt"]),

  // ==========================================================================
  // SCHEDULES & PERIODS
  // ==========================================================================

  /**
   * Education schedule time slots
   * Migrated from: educationScheduleStore.ts
   */
  educationSchedules: defineTable({
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_order", ["order"]),

  /**
   * Vacation periods
   * Migrated from: vacationStore.ts
   */
  vacations: defineTable({
    name: v.string(),
    academicYearId: v.string(), // Reference to academicYears
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_academicYear", ["academicYearId"]),

  /**
   * Exam sessions
   * Migrated from: sessionStore.ts
   */
  sessions: defineTable({
    shortName: v.string(),
    fullName: v.string(),
    academicYearId: v.string(),
    semesterId: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_semester", ["semesterId"]),

  // ==========================================================================
  // FILES & STORAGE
  // ==========================================================================

  /**
   * File metadata for uploaded files
   * Migrated from: Prisma File
   */
  files: defineTable({
    storageId: v.id("_storage"), // Convex storage reference
    name: v.string(),
    key: v.string(),
    url: v.optional(v.string()),
    contentType: v.string(),
    size: v.number(),
    uploadedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_uploadedBy", ["uploadedBy"]),

  // ==========================================================================
  // OFFLINE SYNC SUPPORT
  // ==========================================================================

  /**
   * Offline mutation queue - stores pending changes made while offline
   * NEW: For offline-first architecture
   */
  offlineQueue: defineTable({
    clientId: v.string(), // Device/browser identifier
    userId: v.id("users"),
    operation: v.string(), // Mutation name (e.g., "marks.updateMark")
    args: v.string(), // JSON serialized arguments
    status: v.union(
      v.literal("pending"),
      v.literal("synced"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
    syncedAt: v.optional(v.number()),
  })
    .index("by_userId_status", ["userId", "status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_clientId", ["clientId"]),

  // ==========================================================================
  // RUP (Working Curriculum)
  // ==========================================================================

  /**
   * RUP entries - working curriculum items
   * Migrated from: rupStore.ts
   */
  rupEntries: defineTable({
    academicYearId: v.string(),
    specialtyId: v.string(),
    semesterId: v.string(),
    disciplineName: v.string(),
    totalHours: v.optional(v.number()),
    lectureHours: v.optional(v.number()),
    practiceHours: v.optional(v.number()),
    labHours: v.optional(v.number()),
    controlType: v.optional(v.string()),
    credits: v.optional(v.number()),
    position: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_specialty", ["specialtyId"])
    .index("by_semester", ["semesterId"]),
});
