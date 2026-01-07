import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

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
});

/**
 * Create a calendar event
 */
export const create = mutation({
  args: {
    class9Id: v.string(),
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
    class9Id: v.optional(v.string()),
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
      ...updateTimestamp(),
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
