import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-off cleanup: drop specialty references that point to a specialty `_id`
 * which no longer exists (dangling refs left by deleted specialties — surfaced
 * by auditSpecialtyRefs as `orphan`). Scrubs rupEntries.specialtyIds and
 * workloads.items[].specialtyIds. Run { dryRun: true } first.
 */
export const fixOrphanSpecialtyRefs = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const specialties = await ctx.db.query("specialties").collect();
    const valid = new Set(specialties.map((s) => s._id as string));

    let rupCleaned = 0;
    let rupRefsDropped = 0;
    const rupEntries = await ctx.db.query("rupEntries").collect();
    for (const r of rupEntries) {
      const ids = (r as { specialtyIds?: string[] }).specialtyIds ?? [];
      const next = ids.filter((id) => valid.has(id));
      if (next.length !== ids.length) {
        rupCleaned++;
        rupRefsDropped += ids.length - next.length;
        if (!dryRun) await ctx.db.patch(r._id, { specialtyIds: next });
      }
    }

    let wlCleaned = 0;
    let wlRefsDropped = 0;
    const workloads = await ctx.db.query("workloads").collect();
    for (const w of workloads) {
      let changed = false;
      const items = (w.items ?? []).map((item: any) => {
        const ids = (item.specialtyIds as string[] | undefined) ?? [];
        const next = ids.filter((id) => valid.has(id));
        if (next.length !== ids.length) {
          changed = true;
          wlRefsDropped += ids.length - next.length;
          return { ...item, specialtyIds: next };
        }
        return item;
      });
      if (changed) {
        wlCleaned++;
        if (!dryRun) await ctx.db.patch(w._id, { items });
      }
    }

    return {
      dryRun: !!dryRun,
      rupEntries: { cleaned: rupCleaned, refsDropped: rupRefsDropped },
      workloads: { cleaned: wlCleaned, refsDropped: wlRefsDropped },
    };
  },
});
