import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-off: unset the now-unused `specialties.legacyId` field on every specialty,
 * so the optional schema field can be removed in a follow-up deploy (Convex
 * rejects removing a field while documents still carry it). Run after the
 * specialty refs have been migrated to canonical _ids. { dryRun: true } previews.
 */
export const clearSpecialtyLegacyId = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const specialties = await ctx.db.query("specialties").collect();
    let cleared = 0;
    for (const s of specialties) {
      if ((s as any).legacyId !== undefined) {
        cleared++;
        if (!dryRun) await ctx.db.patch(s._id, { legacyId: undefined } as any);
      }
    }
    return { dryRun: !!dryRun, cleared, total: specialties.length };
  },
});
