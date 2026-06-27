import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-off: clean up orphaned records found by referentialAudit.
 *  - journals whose calendarEventId points to a DELETED event (unusable — no
 *    event = no dates/schedule, and they're already filtered out of the UI):
 *    delete journal + journalStudents + marks + markHistory. GUARDED — a journal
 *    that actually has entered grades (any non-empty mark value) is SKIPPED, so
 *    no grade data is ever lost.
 *  - ktpDetails whose parent ktp was deleted: delete (dead leaf rows).
 * { dryRun: true } previews.
 */
export const cleanupReferentialOrphans = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const eventIds = new Set((await ctx.db.query("calendarEvents").collect()).map((e) => e._id as string));
    const ktpIds = new Set((await ctx.db.query("ktps").collect()).map((k) => k._id as string));

    const out = { journals: 0, journalStudents: 0, marks: 0, markHistory: 0, ktpDetails: 0 };
    const skipped: Array<{ table: string; id: string; reason: string }> = [];

    // 1. orphan journals (cascade)
    const journals = await ctx.db.query("journals").collect();
    for (const j of journals) {
      if (!j.calendarEventId || eventIds.has(j.calendarEventId as string)) continue;
      const marks = await ctx.db.query("marks").withIndex("by_journal", (q) => q.eq("journalId", j._id)).collect();
      const hasGrades = marks.some((m) => {
        const vals = (m as any).values ?? [];
        return Array.isArray(vals) && vals.some((x: any) => x !== null && x !== "" && x !== undefined);
      });
      if (hasGrades) { skipped.push({ table: "journals", id: j._id as string, reason: "has entered grades — preserve" }); continue; }

      const links = await ctx.db.query("journalStudents").withIndex("by_journal", (q) => q.eq("journalId", j._id)).collect();
      for (const l of links) { out.journalStudents++; if (!dryRun) await ctx.db.delete(l._id); }
      for (const m of marks) { out.marks++; if (!dryRun) await ctx.db.delete(m._id); }
      const hist = await ctx.db.query("markHistory").withIndex("by_journal", (q) => q.eq("journalId", j._id)).collect();
      for (const h of hist) { out.markHistory++; if (!dryRun) await ctx.db.delete(h._id); }
      out.journals++;
      if (!dryRun) await ctx.db.delete(j._id);
    }

    // 2. orphan ktpDetails
    const kd = await ctx.db.query("ktpDetails").collect();
    for (const d of kd) {
      if (ktpIds.has(d.ktpId as string)) continue;
      out.ktpDetails++;
      if (!dryRun) await ctx.db.delete(d._id);
    }

    return { dryRun: !!dryRun, deleted: out, skipped };
  },
});
