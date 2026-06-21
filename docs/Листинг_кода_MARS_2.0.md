# Листинг исходного кода платформы MARS 2.0

Система управления образовательным процессом MARS 2.0.
Технологический стек: TypeScript, Vue 3, Framework7, Tailwind CSS, Convex (реактивная БД на Rust), Vercel AI SDK (Google Gemini).

---

## ЧАСТЬ 1. Архитектура базы данных (convex/schema.ts)

Декларативное описание всех таблиц и индексов экосистемы MARS 2.0: пользователи, журналы, дисциплины, расписание, оценки, тесты, посещаемость, RBAC-роли.

```typescript
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
    locale: v.optional(v.union(v.literal("ru"), v.literal("kk"), v.literal("en"))),
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
  // RBAC (ROLE-BASED ACCESS CONTROL)
  // ==========================================================================

  /**
   * Permissions - defines resource + action access rules for roles
   * NEW: Dynamic RBAC implementation
   */
  permissions: defineTable({
    resource: v.string(),
    action: v.union(
      v.literal("navigate"),
      v.literal("read"),
      v.literal("write"),
    ),
    roles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT"),
      )
    ),
    description: v.optional(v.string()),
    activeFrom: v.optional(v.number()),
    activeTo: v.optional(v.number()),
  })
    .index("by_resource_action", ["resource", "action"])
    .index("by_action", ["action"]),

  /**
   * Permission history - audit trail for permission changes
   * NEW: Dynamic RBAC implementation
   */
  permissionHistory: defineTable({
    permissionId: v.id("permissions"),
    resource: v.string(),
    action: v.string(),
    changedBy: v.id("users"),
    changedAt: v.number(),
    previousRoles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT"),
      )
    ),
    newRoles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT"),
      )
    ),
    previousActiveFrom: v.optional(v.number()),
    previousActiveTo: v.optional(v.number()),
    newActiveFrom: v.optional(v.number()),
    newActiveTo: v.optional(v.number()),
    changeType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
    ),
  })
    .index("by_permission", ["permissionId"])
    .index("by_changedBy", ["changedBy"])
    .index("by_changedAt", ["changedAt"]),

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
   * Cabinets/Rooms - classroom management
   * Ported from: concept-v2 RoomsManagement
   */
  cabinets: defineTable({
    name: v.string(),
    capacity: v.number(),
    type: v.string(), // 'lecture' | 'lab' | 'gym' | 'other'
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
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
    createdAt: v.number(),
    updatedAt: v.number(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_position", ["position"])
    .searchIndex("search_by_name", {
      searchField: "searchName",
      filterFields: ["gender", "position"],
    }),

  // ==========================================================================
  // RUP (Working Curriculum - Learning Outcomes)
  // ==========================================================================

  /**
   * RUP entries - curriculum modules with learning outcomes
   */
  rupEntries: defineTable({
    specialtyIds: v.array(v.string()),
    academicYearId: v.string(),
    baseClass: v.optional(v.array(v.number())),
    language: v.optional(v.string()),
    groupId: v.optional(v.string()),
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
   * Distribution entries for RUP items across semesters
   */
  distributionEntries: defineTable({
    rupEntryId: v.id("rupEntries"),
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    hours: v.string(),
    srsHours: v.optional(v.string()),
    srspHours: v.optional(v.string()),
    individualHours: v.optional(v.string()),
    intermediateControlId: v.optional(v.string()),
    finalControlId: v.optional(v.string()),
    examEnabled: v.optional(v.boolean()),
    creditEnabled: v.optional(v.boolean()),
    controlLessonEnabled: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rupEntry", ["rupEntryId"])
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
   * Scheduled intermediate controls for specific RUP entries
   */
  scheduledIntermediateControls: defineTable({
    intermediateControlId: v.string(),
    academicYearId: v.string(),
    shortName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rupEntryId: v.optional(v.string()),
    semesterId: v.id("academicYearSemesters"),
    date: v.optional(v.string()), // ISO date (legacy)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_rupEntryId", ["rupEntryId"])
    .index("by_semester", ["semesterId"]),

  /**
   * Scheduled final controls for specific RUP entries
   */
  scheduledFinalControls: defineTable({
    finalControlId: v.string(),
    academicYearId: v.string(),
    shortName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rupEntryId: v.optional(v.string()),
    semesterId: v.id("academicYearSemesters"),
    date: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_rupEntryId", ["rupEntryId"])
    .index("by_semester", ["semesterId"]),

  // ==========================================================================
  // CALENDAR & JOURNALS
  // ==========================================================================

  /**
   * Calendar events - class schedules and events
   * Migrated from: calendarStore.ts
   */
  calendarEvents: defineTable({
    rupEntryId: v.string(), // Reference to rupEntries
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
    sourceGroupEventId: v.optional(v.string()), // wizard-child → main group event link
    gradingType: v.optional(
      v.union(v.literal("combined"), v.literal("separate"))
    ), // set on the main event when it has individual journals
    customTitle: v.optional(v.string()),
    isClosed: v.optional(v.boolean()),
    journalSettings: v.optional(
      v.object({
        calculationType: v.union(v.literal("calculated"), v.literal("manual")),
        calculationMethod: v.union(v.literal("only-assigned"), v.literal("all-days")),
        finalControlForm: v.optional(v.union(v.literal("written"), v.literal("oral"), v.literal("mixed"))),
        finalGradeFormula: v.optional(v.object({
          intermediateWeight: v.number(),
          finalWeight: v.number(),
        })),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rupEntryId", ["rupEntryId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_semester", ["semester"])
    .index("by_startDate", ["startDate"])
    .index("by_sourceGroupEventId", ["sourceGroupEventId"]),

  // ==========================================================================
  // LESSON PLANS (KTP)
  // ==========================================================================

  /**
   * KTP (Calendar-Thematic Plan) headers
   * Migrated from: ktpStore.ts
   */
  ktps: defineTable({
    rupEntryId: v.string(), // Reference to rupEntries
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    eventId: v.optional(v.string()), // Reference to calendarEvents
    name: v.optional(v.string()),
    color: v.optional(v.string()), // hex, e.g. '#FACC15'
    languages: v.optional(v.array(v.string())), // subset of ['KZ','RU','EN']
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rupEntryId", ["rupEntryId"])
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
    theoretical: v.optional(v.number()),
    practical: v.optional(v.number()),
    individual: v.optional(v.number()),
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
    disciplineId: v.string(), // Reference to rupEntries
    groupName: v.optional(v.string()),
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    isMixedGroup: v.optional(v.boolean()),
    isIndividualJournal: v.optional(v.boolean()),
    mergedJournalIds: v.optional(v.array(v.string())),
    parentIndividualJournalId: v.optional(v.string()),
    workloadId: v.optional(v.string()), // Back-ref when generated from a workload
    createdAt: v.number(),
    updatedAt: v.number(),
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
    semesterId: v.id("academicYearSemesters"),
    createdAt: v.number(),
    updatedAt: v.number(),
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
    academicYearId: v.string(), // Reference to academicYears
    semesterId: v.id("academicYearSemesters"),
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_semester", ["semesterId"]),

  /**
   * Exam sessions
   * Migrated from: sessionStore.ts
   */
  sessions: defineTable({
    shortName: v.string(),
    fullName: v.string(),
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
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
    createdAt: v.number(),
    updatedAt: v.number(),
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
    createdAt: v.number(),
  })
    .index("by_calendarEvent", ["calendarEventId"])
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_journal", ["journalId"])
    .index("by_teacher", ["teacherId"])
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

  /**
   * Announcements and news - public feed content managed by admins
   */
  announcements: defineTable({
    kind: v.union(v.literal("announcement"), v.literal("news")),
    category: v.string(),
    type: v.union(v.literal("info"), v.literal("alert"), v.literal("system")),
    titles: v.object({
      ru: v.optional(v.string()),
      kk: v.optional(v.string()),
      en: v.optional(v.string()),
    }),
    descriptions: v.object({
      ru: v.optional(v.string()),
      kk: v.optional(v.string()),
      en: v.optional(v.string()),
    }),
    displayDate: v.string(),
    publishAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isPublished: v.boolean(),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_isPublished", ["isPublished"])
    .index("by_category", ["category"])
    .index("by_kind", ["kind"])
    .index("by_createdAt", ["createdAt"]),

  announcementCategories: defineTable({
    slug: v.string(),
    label: v.optional(v.string()),
    labels: v.optional(
      v.object({
        ru: v.optional(v.string()),
        kk: v.optional(v.string()),
        en: v.optional(v.string()),
      })
    ),
    position: v.number(),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_position", ["position"]),

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
        subjectId: v.string(), // Convex ID of the rupEntry or other source
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
        language: v.optional(v.string()),
        specialtyIds: v.optional(v.array(v.string())),
      })
    ),
    // Workflow status (ported from concept SavedWorkload flags)
    journalsCreated: v.optional(v.boolean()),
    addedToSchedule: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_teacher", ["teacherId"]),

  // ==========================================================================
  // TESTING
  // ==========================================================================

  /**
   * Tests - Library of tests
   * Migrated from: concept-v2 tests collection
   */
  tests: defineTable({
    title: v.string(),
    subject: v.string(),
    questionsCount: v.number(),
    duration: v.number(),
    questions: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string(),
      options: v.array(v.string()),
      correctIndex: v.number(),
    }))),
    isPractice: v.optional(v.boolean()),
    shuffleQuestions: v.optional(v.boolean()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  /**
   * Test Assignments - links a test to a group (journal)
   */
  testAssignments: defineTable({
    testId: v.id("tests"),
    journalId: v.id("journals"),
    status: v.union(v.literal("active"), v.literal("completed")),
    date: v.string(), // ISO date
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_test", ["testId"])
    .index("by_journal", ["journalId"]),

  /**
   * Test Results - stores the score and answers of a student
   */
  testResults: defineTable({
    assignmentId: v.id("testAssignments"),
    testId: v.id("tests"),
    studentId: v.string(),
    score: v.number(),
    completedAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_student", ["studentId"])
    .index("by_test", ["testId"]),
});
```

---

## ЧАСТЬ 2А. Серверная логика: интеграция с искусственным интеллектом (convex/livekit/chat.ts)

Серверный обработчик AI-ассистента: аутентификация по JWT, разрешение роли пользователя, потоковая генерация ответов моделью Google Gemini через Vercel AI SDK с поддержкой инструментов (function calling).

```typescript
// convex/livekit/chat.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import type { ActionCtx } from '../_generated/server';
import { api } from '../_generated/api';
import { validateToken } from '../auth/helpers';
import { buildSystemPrompt } from './marsSystemPrompt';
import { createMarsTools, type ResolvedUser } from './tools';
import type { Id } from '../_generated/dataModel';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export async function resolveUser(
  ctx: ActionCtx,
  token: string,
): Promise<ResolvedUser | null> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  let payload: { userId: string; roles: string[] };
  try {
    payload = await validateToken(token, jwtSecret);
  } catch {
    return null;
  }

  const userId = payload.userId as Id<'users'>;
  const profile = await ctx.runQuery(api.users.queries.getUserProfile, {
    userId,
  });
  if (!profile) return null;

  let teacherId: Id<'teachers'> | undefined;
  let studentId: string | undefined;

  if (payload.roles.includes('TEACHER')) {
    const teacher = await ctx.runQuery(api.teachers.queries.getByUserId, {
      userId,
    });
    teacherId = teacher?._id;
  }

  if (payload.roles.includes('STUDENT')) {
    // Students table has no userId — resolve by name match
    const matches = await ctx.runQuery(api.students.queries.search, {
      searchTerm: profile.firstName,
    });
    const match = (matches as any[]).find(
      (s: any) =>
        s.firstName === profile.firstName && s.surname === profile.lastName,
    );
    studentId = match?._id;
  }

  return {
    userId,
    roles: payload.roles,
    firstName: profile.firstName,
    lastName: profile.lastName,
    teacherId,
    studentId,
  };
}

export async function handleChatRequest(
  ctx: ActionCtx,
  request: Request,
): Promise<Response> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return errorResponse('GOOGLE_API_KEY not configured', 500);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = token ? await resolveUser(ctx, token) : null;

  // ── Body ──────────────────────────────────────────────────────────────────
  let messages: UIMessage[];
  try {
    const body = await request.json();
    messages = body.messages as UIMessage[];
  } catch {
    return errorResponse('Invalid request body', 400);
  }

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch {
    return errorResponse('Failed to convert messages', 400);
  }

  // ── Stream ────────────────────────────────────────────────────────────────
  try {
    const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
    const tools = user ? createMarsTools(ctx, user) : undefined;

    const result = streamText({
      model: google('gemini-3-flash-preview'),
      system: buildSystemPrompt(user),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(10),
    });

    const streamResponse = result.toUIMessageStreamResponse();
    const headers = new Headers(streamResponse.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      headers.set(key, value);
    }
    return new Response(streamResponse.body, {
      status: streamResponse.status,
      headers,
    });
  } catch {
    return errorResponse('AI service error', 500);
  }
}
```

## ЧАСТЬ 2Б. Серверная логика: обработка оценок (convex/marks/mutations.ts)

Мутации записи и пересчёта оценок учащихся в электронном журнале.

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";
import { requirePermission } from "../lib/rbac";

/**
 * Update or create a mark
 */
export const updateMark = mutation({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
    columnIndex: v.number(),
    rowIndex: v.number(),
    value: v.optional(v.string()),
    columnType: v.union(v.literal("date"), v.literal("session")),
    columnDate: v.optional(v.string()),
    columnLabel: v.optional(v.string()),
    controlType: v.optional(
      v.union(v.literal("intermediate"), v.literal("final"))
    ),
    controlId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    scheduledControlId: v.optional(v.string()),
    userId: v.optional(v.id("users")), // For tracking who made the change
  },
  handler: async (ctx, args) => {
    const { userId, ...markData } = args;

    if (userId) {
      await requirePermission(ctx, userId, "marks", "write");
    }

    // Find existing mark
    const existingMark = await ctx.db
      .query("marks")
      .withIndex("by_journal_student_column_row", (q) =>
        q
          .eq("journalId", args.journalId)
          .eq("studentId", args.studentId)
          .eq("columnIndex", args.columnIndex)
          .eq("rowIndex", args.rowIndex)
      )
      .unique();

    const now = Date.now();

    // Create history record if value changed
    if (existingMark && existingMark.value !== args.value && userId) {
      await ctx.db.insert("markHistory", {
        journalId: args.journalId,
        studentId: args.studentId,
        columnIndex: args.columnIndex,
        rowIndex: args.rowIndex,
        oldValue: existingMark.value,
        newValue: args.value,
        columnLabel: args.columnLabel,
        columnDate: args.columnDate,
        changedBy: userId,
        createdAt: now,
      });
    }

    if (existingMark) {
      // Update existing mark
      await ctx.db.patch(existingMark._id, {
        value: args.value,
        columnType: args.columnType,
        columnDate: args.columnDate,
        columnLabel: args.columnLabel,
        controlType: args.controlType,
        controlId: args.controlId,
        sessionId: args.sessionId,
        scheduledControlId: args.scheduledControlId,
        updatedBy: userId,
        updatedAt: now,
      });
      return existingMark._id;
    } else {
      // Create new mark
      const markId = await ctx.db.insert("marks", {
        ...markData,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      // Create history for new mark with value
      if (args.value && userId) {
        await ctx.db.insert("markHistory", {
          journalId: args.journalId,
          studentId: args.studentId,
          columnIndex: args.columnIndex,
          rowIndex: args.rowIndex,
          oldValue: undefined,
          newValue: args.value,
          columnLabel: args.columnLabel,
          columnDate: args.columnDate,
          changedBy: userId,
          createdAt: now,
        });
      }

      return markId;
    }
  },
});

/**
 * Batch update marks (for efficiency)
 */
export const batchUpdateMarks = mutation({
  args: {
    journalId: v.id("journals"),
    marks: v.array(
      v.object({
        studentId: v.string(),
        columnIndex: v.number(),
        rowIndex: v.number(),
        value: v.optional(v.string()),
        columnType: v.union(v.literal("date"), v.literal("session")),
        columnDate: v.optional(v.string()),
        columnLabel: v.optional(v.string()),
        controlType: v.optional(
          v.union(v.literal("intermediate"), v.literal("final"))
        ),
        controlId: v.optional(v.string()),
        sessionId: v.optional(v.string()),
        scheduledControlId: v.optional(v.string()),
      })
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      await requirePermission(ctx, args.userId, "marks", "write");
    }

    const now = Date.now();
    const results: string[] = [];

    for (const mark of args.marks) {
      // Find existing mark
      const existingMark = await ctx.db
        .query("marks")
        .withIndex("by_journal_student_column_row", (q) =>
          q
            .eq("journalId", args.journalId)
            .eq("studentId", mark.studentId)
            .eq("columnIndex", mark.columnIndex)
            .eq("rowIndex", mark.rowIndex)
        )
        .unique();

      // Create history if value changed
      if (existingMark && existingMark.value !== mark.value && args.userId) {
        await ctx.db.insert("markHistory", {
          journalId: args.journalId,
          studentId: mark.studentId,
          columnIndex: mark.columnIndex,
          rowIndex: mark.rowIndex,
          oldValue: existingMark.value,
          newValue: mark.value,
          columnLabel: mark.columnLabel,
          columnDate: mark.columnDate,
          changedBy: args.userId,
          createdAt: now,
        });
      }

      if (existingMark) {
        await ctx.db.patch(existingMark._id, {
          ...mark,
          updatedBy: args.userId,
          updatedAt: now,
        });
        results.push(existingMark._id);
      } else {
        const markId = await ctx.db.insert("marks", {
          journalId: args.journalId,
          ...mark,
          createdBy: args.userId,
          updatedBy: args.userId,
          createdAt: now,
          updatedAt: now,
        });
        results.push(markId);
      }
    }

    return results;
  },
});

/**
 * Delete a mark
 */
export const deleteMark = mutation({
  args: {
    journalId: v.id("journals"),
    studentId: v.string(),
    columnIndex: v.number(),
    rowIndex: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      await requirePermission(ctx, args.userId, "marks", "write");
    }

    const existingMark = await ctx.db
      .query("marks")
      .withIndex("by_journal_student_column_row", (q) =>
        q
          .eq("journalId", args.journalId)
          .eq("studentId", args.studentId)
          .eq("columnIndex", args.columnIndex)
          .eq("rowIndex", args.rowIndex)
      )
      .unique();

    if (!existingMark) {
      return { success: false, error: "Mark not found" };
    }

    // Create history record for deletion
    if (existingMark.value && args.userId) {
      await ctx.db.insert("markHistory", {
        journalId: args.journalId,
        studentId: args.studentId,
        columnIndex: args.columnIndex,
        rowIndex: args.rowIndex,
        oldValue: existingMark.value,
        newValue: undefined,
        columnLabel: existingMark.columnLabel,
        columnDate: existingMark.columnDate,
        changedBy: args.userId,
        createdAt: Date.now(),
      });
    }

    await ctx.db.delete(existingMark._id);

    return { success: true };
  },
});

/**
 * Initialize a journal with students
 */
export const initializeJournal = mutation({
  args: {
    calendarEventId: v.optional(v.string()),
    disciplineId: v.string(),
    groupName: v.optional(v.string()),
    academicYearId: v.string(),
    semesterId: v.string(),
    studentIds: v.array(v.string()),
    isMixedGroup: v.optional(v.boolean()),
    isIndividualJournal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { studentIds, ...journalData } = args;
    const timestamps = createTimestamps();

    // Check if journal already exists
    let journal = args.calendarEventId
      ? await ctx.db
          .query("journals")
          .withIndex("by_calendarEvent", (q) =>
            q.eq("calendarEventId", args.calendarEventId)
          )
          .unique()
      : null;

    if (!journal) {
      // Create new journal
      const journalId = await ctx.db.insert("journals", {
        ...journalData,
        semesterId: journalData.semesterId as any,
        ...timestamps,
      });
      journal = await ctx.db.get(journalId);
    }

    if (!journal) {
      throw new Error("Failed to create journal");
    }

    // Add students to journal
    for (const studentId of studentIds) {
      // Check if student already exists in journal
      const existing = await ctx.db
        .query("journalStudents")
        .withIndex("by_journal_student", (q) =>
          q.eq("journalId", journal!._id).eq("studentId", studentId)
        )
        .unique();

      if (!existing) {
        await ctx.db.insert("journalStudents", {
          journalId: journal._id,
          studentId,
          createdAt: timestamps.createdAt,
        });
      }
    }

    return journal;
  },
});
```

---

## ЧАСТЬ 3. Интерфейс пользователя и логика клиента (src/components/JournalTab.vue)

Компонент главной таблицы электронного журнала: логика на TypeScript в блоке `<script setup>` и вёрстка интерфейса на Framework7 + Tailwind CSS в блоке `<template>`.

```vue
<template>
  <div>
    <div
      v-if="isViewOnly"
      class="mb-3 p-3 bg-muted/50 border border-border text-muted-foreground rounded-md text-sm"
      role="status"
    >
      Журнал закрыт. Доступен только просмотр.
    </div>
    <JournalToolbar
      v-model:viewMode="viewMode"
      :is-view-only="isViewOnly"
      :show-individual-journals="showIndividualJournals"
      :has-individual-journals="hasIndividualJournals"
      @download="onDownloadClick"
      @open-retake="isRetakeModalOpen = true"
      @open-rup="onOpenRupClick"
      @open-history="onHistoryClick"
      @open-settings="onSettingsClick"
      @open-recalc="onRecalcClick"
      @open-makeup-hours="onMakeupHoursClick"
      @close-journal="onCloseJournalClick"
      @open-journal="onOpenJournalClick"
      @open-individual-journals="onOpenIndividualJournalsClick"
    />

    <!-- Academic Year Mismatch Warning Banner -->
    <div
      v-if="academicYearMismatchInfo"
      class="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 rounded-md"
      role="alert"
    >
      <div class="flex items-start">
        <IconTriangleAlert class="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="font-semibold text-lg mb-2">
            Промежуточный контроль не настроен для этого учебного года
          </h3>
          <p class="mb-2">
            Колонки промежуточного контроля (РК1, РК2 и т.д.) не отображаются, потому что в
            расписании не настроены промежуточные контроли для учебного года
            {{ academicYearMismatchInfo.usingSemesterYear ? 'семестра' : 'дисциплины' }} этого журнала.
          </p>
          <div class="bg-card dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800 mb-3">
            <p class="text-sm mb-1">
              <strong>ID учебного года {{ academicYearMismatchInfo.usingSemesterYear ? '(из семестра)' : '(из РУП)' }}:</strong>
              <code class="bg-muted px-2 py-1 rounded text-xs ml-1">
                {{ academicYearMismatchInfo.journalAcademicYearId }}
              </code>
            </p>
            <p class="text-sm">
              <strong>Промежуточные контроли настроены для учебных годов:</strong>
              <span
                v-for="(yearId, index) in academicYearMismatchInfo.availableAcademicYearIds"
                :key="yearId"
                class="inline-block"
              >
                <code class="bg-muted px-2 py-1 rounded text-xs ml-1">{{ yearId }}</code>
                <span v-if="index < academicYearMismatchInfo.availableAcademicYearIds.length - 1">,</span>
              </span>
            </p>
          </div>
          <div class="space-y-1">
            <p class="font-medium">Для решения проблемы:</p>
            <ol class="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>
                Перейдите на страницу
                <strong>"Расписание образования"</strong> (Education Schedule)
              </li>
              <li>
                Разверните раздел
                <strong>"Промежуточный контроль"</strong>
              </li>
              <li>
                Добавьте промежуточные контроли (РК1, РК2 и т.д.) для учебного года {{ academicYearMismatchInfo.usingSemesterYear ? 'семестра' : 'дисциплины' }}
              </li>
              <li v-if="academicYearMismatchInfo.usingSemesterYear">
                Или обновите учебный год семестра в графике образовательного процесса
              </li>
              <li v-else>
                Или обновите учебный год дисциплины в РУП
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <template v-if="viewMode !== 'individual'">
      <JournalGradeStats
        v-if="viewMode === 'monitoring' && monitoringGradeStats.totalGraded > 0"
        :stats="monitoringGradeStats"
        :total-students="students.length"
      />

      <JournalGrid
        :displayed-students="displayedStudents"
        :displayed-headers="displayedHeaders"
        :marks-matrix="marksMatrix"
        :editing-cell="editingCell"
        :edited-value="editedValue"
        :is-view-only="isViewOnly"
        :journal_future_date_tooltip="journal_future_date_tooltip()"
        :get-ktp-for-header="getKtpForHeader"
        :is-future-date="isFutureDate"
        :is-past-date="isPastDate"
        :get-student-average-score="getStudentAverageScore"
        :get-score-badge-class="getScoreBadgeClass"
        @header-click="openDateFocus"
        @paperclip-click="onPaperclipClick"
        @cell-click="handleCellClick"
        @student-click="showFloatingRow"
        @update:editedValue="editedValue = $event"
        @confirm-edit="confirmEdit"
        @cancel-edit="cancelEdit"
        @navigate="navigate"
      />
    </template>

    <IndividualJournalsInlineView
      v-if="viewMode === 'individual'"
      :main-event-id="props.journalId"
    />

    <!-- KtpDetailViewPopover -->
    <KtpDetailViewPopover
      v-model:opened="ktpViewPopoverOpened"
      :target="ktpViewPopoverTarget"
      :detail="selectedKtpDetail"
    />

    <!-- Journal History Dialog -->
    <JournalHistoryDialog
      v-model:opened="isHistoryDialogOpen"
      :journal-id="props.journalId"
    />

      <MakeupHoursPopover
        :journal-dates="journalDatesForMakeup"
        :is-loading="isMakeupRequestLoading"
        @save="onMakeupHoursSave"
      />

    <!-- Journal Settings Popover -->
    <JournalSettingsPopover
      :initial-settings="localJournalSettings"
      @save="saveJournalSettings"
      @closed="resetLocalSettings"
    />

    <!-- Recalculate Controls Popup -->
    <RecalcControlsPopup
      ref="recalcPopupRef"
      :students="students"
      :recalc-control-options="recalcControlOptions"
      @submit="handleRecalcSubmit"
      @closed="onRecalcPopupClosed"
    />
    <!-- Retake Modal -->
    <RetakeModal
      :is-open="isRetakeModalOpen"
      :students="students"
      @close="isRetakeModalOpen = false"
      @submit="handleRetakeSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch, onUpdated } from "vue";
import { debounce } from "es-toolkit";
import dayjs from "dayjs";
import { isFutureDate, isPastDate } from "@/utils/date";
import { confirmMarkEdit } from "@/utils/dialogs";
import {
  DATE_DAY_MONTH_FORMAT,
  DATE_YEAR_FORMAT,
  DATE_STORAGE_FORMAT,
} from "@/constants/calendar";
import {
  exportHeaderLabelFor,
  scoreToLetter,
  getScoreBadgeClass,
  LETTER_GRADE_BUCKETS,
} from "@/components/journal/journalGrid.lib";
import { f7, f7Button } from "framework7-vue";
import IconFileText from "~icons/lucide/file-text";
import IconSettings from "~icons/lucide/settings";
import IconClock from "~icons/lucide/clock";
import IconCircleX from "~icons/lucide/circle-x";
import IconLockOpen from "~icons/lucide/lock-open";
import IconArrowDownToLine from "~icons/lucide/arrow-down-to-line";

import IconTriangleAlert from "~icons/lucide/triangle-alert";
import IconPaperclip from "~icons/lucide/paperclip";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconCalculator from "~icons/lucide/calculator";
import IconSparkles from "~icons/lucide/sparkles";
import IconFileSpreadsheet from "~icons/lucide/file-spreadsheet";
import {
  journal_view_general,
  journal_view_monitoring,
  journal_export,
  journal_history_changes,
  journal_recalc_controls,
  journal_grade_stats_title,
  journal_grade_stats_count,
  journal_future_date_tooltip,
  journal_settings_field_calculation,
  journal_settings_field_account_for,
  journal_settings_calc_calculated,
  journal_settings_calc_manual,
  journal_settings_account_assigned,
  journal_settings_account_all,
  makeup_hours_title,
} from "@/paraglide/messages";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import Select from "@/components/ui/Select.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
// Inlined MarkCell
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import KtpDetailViewPopover from "@/components/KtpDetailViewPopover.vue";
import JournalHistoryDialog from "@/components/JournalHistoryDialog.vue";
import RetakeModal from "./RetakeModal.vue";
import JournalToolbar from "./JournalToolbar.vue";
import JournalGradeStats from "./JournalGradeStats.vue";
import JournalGrid from "./JournalGrid.vue";
import IndividualJournalsInlineView from "./IndividualJournalsInlineView.vue";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import MakeupHoursPopover from "@/components/MakeupHoursPopover.vue";
import JournalSettingsPopover from "./JournalSettingsPopover.vue";
import RecalcControlsPopup from "./RecalcControlsPopup.vue";
import { useMakeupHours } from "@/components/journal/useMakeupHours";
import { useCalendarStore } from "@/stores/calendarStore";
import { useStudentStore } from "@/stores/studentStore";
import { useMarksStore } from "@/stores/marksStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useJournalKtp } from "@/components/journal/useJournalKtp";
import { useJournalColumns } from "@/components/journal/useJournalColumns";
import { debugLog, debugGroup } from "@/components/journal/journalGrid.lib";
import { useJournalStore } from "@/stores/journalStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore, type RupEntry } from "@/stores/rupEntryStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { storeToRefs } from "pinia";
import type { Mark } from "@/types/marks";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import type { StudentWithMarks } from "@/types/student";

interface ResolvedParticipant {
  id: string;
  surname: string;
  firstName: string;
  patronymic: string;
}

interface Props {
  journalId: string;
  journalSettings?: {
    calculationType: "calculated" | "manual";
    calculationMethod: "only-assigned" | "all-days";
    finalControlForm?: "written" | "oral" | "mixed";
    finalGradeFormula?: { intermediateWeight: number; finalWeight: number };
  };
  ktpId?: string | null;
  resolvedParticipants?: ResolvedParticipant[];
  showIndividualJournals?: boolean;
  hasIndividualJournals?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "show-floating-row": [student: any, index: number];
  "open-date-focus": [header: { type: string; label: string }, index: number];
  "update-students": [students: StudentWithMarks[]];
  "open-ktp-details": [header: { type: string; label: string }, index: number];
  "open-rup": [];
  "open-settings": [];
  "close-journal": [];
  "open-journal": [];
  download: [];
  "open-individual-journals": [];

  "save-journal-settings": [any];
}>();

const calendarStore = useCalendarStore();
const studentStore = useStudentStore();
const { getStudentFullName } = studentStore;
const marksStore = useMarksStore();

// Recalc popup state
const recalcPopupRef = ref<InstanceType<typeof RecalcControlsPopup> | null>(null);

const recalcControlOptions = computed(() => {
  const opts: Array<{ value: string; text: string }> = intermediateControlsForRecalc.value.map(c => ({
    value: c.label,
    text: c.label,
  }));
  opts.push({ value: '__finals__', text: 'Итоговые' });
  return opts;
});
const educationScheduleStore = useEducationScheduleStore();
const journalStore = useJournalStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const rupEntryStore = useRupEntryStore();
const intermediateControlStore = useIntermediateControlStore();
const finalControlStore = useFinalControlStore();
const scheduledIntermediateControlStore =
  useScheduledIntermediateControlStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
const { getRupEntryById, rupEntries } = storeToRefs(rupEntryStore);
const { getAcademicYearSemesterById } = storeToRefs(academicYearSemesterStore);
const { getIntermediateControlById } = storeToRefs(intermediateControlStore);
const { getFinalControlById } = storeToRefs(finalControlStore);
const {
  scheduledIntermediateControls,
  getScheduledIntermediateControlsByAcademicYear,
} = storeToRefs(scheduledIntermediateControlStore);
const { scheduledFinalControls, getScheduledFinalControlsByAcademicYear } =
  storeToRefs(scheduledFinalControlStore);

const editingCell = ref<{
  studentIndex: number;
  colIndex: number;
  markIndex: number;
} | null>(null);
const editedValue = ref("");
const viewMode = ref<"general" | "monitoring" | "individual">("general");

// Self-heal: fall back to general when individual mode becomes unavailable
// (either viewMode flips to "individual" while the feature is off, OR the
// feature flags flip false while already in individual mode).
watch(
  [viewMode, () => props.showIndividualJournals, () => props.hasIndividualJournals],
  ([mode]) => {
    if (mode === "individual" && !(props.showIndividualJournals && props.hasIndividualJournals)) {
      viewMode.value = "general";
    }
  }
);

const monitoringGradeStats = computed(() => {
  const counts: Record<string, number> = {};
  for (const bucket of LETTER_GRADE_BUCKETS) counts[bucket.letter] = 0;
  let totalGraded = 0;
  for (const student of students.value) {
    const finalRaw = getStudentFinalGrade(student.studentId);
    const finalNum = Number(finalRaw);
    if (!finalRaw || finalRaw === "—" || isNaN(finalNum)) continue;
    counts[scoreToLetter(finalNum)] += 1;
    totalGraded += 1;
  }
  return {
    entries: LETTER_GRADE_BUCKETS.map((b) => ({
      letter: b.letter,
      count: counts[b.letter],
    })),
    totalGraded,
  };
});

const displayedHeaders = computed(() => {
  if (viewMode.value === "monitoring") {
    return visibleHeaders.value.filter(
      (h) => h.type === "session" || h.isFinalSummary,
    );
  }
  return visibleHeaders.value;
});

const currentJournal = computed(() => {
  if (!props.journalId) return null;
  return journalStore.getJournalById(props.journalId);
});

const currentEvent = computed(() => {
  if (!props.journalId) return null;
  return calendarStore.getEventById(props.journalId);
});

const isViewOnly = computed(() => !!currentEvent.value?.isClosed);

const notifyViewOnly = () => {
  f7.toast
    .create({
      text: "Журнал закрыт. Редактирование недоступно.",
      position: "center",
      closeTimeout: 2000,
    })
    .open();
};

const withEditPermission = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: any[]) => {
    if (isViewOnly.value) {
      editingCell.value = null;
      notifyViewOnly();
      return;
    }
    return fn(...args);
  }) as T;
};

const currentRupEntry = computed(() => {
  const rupEntryId =
    currentJournal.value?.disciplineId || currentEvent.value?.rupEntryId;
  if (!rupEntryId) return null;
  const lookup = getRupEntryById.value;
  if (typeof lookup !== "function") return null;
  return (lookup(rupEntryId) as RupEntry | null | undefined) ?? null;
});

const {
  generateDates,
  canonicalTemplate,
  getCanonicalRows,
  getRowIndices,
  tableHeaders,
  visibleHeaders,
  visibleColumnIndices,
} = useJournalColumns({
  currentEvent,
  currentRupEntry,
  currentJournal,
  journalId: computed(() => props.journalId),
});

// Detect academic year mismatch for intermediate controls
const academicYearMismatchInfo = computed(() => {
  // Use semester's academic year (from calendar/planning), not discipline's academic year (from РУП)
  const event = currentEvent.value;
  const semesterId = event?.semester ? String(event.semester) : null;
  const currentSemester =
    semesterId && typeof getAcademicYearSemesterById.value === "function"
      ? getAcademicYearSemesterById.value(semesterId)
      : null;
  const academicYearId = currentSemester?.academicYearId || currentRupEntry.value?.academicYearId;

  if (!academicYearId) return null;

  const allScheduledControls = scheduledIntermediateControls.value || [];
  if (allScheduledControls.length === 0) return null;

  const scheduledForYear =
    typeof getScheduledIntermediateControlsByAcademicYear.value === "function"
      ? getScheduledIntermediateControlsByAcademicYear.value(academicYearId) || []
      : [];

  // If there are scheduled controls but none for this year, we have a mismatch
  if (scheduledForYear.length === 0 && allScheduledControls.length > 0) {
    const uniqueAcademicYears = Array.from(
      new Set(allScheduledControls.map((c: any) => c.academicYearId))
    );
    return {
      journalAcademicYearId: academicYearId,
      availableAcademicYearIds: uniqueAcademicYears,
      scheduledControlsCount: allScheduledControls.length,
      usingSemesterYear: !!currentSemester,
    };
  }

  return null;
});

const getStudentIdByIndex = (index: number): string | null => {
  if (
    !currentJournal.value?.students ||
    index < 0 ||
    index >= currentJournal.value.students.length
  ) {
    return null;
  }
  return currentJournal.value.students[index];
};

const students = computed(() => {
  if (!props.journalId || !currentJournal.value?.students?.length) return [];

  const resolvedById = new Map(
    (props.resolvedParticipants ?? []).map((p) => [p.id, p]),
  );

  // O(1) lookup map for student marks to prevent O(N^2) fetching overhead
  const journalMarksEntry = marksStore.journalMarks[props.journalId];
  const marksMap = new Map();
  if (journalMarksEntry && journalMarksEntry.studentMarks) {
    for (const sm of journalMarksEntry.studentMarks) {
      marksMap.set(sm.studentId, sm.marks);
    }
  }

  return currentJournal.value.students.map(
    (studentId: string, index: number) => {
      const studentMarks = marksMap.get(studentId) || [];
      const resolved = resolvedById.get(studentId);
      const name = resolved
        ? `${resolved.surname} ${resolved.firstName} ${resolved.patronymic}`.trim()
        : getStudentFullName(studentId);
      return {
        id: index + 1,
        name: name === studentId ? "" : name,
        marks: studentMarks,
        studentId: studentId,
      };
    }
  );
});

// --- TIME SLICING OPTIMIZATION ---
const visibleStudentsCount = ref(15);
const displayedStudents = computed(() => {
  return students.value.slice(0, visibleStudentsCount.value);
});

let renderInterval: any = null;
const startChunkedRendering = () => {
  if (renderInterval) clearInterval(renderInterval);
  renderInterval = setInterval(() => {
    if (visibleStudentsCount.value >= students.value.length) {
      clearInterval(renderInterval);
      return;
    }
    visibleStudentsCount.value += 15;
  }, 50); // Yield thread every 15 students
};
// ---------------------------------

const marksByStudentId = computed(() => {
  const map = new Map<string, any>();
  for (const student of students.value) {
    map.set(student.studentId, student.marks);
  }
  return map;
});

const getMark = (studentIndex: number, colIndex: number, markIndex: number) => {
  return marksMatrix.value[studentIndex]?.[colIndex]?.[markIndex] ?? "";
};

const marksMatrix = computed(() => {
  const matrix: Record<number, Record<number, string[]>> = {};
  const canonical = canonicalTemplate.value;
  const numCols = canonical ? canonical.length : 0;
  
  // Precompute storeColIndex for each cIdx
  const colIndexMap: Record<number, number | null> = {};
  for (let cIdx = 0; cIdx < numCols; cIdx++) {
    colIndexMap[cIdx] = getStoreIndexForCanonicalIndex(cIdx);
  }
  
  const currentStudents = students.value;
  for (let sIdx = 0; sIdx < currentStudents.length; sIdx++) {
    const student = currentStudents[sIdx];
    matrix[sIdx] = {};
    if (!student || !props.journalId) continue;
    
    // Fill final summary column (-1)
    matrix[sIdx][-1] = [getStudentFinalGrade(student.studentId)];
    
    // Fill standard columns
    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      matrix[sIdx][cIdx] = [];
      const storeColIndex = colIndexMap[cIdx];
      const studentMarks = student.marks;
      if (!studentMarks || storeColIndex == null || storeColIndex < 0 || storeColIndex >= studentMarks.length) {
        continue;
      }
      
      const values = studentMarks[storeColIndex].values;
      for (let mIdx = 0; mIdx < values.length; mIdx++) {
        const val = values[mIdx];
        matrix[sIdx][cIdx][mIdx] = val === null ? "" : String(val ?? "");
      }
    }
  }
  return matrix;
});

const userEditInProgress = ref(false);

const isRetakeModalOpen = ref(false);
const handleRetakeSubmit = (data: any) => {
  console.log("Retake requested:", data);
};

// Direct mark update function - no debounce, immediate save
const updateMark = withEditPermission(async (
  studentIndex: number,
  colIndex: number,
  markIndex: number,
  value: string | null
) => {
  userEditInProgress.value = true;

  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) {
    userEditInProgress.value = false;
    return;
  }

  const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
  if (storeColIndex == null || storeColIndex < 0) {
    userEditInProgress.value = false;
    scheduleRebuildMarks();
    return;
  }

  await marksStore.updateStudentMark(
    props.journalId,
    studentId,
    storeColIndex,
    markIndex,
    value
  );

  emit("update-students", students.value);
  userEditInProgress.value = false;
});

const setMark = (
  studentIndex: number,
  colIndex: number,
  markIndex: number,
  value: string
) => {
  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) return;
  if (colIndex < 0) return;

  const newValue = value === "+" || value === "" ? null : value;

  // Direct store update - no debounce
  updateMark(studentIndex, colIndex, markIndex, newValue);
};

// Date validation functions removed, imported from @/utils/date

const handleCellClick = withEditPermission((
  studentIndex: number,
  colIndex: number,
  markIndex: number
) => {
  const currentMark = getMark(studentIndex, colIndex, markIndex);
  const hasExistingValue = currentMark !== "" && currentMark !== null;

  if (hasExistingValue) {
    confirmMarkEdit(currentMark, () => editCell(studentIndex, colIndex, markIndex));
  } else {
    // Empty cell, edit directly
    editCell(studentIndex, colIndex, markIndex);
  }
});

const editCell = withEditPermission((
  studentIndex: number,
  colIndex: number,
  markIndex: number
) => {
  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) return;
  if (colIndex < 0) return;

  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
  if (!studentMarks || storeColIndex == null || storeColIndex < 0) return;

  const mark = studentMarks[storeColIndex];
  const markType = mark.type;
  const calculationType =
    props.journalSettings?.calculationType ||
    localJournalSettings.value.calculationType;
  // Only block editing for intermediate controls when in calculated mode
  // Final controls (like Экзамен) can always be edited manually
  if (markType === "session" && mark.controlType === "intermediate" && calculationType === "calculated") {
    return;
  }

  editingCell.value = { studentIndex, colIndex, markIndex };
  editedValue.value = getMark(studentIndex, colIndex, markIndex);
});

const confirmEdit = withEditPermission(() => {
  if (!editingCell.value) return;
  const { studentIndex, colIndex, markIndex } = editingCell.value;
  setMark(studentIndex, colIndex, markIndex, editedValue.value);
  editingCell.value = null;
});

const cancelEdit = () => {
  editingCell.value = null;
};

const navigate = withEditPermission(async (direction: "up" | "down" | "left" | "right") => {
  if (!editingCell.value) return;

  const {
    studentIndex: startStudent,
    colIndex: startCol,
    markIndex: startMark,
  } = editingCell.value;
  setMark(startStudent, startCol, startMark, editedValue.value);

  editingCell.value = null;

  nextTick(() => {
    let nextStudent = startStudent;
    let nextCol = startCol;
    let nextMark = startMark;

    const numStudents = students.value.length;
    const numCols = visibleHeaders.value.length;
    const getColRows = (col: number) => getCanonicalRows(col);
    const currentColRows = getColRows(startCol);

    switch (direction) {
      case "up":
        nextStudent -= 1;
        break;
      case "down":
        nextStudent += 1;
        break;
      case "right":
        if (nextMark < currentColRows - 1) {
          nextMark += 1;
        } else {
          nextMark = 0;
          nextCol += 1;
        }
        break;
      case "left":
        if (nextMark > 0) {
          nextMark -= 1;
        } else {
          nextCol -= 1;
          const targetRows = getColRows(
            ((nextCol % numCols) + numCols) % numCols
          );
          nextMark = Math.max(0, targetRows - 1);
        }
        break;
    }

    if (nextStudent < 0) nextStudent = numStudents - 1;
    if (nextStudent >= numStudents) nextStudent = 0;
    if (nextCol < 0) nextCol = numCols - 1;
    if (nextCol >= numCols) nextCol = 0;

    editCell(nextStudent, nextCol, nextMark);
  });
});

const openDateFocus = (
  header: { type: string; label: string },
  index: number
) => {
  if (header.type !== "date") return;
  emit("open-date-focus", header, index);
};

const showFloatingRow = (student: any, index: number) => {
  emit("show-floating-row", student, index);
};

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && editingCell.value) {
    cancelEdit();
  }
};

const isHistoryDialogOpen = ref(false);

const {
  ktpViewPopoverOpened,
  ktpViewPopoverTarget,
  selectedKtpDetail,
  getKtpForHeader,
  onPaperclipClick,
} = useJournalKtp({
  currentEvent,
  currentJournal,
  currentRupEntry,
  // visibleHeaders is declared further down; the closure defers access.
  visibleHeaders: computed(() => visibleHeaders.value),
  ktpId: computed(() => props.ktpId),
});

const localJournalSettings = ref({
  calculationType: props.journalSettings?.calculationType || "calculated",
  calculationMethod:
    props.journalSettings?.calculationMethod || "only-assigned",
  finalControlForm: props.journalSettings?.finalControlForm || "written" as "written" | "oral" | "mixed",
  finalGradeFormula: props.journalSettings?.finalGradeFormula || { intermediateWeight: 0.6, finalWeight: 0.4 },
});

const resetLocalSettings = () => {
  localJournalSettings.value = {
    calculationType: props.journalSettings?.calculationType || "calculated",
    calculationMethod: props.journalSettings?.calculationMethod || "only-assigned",
    finalControlForm: props.journalSettings?.finalControlForm || "written",
    finalGradeFormula: props.journalSettings?.finalGradeFormula || { intermediateWeight: 0.6, finalWeight: 0.4 },
  };
};

const saveJournalSettings = withEditPermission((settings: any) => {
  emit("save-journal-settings", settings);
  localJournalSettings.value = settings;
});

const onOpenRupClick = () => emit("open-rup");
const onSettingsClick = () => emit("open-settings");
const onOpenIndividualJournalsClick = () => emit("open-individual-journals");
const onHistoryClick = () => {
  isHistoryDialogOpen.value = true;
};
const onCloseJournalClick = withEditPermission(() => {
  emit("close-journal");
});
const onOpenJournalClick = () => emit("open-journal");
const onDownloadClick = () => emit("download");

const onRecalcClick = withEditPermission(() => {
  recalcPopupRef.value?.open();
});

const onRecalcPopupClosed = () => {
  // Handled internally by component
};

// Makeup Hours
const {
  isMakeupRequestLoading,
  journalDatesForMakeup,
  onMakeupHoursClick,
  onMakeupHoursSave,
} = useMakeupHours({
  // canonicalTemplate is declared further down; the closure defers access.
  canonicalTemplate: computed(() => canonicalTemplate.value),
  currentEvent,
  journalId: computed(() => props.journalId),
});

const handleRecalcSubmit = async (control: string, studentIds: string[]) => {
  if (control === '__finals__') {
    await computeAllSessionGrades({ force: true, studentIds });
  } else {
    await computeAllSessionGrades({ force: true, labels: [control], studentIds });
  }
};

// Get all intermediate controls for the recalc popup
const intermediateControlsForRecalc = computed(() => {
  const canonical = canonicalTemplate.value || [];

  console.log("[JournalTab] intermediateControlsForRecalc - canonical template:", {
    totalColumns: canonical.length,
    sessionColumns: canonical.filter((m: any) => m?.type === "session"),
    allSessionDetails: canonical
      .filter((m: any) => m?.type === "session")
      .map((m: any) => ({
        type: m.type,
        controlType: m.controlType,
        label: m.label,
        sessionId: m.sessionId,
        scheduledControlId: m.scheduledControlId,
      })),
  });

  const controls = canonical
    .filter((mark: any) => {
      const isIntermediate = mark?.type === "session" && mark?.controlType === "intermediate";
      console.log("[JournalTab] checking mark:", {
        type: mark?.type,
        controlType: mark?.controlType,
        label: mark?.label,
        isIntermediate,
      });
      return isIntermediate;
    })
    .map((mark: any, index: number) => ({
      id: mark.scheduledControlId || mark.sessionId || `intermediate-${index}`,
      label: mark.label || "ПК",
    }));

  console.log("[JournalTab] intermediateControlsForRecalc - filtered controls:", controls);

  // Remove duplicates based on label
  const unique = controls.filter(
    (control, index, self) =>
      index === self.findIndex((c) => c.label === control.label)
  );

  console.log("[JournalTab] intermediateControlsForRecalc - unique controls:", unique);

  return unique;
});

const getStoreIndexForDatePosition = (datePos: number): number | null => {
  const canonical = canonicalTemplate.value as any[] | undefined;
  if (!canonical || datePos < 0) return null;
  let seen = -1;
  for (let ci = 0; ci < canonical.length; ci++) {
    if ((canonical[ci] as any)?.type === "date") {
      seen += 1;
      if (seen === datePos) {
        return getStoreIndexForCanonicalIndex(ci);
      }
    }
  }
  return null;
};

const computeDayAverage = (
  studentId: string,
  datePos: number
): number | null => {
  if (!studentId || !props.journalId) return null;
  const storeColIndex = getStoreIndexForDatePosition(datePos);

  console.log("[computeDayAverage] Processing:", {
    studentId,
    datePos,
    storeColIndex,
  });

  if (storeColIndex == null || storeColIndex < 0) {
    console.warn("[computeDayAverage] Invalid store column index:", storeColIndex);
    return null;
  }
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks || storeColIndex >= studentMarks.length) {
    console.warn("[computeDayAverage] No student marks or column out of bounds:", {
      hasMarks: !!studentMarks,
      storeColIndex,
      marksLength: studentMarks?.length,
    });
    return null;
  }
  const values = studentMarks[storeColIndex]?.values || [];
  const nums = values
    .map((v) =>
      v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : null
    )
    .filter((v): v is number => v !== null);

  console.log("[computeDayAverage] Result:", {
    datePos,
    storeColIndex,
    rawValues: values,
    valuesDetailed: values.map((v, i) => ({
      index: i,
      value: v,
      type: typeof v,
      isNull: v === null,
      isEmpty: v === "",
      isNumeric: !isNaN(Number(v)),
      asNumber: Number(v)
    })),
    nums,
    numsLength: nums.length,
    avg: nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null,
  });

  if (nums.length === 0) return null;
  const avg = nums.reduce((s, v) => s + v, 0) / nums.length;
  return avg;
};

const computeSessionGradeForStudent = (
  studentId: string,
  sessionDateIndices: number[],
  method: "only-assigned" | "all-days"
): string | null => {
  console.log("[computeSessionGradeForStudent] Called with:", {
    studentId,
    sessionDateIndices,
    method,
    sessionDateIndicesLength: sessionDateIndices.length,
  });

  if (sessionDateIndices.length === 0) {
    console.warn("[computeSessionGradeForStudent] sessionDateIndices is empty, returning null");
    return null;
  }

  if (method === "all-days") {
    const totalDays = sessionDateIndices.length;
    if (totalDays === 0) return null;
    let sum = 0;
    const dayAverages: Array<{ idx: number; avg: number | null }> = [];
    sessionDateIndices.forEach((idx) => {
      const dayAvg = computeDayAverage(studentId, idx);
      dayAverages.push({ idx, avg: dayAvg });
      sum += dayAvg ?? 0;
    });
    console.log("[computeSessionGradeForStudent] all-days method:", {
      totalDays,
      dayAverages,
      sum,
      grade: (sum / totalDays).toFixed(1),
    });
    const grade = sum / totalDays;
    return grade.toFixed(1);
  }

  // only-assigned
  let sum = 0;
  let count = 0;
  const dayAverages: Array<{ idx: number; avg: number | null }> = [];
  sessionDateIndices.forEach((idx) => {
    const dayAvg = computeDayAverage(studentId, idx);
    dayAverages.push({ idx, avg: dayAvg });
    if (dayAvg !== null) {
      sum += dayAvg;
      count += 1;
    }
  });

  console.log("[computeSessionGradeForStudent] only-assigned method:", {
    sessionDateIndices,
    dayAverages,
    sum,
    count,
    grade: count > 0 ? (sum / count).toFixed(1) : null,
  });

  if (count === 0) {
    console.warn("[computeSessionGradeForStudent] No valid marks found in date range, returning null");
    return null;
  }
  const grade = sum / count;
  return grade.toFixed(1);
};

const computeAllSessionGrades = async (opts?: {
  force?: boolean;
  labels?: Array<string | RegExp>;
  studentIds?: string[];
}) => {
  const force = !!opts?.force;
  const calculationType =
    props.journalSettings?.calculationType ||
    localJournalSettings.value.calculationType ||
    "calculated";

  console.log("[computeAllSessionGrades] Starting calculation:", {
    force,
    calculationType,
    hasLabels: !!opts?.labels,
    labels: opts?.labels,
  });

  if (!props.journalId) {
    console.warn("[computeAllSessionGrades] No journal ID, exiting");
    return;
  }
  if (!force && calculationType !== "calculated") {
    console.warn("[computeAllSessionGrades] Not forced and calculationType is not 'calculated', exiting");
    return;
  }

  // IMPORTANT: Intermediate controls (РК1, РК2) should ONLY be computed manually
  // when the user clicks the "Расчитать" button (force: true)
  // Automatic computation should NOT compute intermediate controls
  if (!force) {
    console.warn("[computeAllSessionGrades] Not forced - skipping automatic computation of intermediate controls");
    return;
  }

  const canonical = canonicalTemplate.value;
  if (!Array.isArray(canonical) || canonical.length === 0) {
    console.warn("[computeAllSessionGrades] No canonical template, exiting");
    return;
  }

  const matchesLabel = (label: string | undefined) => {
    if (!opts?.labels || opts.labels.length === 0) return true;
    const safeLabel = label || "";
    return opts.labels.some((rule) =>
      typeof rule === "string" ? rule === safeLabel : rule.test(safeLabel)
    );
  };

  const calculationMethod =
    props.journalSettings?.calculationMethod ||
    localJournalSettings.value.calculationMethod ||
    "only-assigned";

  console.log("[computeAllSessionGrades] Using calculation method:", calculationMethod);

  const sessionColumns = canonical
    .map((mark, canonicalIndex) => ({ mark, canonicalIndex }))
    .filter(({ mark }) =>
      mark?.type === "session" &&
      mark?.controlType === "intermediate" &&
      matchesLabel(mark.label)
    );

  console.log("[computeAllSessionGrades] Found session columns:", {
    totalCanonical: canonical.length,
    sessionColumnsCount: sessionColumns.length,
    sessionColumns: sessionColumns.map(({ mark, canonicalIndex }) => ({
      canonicalIndex,
      type: mark?.type,
      label: mark?.label,
      controlType: mark?.controlType,
      sessionDateIndices: mark?.sessionDateIndices,
    })),
  });

  if (sessionColumns.length === 0) {
    console.warn("[computeAllSessionGrades] No session columns found, exiting");
    return;
  }

  let allStudents = marksStore.getJournalStudentMarks(props.journalId);
  if (!Array.isArray(allStudents) || allStudents.length === 0) {
    console.warn("[computeAllSessionGrades] No students found, exiting");
    return;
  }

  // Filter by selected student IDs if provided
  const filteredStudents = opts?.studentIds
    ? allStudents.filter(s => opts.studentIds!.includes(s.studentId))
    : allStudents;

  console.log("[computeAllSessionGrades] Processing students:", {
    totalStudents: allStudents.length,
    filteredStudents: filteredStudents.length,
    hasStudentFilter: !!opts?.studentIds,
  });

  // Collect all update promises to await them together
  const updatePromises: Promise<boolean>[] = [];

  sessionColumns.forEach(({ mark, canonicalIndex }) => {
    const sessionMark = mark as Mark;
    const dateIndices = Array.isArray(sessionMark.sessionDateIndices)
      ? sessionMark.sessionDateIndices
      : [];
    const storeIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

    console.log("[computeAllSessionGrades] Processing session column:", {
      canonicalIndex,
      label: mark?.label,
      controlType: mark?.controlType,
      dateIndices,
      storeIndex,
    });

    if (storeIndex == null || storeIndex < 0) {
      console.warn("[computeAllSessionGrades] Invalid store index for column, skipping:", {
        canonicalIndex,
        storeIndex,
      });
      return;
    }

    filteredStudents.forEach((studentMark) => {
      const grade = computeSessionGradeForStudent(
        studentMark.studentId,
        dateIndices,
        calculationMethod
      );

      const existingValue =
        studentMark.marks?.[storeIndex]?.values?.[0] ?? null;

      console.log("[computeAllSessionGrades] Student grade computed:", {
        studentId: studentMark.studentId,
        canonicalIndex,
        label: mark?.label,
        grade,
        existingValue,
        willUpdate: existingValue !== grade,
      });

      if (existingValue === grade) return;

      // Queue the update and collect the promise
      const updatePromise = marksStore.updateStudentMark(
        props.journalId!,
        studentMark.studentId,
        storeIndex,
        0,
        grade
      );
      updatePromises.push(updatePromise);
    });
  });

  // Wait for all session grade updates to complete before returning
  await Promise.all(updatePromises);

  console.log("[computeAllSessionGrades] Completed:", {
    totalUpdates: updatePromises.length,
  });
};

/**
 * Check if all intermediate and final controls are calculated for a student.
 * A control is considered "calculated" if it has at least one non-empty value.
 * @param studentId - The ID of the student to check
 * @returns true if all controls have grades, false otherwise
 */
const areAllControlsCalculated = (studentId: string): boolean => {
  if (!props.journalId) return false;

  // Get list of all controls from canonical template
  const canonical = canonicalTemplate.value;
  if (!Array.isArray(canonical) || canonical.length === 0) {
    // If no template, consider all calculated (nothing to check)
    return true;
  }

  // Filter only intermediate and final controls
  const controlColumns = canonical.filter((col): col is Mark => {
    return (
      col.type === "session" &&
      (col.controlType === "intermediate" || col.controlType === "final")
    );
  });

  // If no controls, consider all calculated
  if (controlColumns.length === 0) {
    return true;
  }

  // Get student's marks
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks) {
    // No marks - controls not calculated
    return false;
  }

  // For each control, check if there's a non-empty grade
  for (const controlCol of controlColumns) {
    // Find corresponding mark in studentMarks
    const correspondingMark = studentMarks.find((mark: Mark) => {
      if (mark.type !== "session") return false;

      // Match by scheduledControlId (most accurate)
      if (
        controlCol.scheduledControlId &&
        mark.scheduledControlId === controlCol.scheduledControlId
      ) {
        return true;
      }

      // Alternatively by sessionId
      if (controlCol.sessionId && mark.sessionId === controlCol.sessionId) {
        return true;
      }

      // Alternatively by label (less reliable, but fallback)
      if (controlCol.label && mark.label === controlCol.label) {
        return true;
      }

      return false;
    });

    // If no corresponding mark found - control not calculated
    if (!correspondingMark) {
      return false;
    }

    // Check that there's at least one non-empty value
    const hasNonEmptyValue = correspondingMark.values.some(
      (value) => value !== null && value !== undefined && value !== ""
    );

    if (!hasNonEmptyValue) {
      return false;
    }
  }

  // All controls calculated
  return true;
};

const getStudentAverageScore = (studentId: string): string => {
  if (!props.journalId) return "—";

  const studentMarks = marksByStudentId.value.get(studentId);
  if (!studentMarks) return "—";

  const allMarks: (string | null)[] = [];

  // Collect all marks from all columns
  studentMarks.forEach((mark: any) => {
    mark.values.forEach((value: any) => {
      if (value !== null && value !== "") {
        allMarks.push(value);
      }
    });
  });

  // Filter out non-numeric values and convert to numbers
  const numericMarks = allMarks
    .filter((mark) => mark && !isNaN(Number(mark)))
    .map((mark) => Number(mark));

  if (numericMarks.length === 0) {
    return "—"; // Em dash for no scores
  }

  const average =
    numericMarks.reduce((sum, mark) => sum + mark, 0) / numericMarks.length;
  return average.toFixed(1);
};

const getStudentFinalGrade = (studentId: string): string => {
  if (!props.journalId) return "—";

  const studentMarks = marksByStudentId.value.get(studentId);
  if (!studentMarks) return "—";

  const canonical = canonicalTemplate.value || [];

  // Find all intermediate control columns (РК1, РК2, etc.)
  const intermediateControlColumns = canonical
    .map((mark: any, index: number) => ({ mark, index }))
    .filter(({ mark }) => mark?.type === "session" && mark?.controlType === "intermediate");

  // Find all final control columns (Экзамен/Зачет/etc.)
  const finalControlColumns = canonical
    .map((mark: any, index: number) => ({ mark, index }))
    .filter(({ mark }) => mark?.type === "session" && mark?.controlType === "final");

  // If no intermediate controls are scheduled, return "—"
  if (intermediateControlColumns.length === 0) {
    return "—";
  }

  // Check if student has values for ALL intermediate controls
  const rkGrades: number[] = [];

  for (const { mark, index: canonicalIndex } of intermediateControlColumns) {
    const storeColIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

    if (storeColIndex == null || storeColIndex < 0) {
      return "—";
    }

    if (storeColIndex >= studentMarks.length) {
      return "—";
    }

    const markValues = studentMarks[storeColIndex].values;
    const rkValue = markValues?.[0];

    if (rkValue === null || rkValue === "" || rkValue === undefined) {
      return "—";
    }

    // Try to parse as number
    const numericValue = Number(rkValue);
    if (isNaN(numericValue)) {
      return "—";
    }

    rkGrades.push(numericValue);
  }

  // If we collected fewer grades than expected, some РК are missing
  if (rkGrades.length < intermediateControlColumns.length) {
    return "—";
  }

  // 1) (РК1 + РК2) / 2 = итоговая (если нет экзамена/зачета)
  // 2) Если есть итоговый контроль (экзамен/зачет):
  //    итог = avg(РК) * 0.6 + оценка_экзамена * 0.4
  const rkAverage = rkGrades.reduce((sum, grade) => sum + grade, 0) / rkGrades.length;

  if (finalControlColumns.length === 0) {
    return rkAverage.toFixed(1);
  }

  const finalGrades: number[] = [];
  for (const { mark, index: canonicalIndex } of finalControlColumns) {
    const storeColIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

    if (storeColIndex == null || storeColIndex < 0) continue;
    if (storeColIndex >= studentMarks.length) continue;

    const markValues = studentMarks[storeColIndex].values;
    const finalValue = markValues?.[0];

    if (finalValue === null || finalValue === "" || finalValue === undefined) {
      continue;
    }

    const numericValue = Number(finalValue);
    if (isNaN(numericValue)) {
      continue;
    }

    finalGrades.push(numericValue);
  }

  if (finalGrades.length === 0) {
    return "—";
  }

  const finalControlAverage =
    finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length;
    
  const intWeight = localJournalSettings.value.finalGradeFormula?.intermediateWeight ?? 0.6;
  const finWeight = localJournalSettings.value.finalGradeFormula?.finalWeight ?? 0.4;
  const weighted = rkAverage * intWeight + finalControlAverage * finWeight;

  return weighted.toFixed(1);
};

// Map canonical column index to current store column index (using first student's marks)
const getStoreIndexForCanonicalIndex = (
  canonicalCol: number
): number | null => {
  if (canonicalCol == null || canonicalCol < 0) return null;
  const canonical = canonicalTemplate.value?.[canonicalCol] as any;
  if (!canonical) return null;
  const firstStudentId = getStudentIdByIndex(0);
  if (!firstStudentId || !props.journalId) return null;
  const studentMarks =
    marksStore.getStudentMarks(props.journalId, firstStudentId) || [];
  const findBy = (predicate: (m: any) => boolean) =>
    studentMarks.findIndex(predicate);
  if (canonical.type === "date") {
    const iso = canonical.isoDate;
    if (!iso) return null;
    return findBy((m: any) => m.type === "date" && m.isoDate === iso);
  }
  if (canonical.type === "session") {
    const sessionId = canonical.sessionId;
    if (sessionId) {
      return findBy(
        (m: any) => m.type === "session" && m.sessionId === sessionId
      );
    }
    const label = canonical.label;
    return findBy((m: any) => m.type === "session" && m.label === label);
  }
  // Fallback by type
  return findBy((m: any) => m.type === canonical.type);
};
watch(
  () => visibleHeaders.value,
  (headers) => {
    debugGroup("visibleHeaders changed", () => {
      debugLog(
        "headers",
        headers.map((h) => ({ index: h.index, type: h.type, label: h.label }))
      );
    });
  },
  { deep: true, immediate: true }
);

// Increased delay from 150ms to 500ms to ensure user edits (300ms) complete first
const scheduleRecomputeSessionGrades = debounce(async () => {
  await computeAllSessionGrades();
}, 500);

watch(
  () => JSON.stringify(props.journalSettings),
  () => {
    scheduleRecomputeSessionGrades();
  }
);

// Rebuild marks when sessions list changes (ensures session columns appear on load)
const rebuildMarks = async () => {
  if (!(props.journalId && currentJournal.value?.students?.length)) return;

  // If user is editing, wait for completion
  if (userEditInProgress.value) {
    console.log("[JournalTab] Deferring rebuildMarks - user edit in progress");
    // Wait for current update to complete
    await nextTick();
  }

  // Initialize journal in backend if needed
  const event = currentEvent.value;
  const semester = academicYearSemesterStore.getActiveAcademicYearSemester;
  
  if (event && semester) {
    try {
      await marksStore.initializeJournalBackend(
        props.journalId,
        currentJournal.value.disciplineId,
        currentJournal.value.group,
        semester.academicYearId,
        semester.id,
        currentJournal.value.students
      );
    } catch (err) {
      console.warn("[JournalTab] Failed to initialize journal in backend:", err);
      // Continue anyway - marks will work locally
    }
  }

  const markTemplate = generateDates();
  marksStore.initializeJournalMarks(
    props.journalId,
    currentJournal.value.students,
    markTemplate
  );
  
  // Load marks from backend to merge with the template
  try {
    console.log("[JournalTab] Loading marks from backend for journal:", props.journalId);
    console.time(`journal-tab-load-marks-${props.journalId}`);
    await marksStore.loadJournalMarks(props.journalId);
    console.timeEnd(`journal-tab-load-marks-${props.journalId}`);
    console.log("[JournalTab] Marks loaded successfully from backend");
  } catch (err) {
    console.timeEnd(`journal-tab-load-marks-${props.journalId}`);
    console.warn("[JournalTab] Failed to load marks from backend:", err);
    // Continue - marks will work with local template
  }
  
  scheduleRecomputeSessionGrades();
  console.timeEnd(`journal-tab-mounted-${props.journalId}`);
};

const scheduleRebuildMarks = debounce(() => {
  rebuildMarks();
}, 250);

// Rebuild marks when event times or weekly schedules change
watch(
  () => {
    const ev = currentEvent.value;
    if (!ev) return null;
    return [ev.startDate, ev.endDate, JSON.stringify(ev.weeklySchedules || [])];
  },
  () => {
    scheduleRebuildMarks();
  },
  { deep: false }
);

// Rebuild marks when active education schedules change (ensures correct row counts once schedules load)
watch(
  () => JSON.stringify(getActiveYearSchedules.value),
  () => {
    scheduleRebuildMarks();
  }
);

watch(
  () => JSON.stringify(scheduledIntermediateControls.value),
  () => {
    scheduleRebuildMarks();
  }
);

watch(
  () => JSON.stringify(scheduledFinalControls.value),
  () => {
    scheduleRebuildMarks();
  }
);

watch(
  () => JSON.stringify(currentRupEntry.value?.distributionEntries ?? []),
  () => {
    scheduleRebuildMarks();
  }
);
const updateStudent = async (updatedStudent: any) => {
  if (!updatedStudent || !props.journalId) return;

  // Update marks in store
  if (updatedStudent.marks) {
    marksStore.updateStudentMarks(
      props.journalId,
      updatedStudent.studentId,
      updatedStudent.marks
    );
  }
  scheduleRecomputeSessionGrades();
};

const updateStudents = async (updatedStudents: any[]) => {
  if (updatedStudents && props.journalId) {
    // Update all students' marks in store
    const studentMarksToUpdate = updatedStudents.map((student) => ({
      studentId: student.studentId,
      marks: student.marks,
    }));

    marksStore.updateMultipleStudentMarks(
      props.journalId,
      studentMarksToUpdate
    );
    scheduleRecomputeSessionGrades();
  }
};

const getExportSnapshot = () => {
  if (!props.journalId) return null;
  const canonical = canonicalTemplate.value || [];
  const exportColumns = canonical.map((mark: any, index: number) => ({
    canonicalIndex: index,
    type: mark.type,
    label: exportHeaderLabelFor(mark),
    isoDate: mark?.isoDate ?? null,
  }));

  const rows = (currentJournal.value?.students || []).map(
    (studentId: string) => {
      const studentMarks =
        marksStore.getStudentMarks(props.journalId!, studentId) || [];

      const attendance = exportColumns.map(({ canonicalIndex, type }) => {
        const storeIndex = getStoreIndexForCanonicalIndex(canonicalIndex);
        if (storeIndex == null || storeIndex < 0) return "";
        const mark = studentMarks[storeIndex];
        if (!mark) return "";

        if (type === "date") {
          const combined = (mark.values || [])
            .map((value) =>
              value === null || value === "" ? "" : String(value).trim()
            )
            .filter((value) => value.length > 0);
          return combined.join(" / ");
        }

        const value = mark.values?.[0];
        return value == null || value === "" ? "" : String(value);
      });

      return {
        studentId,
        fullName: getStudentFullName(studentId),
        attendance,
        finalSummary: getStudentFinalGrade(studentId),
      };
    }
  );

  return {
    columns: exportColumns.map(({ canonicalIndex, ...rest }) => rest),
    students: rows,
  };
};

defineExpose({
  updateStudent,
  updateStudents,
  tableHeaders: computed(() => tableHeaders.value),
  students: computed(() => students.value),
  getExportSnapshot,
  getKtpForHeader,
  onPaperclipClick,
  isViewOnly,
  notifyViewOnly,
});

onMounted(() => {
  scheduleRebuildMarks();
  startChunkedRendering();
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUpdated(() => {
  // Empty
});

onUnmounted(() => {
  if (renderInterval) clearInterval(renderInterval);
  window.removeEventListener("keydown", handleGlobalKeydown);
});

watch(
  () => currentJournal.value,
  (newJournal) => {
    if (props.journalId && newJournal?.students?.length) {
      scheduleRebuildMarks();
    }
  },
  { immediate: true }
);
</script>
```
