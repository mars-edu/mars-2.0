import { internalQuery } from "../_generated/server";

/**
 * Read-only: for records whose academicYearId points to a DELETED academic year
 * (orphans), report whether anything downstream still references them — so we
 * know which are safe to delete vs which are chained to live data. No writes.
 */
export const investigateAcademicYearOrphans = internalQuery({
  args: {},
  handler: async (ctx) => {
    const years = await ctx.db.query("academicYears").collect();
    const validYear = new Set(years.map((y) => y._id as string));
    const isOrphanYear = (id: any) => id && !validYear.has(id);

    const journals = await ctx.db.query("journals").collect();
    const events = await ctx.db.query("calendarEvents").collect();
    const schedInt = await ctx.db.query("scheduledIntermediateControls").collect();
    const schedFin = await ctx.db.query("scheduledFinalControls").collect();

    // helpers: count downstream refs to a given record id
    const countRefs = (id: string) => ({
      journals_disciplineId: journals.filter((j) => j.disciplineId === id).length,
      journals_ktpId: journals.filter((j) => (j as any).ktpId === id).length,
      journals_semesterId: journals.filter((j) => (j as any).semesterId === id).length,
      events_rupEntryId: events.filter((e) => (e as any).rupEntryId === id).length,
      events_semester: events.filter((e) => (e as any).semester === id).length,
      events_ktpId: events.filter((e) => (e as any).ktpId === id).length,
      sched_rupEntryId:
        schedInt.filter((c) => (c as any).rupEntryId === id).length +
        schedFin.filter((c) => (c as any).rupEntryId === id).length,
      sched_semesterId:
        schedInt.filter((c) => (c as any).semesterId === id).length +
        schedFin.filter((c) => (c as any).semesterId === id).length,
    });
    const total = (r: ReturnType<typeof countRefs>) =>
      Object.values(r).reduce((a, b) => a + b, 0);

    const report = async (
      table: "rupEntries" | "ktps" | "academicYearSemesters" | "scheduledIntermediateControls" | "scheduledFinalControls"
    ) => {
      const rows = await ctx.db.query(table).collect();
      const orphans = rows.filter((r) => isOrphanYear((r as any).academicYearId));
      return orphans.map((o) => {
        const refs = countRefs(o._id as string);
        return { id: o._id as string, deletedYear: (o as any).academicYearId, downstreamRefs: total(refs), refs };
      });
    };

    return {
      validYears: years.length,
      rupEntries: await report("rupEntries"),
      ktps: await report("ktps"),
      academicYearSemesters: await report("academicYearSemesters"),
      scheduledIntermediateControls: await report("scheduledIntermediateControls"),
      scheduledFinalControls: await report("scheduledFinalControls"),
    };
  },
});
