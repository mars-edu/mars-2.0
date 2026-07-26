import { internalMutation } from "../functions";

/**
 * One-shot seed: ensure a default education technology exists.
 *
 * Idempotent — bails out if any technology with `isDefault: true` is already
 * present, so re-running (e.g. after a partial deploy) is a no-op.
 *
 * Part of the prod runbook in convex/migrations/educationTechnologyBackfill.ts —
 * run this BEFORE the backfill migrations (they need a default tech to attach
 * legacy academic years to):
 *
 *   npx convex run educationTechnologies/seed:seedDefault
 */
export const seedDefault = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingDefault = await ctx.db
      .query("educationTechnologies")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();

    if (existingDefault) {
      return { created: false, id: existingDefault._id };
    }

    const id = await ctx.db.insert("educationTechnologies", {
      name: "Классическая",
      academicHourMinutes: 45,
      isDefault: true,
    });

    return { created: true, id };
  },
});
