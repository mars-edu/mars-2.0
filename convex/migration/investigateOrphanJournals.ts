import { internalQuery } from "../_generated/server";

/**
 * Read-only: journals whose calendarEventId points to a DELETED event. Reports
 * each journal's student/mark counts so we can decide delete-vs-keep. No writes.
 */
export const investigateOrphanJournals = internalQuery({
  args: {},
  handler: async (ctx) => {
    const eventIds = new Set((await ctx.db.query("calendarEvents").collect()).map((e) => e._id as string));
    const journals = await ctx.db.query("journals").collect();
    const orphans = journals.filter((j) => j.calendarEventId && !eventIds.has(j.calendarEventId as string));

    const info = [];
    for (const j of orphans) {
      const students = (await ctx.db.query("journalStudents").withIndex("by_journal", (q) => q.eq("journalId", j._id)).collect()).length;
      const marks = await ctx.db.query("marks").withIndex("by_journal", (q) => q.eq("journalId", j._id)).collect();
      const nonEmptyMarks = marks.filter((m) => {
        const vals = (m as any).values ?? [];
        return Array.isArray(vals) && vals.some((v: any) => v !== null && v !== "" && v !== undefined);
      }).length;
      info.push({
        journalId: j._id,
        groupName: (j as any).groupName,
        deadEventId: j.calendarEventId,
        academicYearId: (j as any).academicYearId,
        workloadId: (j as any).workloadId ?? null,
        journalStudents: students,
        markRows: marks.length,
        marksWithValues: nonEmptyMarks,
      });
    }
    return { orphanJournals: info };
  },
});
