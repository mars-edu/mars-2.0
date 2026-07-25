import { mutation } from "../functions";
import { v, ConvexError } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";
import { validateIndividualJournals } from "./lib";
import type { Id } from "../_generated/dataModel";

const weeklyScheduleValidator = v.object({
  weekId: v.number(),
  startTime: v.optional(v.string()),
  endTime: v.optional(v.string()),
  startId: v.optional(v.string()),
  endId: v.optional(v.string()),
});

const journalSettingsValidator = v.object({
  calculationType: v.union(v.literal("calculated"), v.literal("manual")),
  calculationMethod: v.union(v.literal("only-assigned"), v.literal("all-days")),
  finalControlForm: v.optional(v.union(v.literal("written"), v.literal("oral"), v.literal("mixed"))),
  finalGradeFormula: v.optional(v.object({
    intermediateWeight: v.number(),
    finalWeight: v.number(),
  })),
});

/**
 * Create a calendar event
 */
export const create = mutation({
  args: {
    rupEntryId: v.string(),
    ktpId: v.optional(v.string()),
    teacherId: v.optional(v.string()),
    startDate: v.string(),
    startTime: v.optional(v.string()),
    endDate: v.string(),
    endTime: v.optional(v.string()),
    participants: v.array(v.string()),
    color: v.optional(v.string()),
    semester: v.string(),
    useCustomPeriod: v.boolean(),
    weeklySchedules: v.optional(v.array(weeklyScheduleValidator)),
    isIndividualJournal: v.optional(v.boolean()),
    mergedJournalIds: v.optional(v.array(v.string())),
    parentIndividualJournalId: v.optional(v.string()),
    sourceGroupEventId: v.optional(v.string()),
    gradingType: v.optional(
      v.union(v.literal("combined"), v.literal("separate"))
    ),
    customTitle: v.optional(v.string()),
    isClosed: v.optional(v.boolean()),
    journalSettings: v.optional(journalSettingsValidator),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("calendarEvents", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a calendar event
 */
export const update = mutation({
  args: {
    id: v.id("calendarEvents"),
    rupEntryId: v.optional(v.string()),
    ktpId: v.optional(v.string()),
    teacherId: v.optional(v.string()),
    startDate: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endDate: v.optional(v.string()),
    endTime: v.optional(v.string()),
    participants: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
    semester: v.optional(v.string()),
    useCustomPeriod: v.optional(v.boolean()),
    weeklySchedules: v.optional(v.array(weeklyScheduleValidator)),
    isIndividualJournal: v.optional(v.boolean()),
    mergedJournalIds: v.optional(v.array(v.string())),
    parentIndividualJournalId: v.optional(v.string()),
    sourceGroupEventId: v.optional(v.string()),
    gradingType: v.optional(
      v.union(v.literal("combined"), v.literal("separate"))
    ),
    customTitle: v.optional(v.string()),
    isClosed: v.optional(v.boolean()),
    journalSettings: v.optional(journalSettingsValidator),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    console.log("[Convex] calendarEvents.update called:", {
      id,
      hasJournalSettings: !!updates.journalSettings,
      journalSettings: updates.journalSettings,
      allUpdates: updates,
    });

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    console.log("[Convex] cleanUpdates after filtering:", {
      hasJournalSettings: !!cleanUpdates.journalSettings,
      journalSettings: cleanUpdates.journalSettings,
    });

    await ctx.db.patch(id, {
      ...cleanUpdates,
      });

    const result = await ctx.db.get(id);

    console.log("[Convex] After patch, result:", {
      hasJournalSettings: !!result?.journalSettings,
      journalSettings: result?.journalSettings,
    });

    return result;
  },
});

/**
 * Delete a calendar event
 */
export const remove = mutation({
  args: { id: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Atomically create a main group event plus its individual sub-journals.
 * Each draft becomes its own calendarEvent flagged isIndividualJournal with
 * sourceGroupEventId pointing back to the main event.
 */
export const createWithIndividualJournals = mutation({
  args: {
    rupEntryId: v.string(),
    ktpId: v.optional(v.string()),
    teacherId: v.optional(v.string()),
    startDate: v.string(),
    startTime: v.optional(v.string()),
    endDate: v.string(),
    endTime: v.optional(v.string()),
    participants: v.array(v.string()),
    color: v.optional(v.string()),
    semester: v.string(),
    useCustomPeriod: v.boolean(),
    weeklySchedules: v.optional(v.array(weeklyScheduleValidator)),
    gradingType: v.union(v.literal("combined"), v.literal("separate")),
    individualJournals: v.array(
      v.object({
        studentIds: v.array(v.string()),
        weeklySchedules: v.array(weeklyScheduleValidator),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { gradingType, individualJournals, ...mainFields } = args;

    const validationError = validateIndividualJournals(
      individualJournals,
      gradingType
    );
    if (validationError) {
      throw new ConvexError(validationError);
    }

    const timestamps = createTimestamps();

    const mainId = await ctx.db.insert("calendarEvents", {
      ...mainFields,
      gradingType,
      ...timestamps,
    });

    const childIds: string[] = [];
    for (let i = 0; i < individualJournals.length; i++) {
      const j = individualJournals[i];
      const childId = await ctx.db.insert("calendarEvents", {
        rupEntryId: mainFields.rupEntryId,
        teacherId: mainFields.teacherId,
        startDate: mainFields.startDate,
        endDate: mainFields.endDate,
        participants: j.studentIds,
        color: mainFields.color,
        semester: mainFields.semester,
        useCustomPeriod: mainFields.useCustomPeriod,
        weeklySchedules: j.weeklySchedules,
        isIndividualJournal: true,
        sourceGroupEventId: mainId,
        customTitle: `Индивидуальный журнал #${i + 1}`,
        ...timestamps,
      });
      childIds.push(childId);
    }

    return { mainId, childIds };
  },
});

/**
 * Replace the individual-journal configuration of a main group event.
 * FULL LOCK: if any mark exists in any existing child journal, throws
 * INDIVIDUAL_JOURNALS_LOCKED — config editing is forbidden once grading
 * has started (concept-v2 semantics).
 */
export const updateIndividualJournalsConfig = mutation({
  args: {
    mainEventId: v.id("calendarEvents"),
    gradingType: v.union(v.literal("combined"), v.literal("separate")),
    individualJournals: v.array(
      v.object({
        eventId: v.optional(v.string()), // existing child event id; absent = create new
        studentIds: v.array(v.string()),
        weeklySchedules: v.array(weeklyScheduleValidator),
      })
    ),
  },
  handler: async (ctx, args) => {
    const validationError = validateIndividualJournals(
      args.individualJournals,
      args.gradingType
    );
    if (validationError) {
      throw new ConvexError(validationError);
    }

    const mainEvent = await ctx.db.get(args.mainEventId);
    if (!mainEvent) {
      throw new ConvexError("Main event not found");
    }

    // Collect existing children
    const children = await ctx.db
      .query("calendarEvents")
      .withIndex("by_sourceGroupEventId", (q) =>
        q.eq("sourceGroupEventId", args.mainEventId)
      )
      .collect();

    // FULL LOCK check: any mark in any child journal forbids editing
    for (const child of children) {
      const journal = await ctx.db
        .query("journals")
        .withIndex("by_calendarEvent", (q) => q.eq("calendarEventId", child._id))
        .unique();
      if (!journal) continue;
      const anyMark = await ctx.db
        .query("marks")
        .withIndex("by_journal", (q) => q.eq("journalId", journal._id))
        .first();
      if (anyMark) {
        throw new ConvexError("INDIVIDUAL_JOURNALS_LOCKED");
      }
    }

    await ctx.db.patch(args.mainEventId, {
      gradingType: args.gradingType,
      });

    const keptEventIds = new Set(
      args.individualJournals.map((j) => j.eventId).filter(Boolean)
    );

    // Delete removed children (and their empty journals)
    for (const child of children) {
      if (keptEventIds.has(child._id)) continue;
      const journal = await ctx.db
        .query("journals")
        .withIndex("by_calendarEvent", (q) => q.eq("calendarEventId", child._id))
        .unique();
      if (journal) {
        const students = await ctx.db
          .query("journalStudents")
          .withIndex("by_journal", (q) => q.eq("journalId", journal._id))
          .collect();
        for (const s of students) await ctx.db.delete(s._id);
        await ctx.db.delete(journal._id);
      }
      await ctx.db.delete(child._id);
    }

    // Upsert kept/new children
    const childIds: string[] = [];
    let counter = 0;
    for (const j of args.individualJournals) {
      counter += 1;
      if (j.eventId) {
        if (!children.some((c) => c._id === j.eventId)) {
          throw new ConvexError("Журнал не принадлежит этому событию");
        }
        await ctx.db.patch(j.eventId as Id<"calendarEvents">, {
          participants: j.studentIds,
          weeklySchedules: j.weeklySchedules,
          });
        childIds.push(j.eventId);
      } else {
        const timestamps = createTimestamps();
        const childId = await ctx.db.insert("calendarEvents", {
          rupEntryId: mainEvent.rupEntryId,
          teacherId: mainEvent.teacherId,
          startDate: mainEvent.startDate,
          endDate: mainEvent.endDate,
          participants: j.studentIds,
          color: mainEvent.color,
          semester: mainEvent.semester,
          useCustomPeriod: mainEvent.useCustomPeriod,
          weeklySchedules: j.weeklySchedules,
          isIndividualJournal: true,
          sourceGroupEventId: args.mainEventId,
          customTitle: `Индивидуальный журнал #${counter}`,
          ...timestamps,
        });
        childIds.push(childId);
      }
    }

    return { mainId: args.mainEventId, childIds };
  },
});
