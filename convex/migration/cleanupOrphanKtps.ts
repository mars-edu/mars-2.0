import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Delete ktps whose rupEntryId points to a DELETED rupEntry (dangling), unless a
 * journal/event still references the ktp by ktpId (then skipped). Cascades the
 * ktp's ktpDetails. { dryRun: true } previews.
 */
export const cleanupOrphanKtps = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const rupIds = new Set((await ctx.db.query("rupEntries").collect()).map((r) => r._id as string));
    const journalKtp = new Set((await ctx.db.query("journals").collect()).map((j) => (j as any).ktpId).filter(Boolean));
    const eventKtp = new Set((await ctx.db.query("calendarEvents").collect()).map((e) => (e as any).ktpId).filter(Boolean));

    const out = { ktps: 0, ktpDetails: 0 };
    const skipped: Array<{ id: string; reason: string }> = [];
    for (const k of await ctx.db.query("ktps").collect()) {
      const rid = (k as any).rupEntryId;
      if (!rid || rupIds.has(rid)) continue; // valid rupEntry
      const id = k._id as string;
      if (journalKtp.has(id) || eventKtp.has(id)) { skipped.push({ id, reason: "referenced by journal/event ktpId" }); continue; }
      const details = await ctx.db.query("ktpDetails").withIndex("by_ktpId", (q) => q.eq("ktpId", k._id)).collect();
      for (const d of details) { out.ktpDetails++; if (!dryRun) await ctx.db.delete(d._id); }
      out.ktps++;
      if (!dryRun) await ctx.db.delete(k._id);
    }
    return { dryRun: !!dryRun, deleted: out, skipped };
  },
});
