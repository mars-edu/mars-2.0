import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fix rupEntries whose academicYearId points to a DELETED year but which are
 * still used by live calendarEvents: reassign academicYearId to the valid year
 * those events actually live in (resolved via event.semester → academicYearSemester).
 * Only acts when ALL referencing events agree on a single valid year (else the
 * rupEntry is skipped as ambiguous). Also fixes any orphan distributionEntries
 * to the same year. Non-destructive. { dryRun: true } previews.
 */
export const fixOrphanRupEntryYears = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const years = await ctx.db.query("academicYears").collect();
    const validYear = new Set(years.map((y) => y._id as string));
    const isOrphan = (id: any) => !!id && !validYear.has(id);

    const aySems = await ctx.db.query("academicYearSemesters").collect();
    const semYear = new Map(aySems.map((s) => [s._id as string, (s as any).academicYearId as string]));
    const events = await ctx.db.query("calendarEvents").collect();
    const rupEntries = await ctx.db.query("rupEntries").collect();

    const fixed: Array<{ id: string; from: string; to: string; distFixed: number }> = [];
    const skipped: Array<{ id: string; reason: string }> = [];

    for (const r of rupEntries) {
      if (!isOrphan((r as any).academicYearId)) continue;
      const refEvents = events.filter((e) => (e as any).rupEntryId === (r._id as string));
      if (refEvents.length === 0) { skipped.push({ id: r._id as string, reason: "no referencing events (handled by delete pass)" }); continue; }

      const resolvedYears = new Set<string>();
      for (const e of refEvents) {
        const y = semYear.get((e as any).semester);
        if (y && validYear.has(y)) resolvedYears.add(y);
      }
      if (resolvedYears.size !== 1) {
        skipped.push({ id: r._id as string, reason: `events resolve to ${resolvedYears.size} valid years (ambiguous)` });
        continue;
      }
      const to = [...resolvedYears][0];

      const dist = ((r as any).distributionEntries ?? []) as any[];
      let distFixed = 0;
      const nextDist = dist.map((d) => {
        if (isOrphan(d.academicYearId)) { distFixed++; return { ...d, academicYearId: to }; }
        return d;
      });

      fixed.push({ id: r._id as string, from: (r as any).academicYearId, to, distFixed });
      if (!dryRun) {
        const patch: any = { academicYearId: to };
        if (distFixed > 0) patch.distributionEntries = nextDist;
        await ctx.db.patch(r._id, patch);
      }
    }

    return { dryRun: !!dryRun, fixed, skipped };
  },
});
