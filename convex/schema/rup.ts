import { defineTable } from "convex/server";
import { v } from "convex/values";

export const rupTables = {
  /**
   * RUP entries - curriculum modules with learning outcomes and embedded language variants
   */
  rupEntries: defineTable({
    specialtyIds: v.array(v.string()),
    academicYearId: v.id("academicYears"),
    baseClass: v.optional(v.array(v.number())),
    language: v.optional(v.string()),
    groupId: v.optional(v.string()),
    moduleIndex: v.string(),
    moduleName: v.string(),
    learningOutcome: v.string(),
    /**
     * Target language-variant array (P5 migration).
     */
    variants: v.array(
      v.object({
        language: v.string(),
        moduleIndex: v.string(),
        moduleName: v.string(),
        learningOutcome: v.string(),
      })
    ),
    totalCredits: v.string(),
    totalHours: v.string(),
    groupHours: v.optional(v.string()),
    theoreticalHours: v.string(),
    labPracticalHours: v.string(),
    field3Value: v.string(),
    srspHours: v.string(),
    srsHours: v.string(),
    trainingPracticeHours: v.string(),
    individualHours: v.string(),
    individualAdditionalHours: v.optional(v.string()),
    position: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_position", ["academicYearId", "position"])
    .index("by_groupId", ["groupId"]),

  /**
   * Distribution entries for RUP items across semesters
   */
  distributionEntries: defineTable({
    rupEntryId: v.id("rupEntries"),
    academicYearId: v.id("academicYears"),
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
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_rupEntry", ["rupEntryId"])
    .index("by_semester", ["semesterId"]),

  /**
   * Intermediate control types (quizzes, tests, etc.)
   * Migrated from: intermediateControlStore.ts
   */
  intermediateControls: defineTable({
    name: v.string(),
    shortName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  /**
   * Final control types (exams, finals)
   * Migrated from: finalControlStore.ts
   */
  finalControls: defineTable({
    name: v.string(),
    shortName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }),

  /**
   * Scheduled intermediate controls for specific RUP entries
   */
  scheduledIntermediateControls: defineTable({
    intermediateControlId: v.string(),
    academicYearId: v.id("academicYears"),
    shortName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rupEntryId: v.optional(v.id("rupEntries")),
    semesterId: v.id("academicYearSemesters"),
    date: v.optional(v.string()), // ISO date (legacy)
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_rupEntryId", ["rupEntryId"])
    .index("by_semester", ["semesterId"]),

  /**
   * Scheduled final controls for specific RUP entries
   */
  scheduledFinalControls: defineTable({
    finalControlId: v.string(),
    academicYearId: v.id("academicYears"),
    shortName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    rupEntryId: v.optional(v.id("rupEntries")),
    semesterId: v.id("academicYearSemesters"),
    date: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_academicYear", ["academicYearId"])
    .index("by_rupEntryId", ["rupEntryId"])
    .index("by_semester", ["semesterId"]),
};
