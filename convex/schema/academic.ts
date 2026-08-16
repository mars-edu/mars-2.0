import { defineTable } from "convex/server";
import { v } from "convex/values";

export const academicTables = {
  /**
   * Education technologies — parent entity for academic years. Colleges/
   * universities may run multiple technologies in parallel (e.g. "Классическая"
   * linear vs "Кредитная"). Each academic year points to one technology, which
   * is the source of truth for `academicHourMinutes` (a year may still override
   * it — see `academicYears.academicHourMinutes`).
   */
  educationTechnologies: defineTable({
    name: v.string(), // "Классическая", "Кредитная", "Модульная"
    shortName: v.optional(v.string()),
    academicHourMinutes: v.number(), // 45 / 40 / 60 (required — tech IS the source of truth)
    isDefault: v.boolean(), // exactly one true — legacy fallback
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_isDefault", ["isDefault"]),

  /**
   * Study languages (языки обучения) — reference data lookup table.
   * NOT a foreign key target: `rupEntries.language`, `students.language`,
   * `calendarEvents.languages[]` etc. all keep storing the plain `code`
   * string. This table exists so the code/name/color/order/isDefault
   * metadata behind those codes is persisted and editable from Settings
   * instead of a hardcoded `DEFAULT_LANGUAGES` const.
   */
  studyLanguages: defineTable({
    code: v.string(), // "ru" | "kk" | "en" | … — stable key used across existing data
    name: v.string(), // "Русский", "Қазақша", "English"
    shortName: v.optional(v.string()),
    color: v.optional(v.string()), // hex/tailwind token for the pill in RupLanguageTabs
    isDefault: v.boolean(), // exactly one true
    order: v.optional(v.number()), // display ordering
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_isDefault", ["isDefault"])
    .index("by_code", ["code"]),

  /**
   * Academic years - tracks school year periods
   * Migrated from: academicYearStore.ts
   */
  academicYears: defineTable({
    name: v.string(),
    startYear: v.number(), // legacy — keep for name derivation + fallback
    endYear: v.number(),
    isActive: v.boolean(),
    // Length of one academic hour in minutes for this year (default 45 when
    // undefined — Kazakhstan college standard). Drives calculator's
    // astronomical→academic conversion; per-year so the regulation can be
    // adjusted (e.g. 40/45/50) without a code change or global flag.
    // EXISTING per-year override — keep as-is even after technologyId lands.
    academicHourMinutes: v.optional(v.number()),
    // Expand-contract contract step (docs/migration-playbook.md Pattern A):
    // narrowed to required after the prod backfill migration
    // (convex/migrations/educationTechnologyBackfill.ts) filled every row.
    technologyId: v.id("educationTechnologies"),
    startDate: v.string(), // ISO date — start of the academic year
    endDate: v.string(), // ISO date — end of the academic year
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_active", ["isActive"])
    .index("by_startYear", ["startYear"])
    .index("by_technology", ["technologyId"]),

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
    createdAt: v.string(),
    updatedAt: v.string(),
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
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_semesterDefinition", ["semesterDefinitionId"]),

  /**
   * Specialties/Programs offered
   * Migrated from: specialtyStore.ts
   */
  specialties: defineTable({
    name: v.string(),
    code: v.string(),
    codeName: v.string(),
    details: v.optional(v.string()),
    year: v.optional(v.number()),
    orderNumber: v.optional(v.string()),
    hasModule: v.optional(v.boolean()),
    isHighlighted: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_code", ["code"]),

  /**
   * Courses/Year levels
   * Migrated from: courseStore.ts
   */
  courses: defineTable({
    number: v.string(),
    name: v.optional(v.string()),
    semesters: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  /**
   * Base education levels (9 or 11 year base)
   * Migrated from: baseStore.ts
   */
  bases: defineTable({
    value: v.number(), // 9 or 11
    name: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  /**
   * Teacher positions/roles
   * Migrated from: positionStore.ts
   */
  positions: defineTable({
    name: v.string(),
    shortName: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
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
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  /**
   * Disciplines/Subjects
   * Migrated from: disciplineStore.ts
   */
  disciplines: defineTable({
    moduleIndex: v.string(),
    moduleName: v.string(),
    learningOutcome: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  /**
   * Modules for modular education
   * Migrated from: moduleStore.ts
   */
  modules: defineTable({
    name: v.string(),
    index: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),
};
