import { migrations } from "./migrations";

/**
 * One-off: convert each workload item's `totalHours` from legacy string ("18")
 * to number (18), matching the tightened `workloads.items[].totalHours: v.number()`.
 *
 * ─── DEPLOY PROCEDURE (Convex validates existing docs against the DEPLOYED
 *     schema; a strict string→number change can't deploy against old string
 *     data, and a mutation can't write a number while the deployed field is
 *     still string — so you need ONE permissive window) ───
 *
 *   1. In `convex/schema.ts` add the global toggle (keep the NEW type in the
 *      table file, i.e. `workloads.totalHours: v.number()`):
 *          export default defineSchema({ ...allTables }, { schemaValidation: false });
 *   2. `npx convex deploy`  → succeeds: validation OFF tolerates the old strings
 *      even though the declared type is already `number`.
 *   3. `npx convex run workloadMigrations:totalHoursToNumber '{"dryRun":true}'`  → preview
 *      `npx convex run workloadMigrations:totalHoursToNumber`                    → run
 *   4. Remove `{ schemaValidation: false }` from schema.ts (back to strict).
 *   5. `npx convex deploy`  → succeeds: all items are numbers now, strict passes.
 *
 * Idempotent: items already numeric are skipped, so re-running is a no-op.
 * Non-numeric legacy strings ('' / 'abc') → 0.
 */
export const totalHoursToNumber = migrations.define({
  table: "workloads",
  migrateOne: (_ctx, wl) => {
    let changed = false;
    const items = wl.items.map((it: any) => {
      if (typeof it.totalHours === "number") return it; // idempotent
      changed = true;
      const n = parseFloat(String(it.totalHours ?? ""));
      return { ...it, totalHours: Number.isFinite(n) ? Math.round(n) : 0 };
    });
    return changed ? { items } : undefined;
  },
});
