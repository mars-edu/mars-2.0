import { defineTable } from "convex/server";
import { v } from "convex/values";

export const calendarTables = {
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
};
