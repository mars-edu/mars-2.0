import { mutation } from "../functions";
import { v, ConvexError } from "convex/values";

/**
 * Create a new academic year semester
 */
export const create = mutation({
  args: {
    academicYearId: v.id("academicYears"),
    semesterDefinitionId: v.id("semesterDefinitions"),
    startDate: v.string(),
    endDate: v.string(),
    weeksCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("academicYearSemesters", {
      academicYearId: args.academicYearId,
      semesterDefinitionId: args.semesterDefinitionId,
      startDate: args.startDate,
      endDate: args.endDate,
      weeksCount: args.weeksCount,
      });
  },
});

/**
 * Update an existing academic year semester
 */
export const update = mutation({
  args: {
    id: v.id("academicYearSemesters"),
    semesterDefinitionId: v.optional(v.id("semesterDefinitions")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    weeksCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    await ctx.db.patch(id, {
      ...updates,
      });

    return id;
  },
});

/**
 * Delete an academic-year semester.
 *
 * Cascades `distributionEntries` (RUP-owned configuration — the semester row
 * IS their reason to exist), but BLOCKS when live user data still points at
 * the semester: journals, calendar events, KTPs, scheduled controls,
 * education schedules, vacations. Silently orphaning those would leave
 * workload hours and grade books referencing a semester that no longer
 * exists, and every downstream lookup would just return nothing.
 *
 * Same policy as `rupEntries.remove` (RUP_ENTRY_HAS_REFERENCES) and
 * `workloads.remove` (WORKLOAD_HAS_JOURNALS).
 */
export const remove = mutation({
  args: {
    id: v.id("academicYearSemesters"),
  },
  handler: async (ctx, args) => {
    const semesterId = args.id;

    const [
      journals,
      ktps,
      scheduledIntermediate,
      scheduledFinal,
      educationSchedules,
      vacations,
      calendarEvents,
    ] = await Promise.all([
      ctx.db
        .query("journals")
        .filter((q) => q.eq(q.field("semesterId"), semesterId))
        .collect(),
      ctx.db
        .query("ktps")
        .filter((q) => q.eq(q.field("semesterId"), semesterId))
        .collect(),
      ctx.db
        .query("scheduledIntermediateControls")
        .withIndex("by_semester", (q) => q.eq("semesterId", semesterId))
        .collect(),
      ctx.db
        .query("scheduledFinalControls")
        .withIndex("by_semester", (q) => q.eq("semesterId", semesterId))
        .collect(),
      ctx.db
        .query("educationSchedules")
        .withIndex("by_semester", (q) => q.eq("semesterId", semesterId))
        .collect(),
      ctx.db
        .query("vacations")
        .withIndex("by_semester", (q) => q.eq("semesterId", semesterId))
        .collect(),
      ctx.db
        .query("calendarEvents")
        .filter((q) => q.eq(q.field("semester"), semesterId))
        .collect(),
    ]);

    const refs: Record<string, number> = {};
    if (journals.length) refs.journals = journals.length;
    if (ktps.length) refs.ktps = ktps.length;
    if (scheduledIntermediate.length)
      refs.scheduledIntermediateControls = scheduledIntermediate.length;
    if (scheduledFinal.length)
      refs.scheduledFinalControls = scheduledFinal.length;
    if (educationSchedules.length)
      refs.educationSchedules = educationSchedules.length;
    if (vacations.length) refs.vacations = vacations.length;
    if (calendarEvents.length) refs.calendarEvents = calendarEvents.length;

    if (Object.keys(refs).length > 0) {
      throw new ConvexError({
        code: "SEMESTER_HAS_REFERENCES",
        message: "Семестр используется — сначала удалите связанные записи",
        references: refs,
      });
    }

    // Safe: cascade only the semester-owned distributionEntries.
    const distributions = await ctx.db
      .query("distributionEntries")
      .withIndex("by_semester", (q) => q.eq("semesterId", semesterId))
      .collect();

    for (const dist of distributions) {
      await ctx.db.delete(dist._id);
    }

    await ctx.db.delete(semesterId);
    return semesterId;
  },
});
