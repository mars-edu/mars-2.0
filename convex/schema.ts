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
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("lavanda"), v.literal("coral"), v.literal("graphite"))), // User theme preference
    phone: v.optional(v.string()),
    office: v.optional(v.string()),
    department: v.optional(v.string()),
    degree: v.optional(v.string()),
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
    legacyId: v.optional(v.string()), // D1 ID for mapping during migration
    name: v.string(),
    startYear: v.number(),
    endYear: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_startYear", ["startYear"])
    .index("by_legacyId", ["legacyId"]),

  /**
   * Global semester definitions (settings)
   * Migrated from: semesterStore.ts
   * These are the semester templates (e.g., "Semester 1", "Semester 2")
   */
  semesterDefinitions: defineTable({
    name: v.string(),
    shortName: v.string(),
    fullName: v.optional(v.string()),
    number: v.number(), // Semester number (1-8)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_number", ["number"]),

  /**
   * Academic year semester instances
   * Migrated from: academicYearSemesterStore.ts
   * These are actual semester periods within specific academic years
   */
  academicYearSemesters: defineTable({
    academicYearId: v.id("academicYears"),
    semesterDefinitionId: v.id("semesterDefinitions"),
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_semesterDefinition", ["semesterDefinitionId"]),

  /**
   * Specialties/Programs offered
   * Migrated from: specialtyStore.ts
   */
  specialties: defineTable({
    legacyId: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    codeName: v.string(),
    details: v.optional(v.string()),
    year: v.optional(v.number()),
    orderNumber: v.optional(v.string()),
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
    baseClass: v.optional(v.array(v.number())), // [9], [11], or [9, 11]
    language: v.optional(v.string()), // "ru" | "kk" | "en"
    groupId: v.optional(v.string()), // UUID linking language variants
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
    individualAdditionalHours: v.optional(v.string()),
    position: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_position", ["academicYearId", "position"])
    .index("by_groupId", ["groupId"]),

  /**
   * Distribution entries for class9 items across semesters
   * Migrated from: class9Store.ts (nested distributionEntries)
   */
  distributionEntries: defineTable({
    class9ItemId: v.id("class9Items"),
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
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
    academicYearId: v.string(), // Reference to academicYears (REQUIRED)
    shortName: v.string(), // Control name/title (REQUIRED)
    startDate: v.string(), // ISO date (REQUIRED)
    endDate: v.string(), // ISO date (REQUIRED)
    class9Id: v.optional(v.string()), // Reference to class9Items
    semesterId: v.optional(v.id("academicYearSemesters")),
    date: v.optional(v.string()), // ISO date (legacy)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_class9Id", ["class9Id"])
    .index("by_semester", ["semesterId"]),

  /**
   * Scheduled final controls for specific class9 items
   * Migrated from: scheduledFinalControlStore.ts
   */
  scheduledFinalControls: defineTable({
    finalControlId: v.string(), // Reference to finalControls
    academicYearId: v.string(), // Reference to academicYears (REQUIRED)
    shortName: v.string(), // Control name/title (REQUIRED)
    startDate: v.string(), // ISO date (REQUIRED)
    endDate: v.string(), // ISO date (REQUIRED)
    class9Id: v.optional(v.string()), // Reference to class9Items
    semesterId: v.optional(v.id("academicYearSemesters")),
    date: v.optional(v.string()), // ISO date (legacy)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
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
    isClosed: v.optional(v.boolean()),
    journalSettings: v.optional(
      v.object({
        calculationType: v.union(v.literal("calculated"), v.literal("manual")),
        calculationMethod: v.union(v.literal("only-assigned"), v.literal("all-days")),
      })
    ),
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
    semesterId: v.id("academicYearSemesters"),
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
    semesterId: v.id("academicYearSemesters"),
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
    academicYearId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["order"])
    .index("by_academicYear", ["academicYearId"]),

  /**
   * Vacation periods
   * Migrated from: vacationStore.ts
   */
  vacations: defineTable({
    shortName: v.string(),
    fullName: v.string(),
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
    semesterId: v.optional(v.id("academicYearSemesters")),
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
  // PASSWORD CHANGE HISTORY
  // ==========================================================================

  /**
   * Password change history - tracks when passwords are regenerated
   * NEW: For security auditing and tracking
   */
  passwordChangeHistory: defineTable({
    userId: v.id("users"), // User whose password was changed
    changedBy: v.optional(v.id("users")), // Admin who changed it (optional for self-service)
    changeType: v.union(
      v.literal("regenerated"), // Password regenerated by admin
      v.literal("reset"), // Password reset by user
      v.literal("initial") // Initial password creation
    ),
    teacherId: v.optional(v.string()), // Reference to teacher if applicable
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

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
    semesterId: v.id("academicYearSemesters"),
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

  // ==========================================================================
  // NOTIFICATIONS & SUBSTITUTIONS
  // ==========================================================================

  /**
   * Notifications - system notifications for users
   * NEW: Notification center functionality
   */
  notifications: defineTable({
    userId: v.id("users"), // User receiving the notification
    type: v.union(
      v.literal("substitution"), // Journal substitution assignment
      v.literal("journal_closure"), // Journal closure reminder
      v.literal("system") // General system announcement
    ),
    status: v.union(
      v.literal("unread"),
      v.literal("read"),
      v.literal("archived")
    ),
    title: v.string(),
    message: v.string(),
    // Metadata for different notification types
    metadata: v.optional(
      v.object({
        substitutionId: v.optional(v.id("substitutions")),
        journalId: v.optional(v.id("journals")),
        deadline: v.optional(v.string()), // ISO date
      })
    ),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_userId_createdAt", ["userId", "createdAt"])
    .index("by_type", ["type"]),

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
    status: v.union(
      v.literal("pending"), // Awaiting acceptance
      v.literal("accepted"), // Teacher accepted
      v.literal("rejected"), // Teacher rejected
      v.literal("completed") // Substitution period ended
    ),
    reason: v.optional(v.string()), // Reason for substitution
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_journal", ["journalId"])
    .index("by_fromTeacher", ["fromTeacherId"])
    .index("by_toTeacher", ["toTeacherId"])
    .index("by_toUser", ["toUserId"])
    .index("by_toUser_status", ["toUserId", "status"])
    .index("by_status", ["status"])
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_semester", ["semesterId"])
    .index("by_isActive", ["isActive"])
    .index("by_deadline", ["deadline"]),

  // ==========================================================================
  // WORKLOAD MANAGEMENT
  // ==========================================================================

  /**
   * Workload management records
   * Ported from: concept/components/WorkloadView.tsx
   */
  workloads: defineTable({
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.string(), // Keep for display/fallback
    academicYearId: v.string(), // academic year ID reference
    totalHours: v.number(),
    items: v.array(
      v.object({
        id: v.string(),
        subjectId: v.string(), // Convex ID of the class9Item or other source
        department: v.string(),
        course: v.string(),
        studentCount: v.string(),
        weeks1: v.string(),
        weeks2: v.string(),
        weeks3: v.optional(v.string()),
        hours1: v.string(),
        hours2: v.string(),
        hours3: v.optional(v.string()),
        hoursPerGroup1: v.string(),
        hoursPerGroup2: v.string(),
        hoursPerGroup3: v.optional(v.string()),
        groupCount1: v.string(),
        groupCount2: v.string(),
        groupCount3: v.optional(v.string()),
        totalHours: v.string(),
        teacherName: v.optional(v.string()),
        index: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_teacher", ["teacherId"]),
});
