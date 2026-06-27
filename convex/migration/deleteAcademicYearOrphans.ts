import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-off cleanup: delete records whose academicYearId points to a DELETED
 * academic year (orphans) — but ONLY when nothing LIVE still references them.
 * Guards re-check references at delete time, so anything chained to live data
 * is skipped (reported in `skipped`). Order: scheduled controls → ktps(+details)
 * → academicYearSemesters → rupEntries. { dryRun: true } previews.
 */
export const deleteAcademicYearOrphans = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const years = await ctx.db.query("academicYears").collect();
    const validYear = new Set(years.map((y) => y._id as string));
    const isOrphan = (id: any) => !!id && !validYear.has(id);

    const journals = await ctx.db.query("journals").collect();
    const events = await ctx.db.query("calendarEvents").collect();
    const schedInt = await ctx.db.query("scheduledIntermediateControls").collect();
    const schedFin = await ctx.db.query("scheduledFinalControls").collect();
    const rupEntries = await ctx.db.query("rupEntries").collect();
    const aySems = await ctx.db.query("academicYearSemesters").collect();
    const ktps = await ctx.db.query("ktps").collect();

    const out = { schedInt: 0, schedFin: 0, ktps: 0, ktpDetails: 0, aySems: 0, rupEntries: 0 };
    const skipped: Array<{ table: string; id: string; reason: string }> = [];

    // 1. orphan scheduled controls (leaf — nothing references a scheduled control by id)
    const orphanSchedIntIds = new Set<string>();
    for (const c of schedInt) if (isOrphan(c.academicYearId)) {
      orphanSchedIntIds.add(c._id as string);
      out.schedInt++;
      if (!dryRun) await ctx.db.delete(c._id);
    }
    const orphanSchedFinIds = new Set<string>();
    for (const c of schedFin) if (isOrphan(c.academicYearId)) {
      orphanSchedFinIds.add(c._id as string);
      out.schedFin++;
      if (!dryRun) await ctx.db.delete(c._id);
    }
    // controls that REMAIN after this step (for downstream guards)
    const liveSchedSemIds = new Set<string>();
    for (const c of schedInt) if (!orphanSchedIntIds.has(c._id as string) && (c as any).semesterId) liveSchedSemIds.add((c as any).semesterId);
    for (const c of schedFin) if (!orphanSchedFinIds.has(c._id as string) && (c as any).semesterId) liveSchedSemIds.add((c as any).semesterId);
    const liveSchedRupIds = new Set<string>();
    for (const c of schedInt) if (!orphanSchedIntIds.has(c._id as string) && (c as any).rupEntryId) liveSchedRupIds.add((c as any).rupEntryId);
    for (const c of schedFin) if (!orphanSchedFinIds.has(c._id as string) && (c as any).rupEntryId) liveSchedRupIds.add((c as any).rupEntryId);

    // 2. orphan ktps (+ their ktpDetails). Guard: no journal/event references it.
    const journalKtpIds = new Set(journals.map((j) => (j as any).ktpId).filter(Boolean));
    const eventKtpIds = new Set(events.map((e) => (e as any).ktpId).filter(Boolean));
    for (const k of ktps) {
      if (!isOrphan(k.academicYearId)) continue;
      const id = k._id as string;
      if (journalKtpIds.has(id) || eventKtpIds.has(id)) { skipped.push({ table: "ktps", id, reason: "referenced by journal/event ktpId" }); continue; }
      const details = await ctx.db.query("ktpDetails").withIndex("by_ktpId", (q) => q.eq("ktpId", k._id)).collect();
      for (const d of details) { out.ktpDetails++; if (!dryRun) await ctx.db.delete(d._id); }
      out.ktps++;
      if (!dryRun) await ctx.db.delete(k._id);
    }

    // 3. orphan academicYearSemesters. Guard: not referenced by journal.semesterId,
    //    event.semester, or any REMAINING (live) scheduled control.
    const journalSemIds = new Set(journals.map((j) => (j as any).semesterId).filter(Boolean));
    const eventSemIds = new Set(events.map((e) => (e as any).semester).filter(Boolean));
    for (const s of aySems) {
      if (!isOrphan((s as any).academicYearId)) continue;
      const id = s._id as string;
      if (journalSemIds.has(id) || eventSemIds.has(id) || liveSchedSemIds.has(id)) {
        skipped.push({ table: "academicYearSemesters", id, reason: "referenced by live journal/event/control" });
        continue;
      }
      out.aySems++;
      if (!dryRun) await ctx.db.delete(s._id);
    }

    // 4. orphan rupEntries. Guard: not referenced by event.rupEntryId, journal.disciplineId,
    //    or any live scheduled control.
    const eventRupIds = new Set(events.map((e) => (e as any).rupEntryId).filter(Boolean));
    const journalDiscIds = new Set(journals.map((j) => j.disciplineId).filter(Boolean));
    for (const r of rupEntries) {
      if (!isOrphan((r as any).academicYearId)) continue;
      const id = r._id as string;
      if (eventRupIds.has(id) || journalDiscIds.has(id) || liveSchedRupIds.has(id)) {
        skipped.push({ table: "rupEntries", id, reason: "referenced by live event/journal/control" });
        continue;
      }
      out.rupEntries++;
      if (!dryRun) await ctx.db.delete(r._id);
    }

    return { dryRun: !!dryRun, deleted: out, skipped };
  },
});
