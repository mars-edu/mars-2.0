import { defineTable } from "convex/server";
import { v } from "convex/values";

export const academicTables = {
  /**
   * Academic years - tracks school year periods
   * Migrated from: academicYearStore.ts
   */
  academicYears: defineTable({
    name: v.string(),
    startYear: v.number(),
    endYear: v.number(),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_active", ["isActive"])
    .index("by_startYear", ["startYear"]),

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
