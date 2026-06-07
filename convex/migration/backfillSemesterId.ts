import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const TABLES = [
  "educationSchedules",
  "scheduledFinalControls",
  "scheduledIntermediateControls",
  "vacations",
] as const;

/**
 * One-off backfill: legacy seed rows in period-scoped tables lack
 * `semesterId`. For each such row, assign the academicYearSemester of
 * its academicYearId (by date overlap when the row has a startDate,
 * else the lowest semesterNumber). Rows whose academicYearId has no
 * semesters at all are deleted (orphans of inactive/empty years).
 *
 * Pass { dryRun: true } first to preview the per-table summary.
 */
export const backfillSemesterId = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const semesters = await ctx.db.query("academicYearSemesters").collect();
    const byYear = new Map<string, typeof semesters>();
    for (const s of semesters) {
      const list = byYear.get(s.academicYearId) ?? [];
      list.push(s);
      byYear.set(s.academicYearId, list);
    }

    const summary: Record<string, { filled: number; deleted: number; ok: number }> = {};

    for (const table of TABLES) {
      const rows = await ctx.db.query(table).collect();
      let filled = 0;
      let deleted = 0;
      let ok = 0;

      for (const row of rows) {
        if ((row as { semesterId?: string }).semesterId) {
          ok++;
          continue;
        }

        const candidates = (byYear.get(row.academicYearId) ?? [])
          .slice()
          .sort((a, b) => a.startDate.localeCompare(b.startDate));

        if (candidates.length === 0) {
          deleted++;
          if (!dryRun) await ctx.db.delete(row._id);
          continue;
        }

        const startDate = (row as { startDate?: string }).startDate;
        const chosen =
          (startDate
            ? candidates.find(
                (s) => startDate >= s.startDate && startDate <= s.endDate
              )
            : undefined) ?? candidates[0];

        filled++;
        if (!dryRun) await ctx.db.patch(row._id, { semesterId: chosen._id });
      }

      summary[table] = { filled, deleted, ok };
    }

    return { dryRun: !!dryRun, summary };
  },
});
