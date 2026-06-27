import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-off: unset `academicYears.legacyId` on every academic year, so the optional
 * field + its by_legacyId index can be removed in a follow-up deploy. All
 * academicYearId refs are already canonical (auditAcademicYearRefs: 0 legacy),
 * so the runtime ayLegacyMap bridge was already dead — this just drops the
 * vestigial field. { dryRun: true } previews.
 */
export const clearAcademicYearLegacyId = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const years = await ctx.db.query("academicYears").collect();
    let cleared = 0;
    for (const y of years) {
      if ((y as any).legacyId !== undefined) {
        cleared++;
        if (!dryRun) await ctx.db.patch(y._id, { legacyId: undefined } as any);
      }
    }
    return { dryRun: !!dryRun, cleared, total: years.length };
  },
});
