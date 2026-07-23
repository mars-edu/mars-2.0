import { migrations } from "./index";

/**
 * One-off: convert each workload item's `totalHours` from legacy string ("18")
 * to number (18), matching the tightened `workloads.items[].totalHours: v.number()`.
 *
 * ⚠️ BETTER FIX FIRST: `totalHours` is DERIVED (Math.round(Σ hoursPerGroup×groupCount),
 *    see src/lib/workloadHours.ts). The right long-term move is to NOT store it —
 *    compute on read — which makes this (and all future) type-migrations unnecessary
 *    (docs/migration-playbook.md, Правило #0). This migration exists only if the team
 *    decides to keep it stored as a number.
 *
 * ─── If migrating on PROD: use Pattern A (union), the Convex-canonical way ───
 *   1. Widen `workloadItemValidator.totalHours` (+ top-level workloads.totalHours)
 *      to `v.union(v.string(), v.number())` in convex/schema/. `npx convex deploy`.
 *   2. `npx convex run migrations/workloads:totalHoursToNumber '{"dryRun":true}'` → preview,
 *      then without dryRun → run.
 *   3. Narrow both back to `v.number()`. `npx convex deploy`.
 *   (Pattern B / scripts/migrate.sh — schemaValidation:false — is DEV-ONLY; Convex
 *    does not sanction it for production data. See docs/migration-playbook.md.)
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
