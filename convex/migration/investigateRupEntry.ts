import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Read-only deep-dive on one rupEntry + the calendarEvents that reference it,
 * to decide how to fix an orphaned academicYearId (reassign vs delete). No writes.
 */
export const investigateRupEntry = internalQuery({
  args: { rupEntryId: v.string() },
  handler: async (ctx, { rupEntryId }) => {
    const years = await ctx.db.query("academicYears").collect();
    const validYear = new Set(years.map((y) => y._id as string));
    const yearById = new Map(years.map((y) => [y._id as string, y]));

    const rup = await ctx.db.get(rupEntryId as any);
    const aySems = await ctx.db.query("academicYearSemesters").collect();
    const semById = new Map(aySems.map((s) => [s._id as string, s]));

    const events = (await ctx.db.query("calendarEvents").collect()).filter(
      (e) => (e as any).rupEntryId === rupEntryId
    );

    const eventInfo = [];
    for (const e of events) {
      const semId = (e as any).semester as string | undefined;
      const sem = semId ? semById.get(semId) : undefined;
      const semYear = sem ? (sem as any).academicYearId : undefined;
      const journals = (await ctx.db.query("journals").collect()).filter(
        (j) => j.calendarEventId === e._id
      );
      let marks = 0;
      for (const j of journals)
        marks += (
          await ctx.db.query("marks").withIndex("by_journal", (q) => q.eq("journalId", j._id)).collect()
        ).length;
      eventInfo.push({
        eventId: e._id,
        startDate: (e as any).startDate,
        endDate: (e as any).endDate,
        teacherId: (e as any).teacherId,
        participants: ((e as any).participants ?? []).length,
        semesterId: semId,
        semesterExists: !!sem,
        semesterYear: semYear,
        semesterYearValid: semYear ? validYear.has(semYear) : false,
        semesterYearName: semYear ? (yearById.get(semYear) as any)?.name : null,
        journals: journals.length,
        marks,
      });
    }

    return {
      rupEntry: rup
        ? {
            id: rup._id,
            moduleIndex: (rup as any).moduleIndex,
            moduleName: (rup as any).moduleName,
            academicYearId: (rup as any).academicYearId,
            academicYearValid: validYear.has((rup as any).academicYearId),
            distributionEntries: ((rup as any).distributionEntries ?? []).map((d: any) => ({
              academicYearId: d.academicYearId,
              academicYearValid: validYear.has(d.academicYearId),
              semesterId: d.semesterId,
            })),
          }
        : null,
      events: eventInfo,
    };
  },
});
