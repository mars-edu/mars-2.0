import { ConvexError } from "convex/values";
import { migrations } from "./index";

/**
 * Backfill for the `educationTechnologies` + per-year `startDate`/`endDate`
 * widen (Phase 1 of this feature — see PR that introduced this file).
 *
 * Expand-contract, Pattern A (docs/migration-playbook.md):
 *   Phase 1 (this PR)  — widen schema: `academicYears.technologyId` /
 *                         `startDate` / `endDate` are all `v.optional`.
 *                         Code carries a temporary Sept-1 fallback
 *                         (`resolveYearStart` in teacher-workload-calculator.ts)
 *                         so old data keeps working while the backfill hasn't
 *                         run yet.
 *   Phase 2 (this file, run manually against prod, NOT part of this PR) —
 *                         backfill every existing `academicYears` row.
 *   Phase 3 (separate follow-up PR) — narrow the three fields to required in
 *                         convex/schema/academic.ts, strip the Sept-1 fallback
 *                         from `resolveYearStart`.
 *
 * ─── PROD RUNBOOK ───
 *   1. npx convex deploy
 *      (widens the schema — this PR)
 *   2. npx convex run educationTechnologies/seed:seedDefault
 *      (creates the «Классическая» default technology, idempotent)
 *   3. npx convex run migrations/educationTechnologyBackfill:backfillYearTechnology
 *      (attaches every year without a technologyId to the default tech)
 *   4. npx convex run migrations/educationTechnologyBackfill:backfillYearDates
 *      (fills startDate/endDate from semesters, or Sept-1..Jun-30 fallback)
 *   5. Verify: npx convex data academicYears --limit 100
 *      — every row should now have technologyId + startDate + endDate.
 *   6. Separate PR narrows the schema (`v.optional` → required) and removes
 *      the Sept-1 fallback in code.
 *
 * Both migrations below are idempotent — rows that already have the field(s)
 * set are skipped (`migrateOne` returns `undefined`), so re-running the same
 * command twice is always safe.
 */

/**
 * (b) Backfill `academicYears.technologyId` = the default technology's id,
 * for every year that doesn't already have one set.
 *
 * Requires the default technology to already exist — run
 * `educationTechnologies/seed:seedDefault` first (step 2 of the runbook
 * above). Throws NO_DEFAULT_TECH if that step was skipped.
 */
export const backfillYearTechnology = migrations.define({
  table: "academicYears",
  migrateOne: async (ctx, year) => {
    if (year.technologyId) return; // idempotent — already backfilled

    const defaultTech = await ctx.db
      .query("educationTechnologies")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();

    if (!defaultTech) {
      throw new ConvexError({ code: "NO_DEFAULT_TECH" });
    }

    return { technologyId: defaultTech._id };
  },
});

/**
 * (c) Backfill `academicYears.startDate` / `endDate` from the min/max dates
 * of the year's semesters (`academicYearSemesters`), falling back to the
 * KZ college legacy standard (`${startYear}-09-01` .. `${endYear}-06-30`)
 * when the year has no semesters defined.
 */
export const backfillYearDates = migrations.define({
  table: "academicYears",
  migrateOne: async (ctx, year) => {
    if (year.startDate && year.endDate) return; // idempotent — already backfilled

    const semesters = await ctx.db
      .query("academicYearSemesters")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", year._id))
      .collect();

    let fallbackStartDate: string;
    let fallbackEndDate: string;

    if (semesters.length > 0) {
      fallbackStartDate = semesters.map((s) => s.startDate).sort()[0];
      fallbackEndDate = semesters.map((s) => s.endDate).sort().reverse()[0];
    } else {
      fallbackStartDate = `${year.startYear}-09-01`;
      fallbackEndDate = `${year.endYear}-06-30`;
    }

    return {
      startDate: year.startDate ?? fallbackStartDate,
      endDate: year.endDate ?? fallbackEndDate,
    };
  },
});
