import { ConvexError } from "convex/values";
import { migrations } from "./index";

/**
 * Backfill `workloads.items[].semesters[]` from the 24 flat per-semester
 * fields (`weeks{N}` / `hours{N}` / `hoursPerGroup{N}` / `groupCount{N}`).
 *
 * Phase 2 of the workload array migration — see
 * MIGRATION-workload-array-plan-v4.md. Phase 1 added the optional field;
 * this fills it. The flat fields are deliberately left untouched: both
 * shapes coexist until Phase 3 switches readers and Phase 5 drops the flat 24.
 *
 * `hoursPerGroup{N}` is NOT carried over — it is `weeks * hours`, and storing
 * the derived copy is what let it drift from its inputs in the first place.
 * That same identity is used here as a consistency check (see below).
 *
 * ─── FAILURE POLICY ───
 * This data feeds teacher workload hours, which feed payroll-adjacent reports.
 * Every ambiguity is a hard abort rather than a silent skip — a skipped row
 * would leave `semesters` unset while the flat fields still hold data, and the
 * next run would skip it again the same way. Aborts:
 *   DANGLING_ACADEMIC_YEAR      — workload points at a non-existent year
 *   DUPLICATE_SEMESTER_NUMBER   — two semesters of one year share a number,
 *                                 so column N is genuinely ambiguous
 *   UNRESOLVED_SEMESTER_COLUMN  — column N holds non-zero data but the year
 *                                 has no semester numbered N
 *   HOURS_DERIVATION_DRIFT      — stored hoursPerGroup{N} disagrees with
 *                                 weeks*hours by more than 0.5 h
 * Columns that are entirely zero and have no matching semester are skipped
 * with a warning: they carry no hours, so dropping them changes nothing.
 *
 * Idempotent: an item whose `semesters` is a NON-EMPTY array is left alone.
 * An empty array is not treated as "done" — it would otherwise poison the row
 * forever (gap A2). The abort policy above makes empty-with-data impossible.
 *
 * ─── PROD RUNBOOK ───
 *   1. npx convex run migrations/workloadSemesters:backfillWorkloadSemesters '{"dryRun":true}'
 *      Read the diff. Any ConvexError means the data needs a human first —
 *      fix it, then re-run the dry run.
 *   2. npx convex run migrations/workloadSemesters:backfillWorkloadSemesters
 *   3. Verify: npx convex data workloads --limit 100
 *      — every item should carry a `semesters` array whose length matches the
 *      number of populated flat columns.
 *   4. Phase 3 (separate PR) switches the readers over.
 *
 * ⚠️ RE-RUN THIS right before the Phase-3 UI half ships. Between the core and
 * the UI landing, the old UI still edits the flat fields and `recalcWorkloadItem`
 * (correctly) keeps them authoritative while leaving `semesters[]` alone — so
 * any workload edited in that window has a stale array. This migration is
 * idempotent only for items whose array is EMPTY, so the re-run needs
 * `{"reset": true}` semantics or a targeted patch; check the drift first with
 * the dry run and decide.
 *
 * Rollback: the array is an unused optional field at this point — the running
 * code ignores it. Worst case, patch `semesters: undefined` back off.
 */

const MAX_LEGACY_SEMESTERS = 6;

/** Tolerant numeric parse: handles the KZ decimal comma; junk becomes 0. */
function num(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const s = String(raw ?? "").trim().replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export const backfillWorkloadSemesters = migrations.define({
  table: "workloads",
  migrateOne: async (ctx, wl) => {
    // The column→semester mapping is per academic year, so resolve the year
    // first. academicYearId is a legacy v.string(), hence normalizeId.
    const yearId = ctx.db.normalizeId("academicYears", wl.academicYearId);
    if (!yearId || !(await ctx.db.get(yearId))) {
      throw new ConvexError({
        code: "DANGLING_ACADEMIC_YEAR",
        workloadId: wl._id,
        academicYearId: wl.academicYearId,
      });
    }

    // Canonical semester ordering lives on semesterDefinitions.number, reached
    // through academicYearSemesters.semesterDefinitionId — NOT by sorting on
    // startDate (that split is audit defect #2). Full scan is fine: prod holds
    // two definitions.
    const defs = await ctx.db.query("semesterDefinitions").collect();
    const numberByDef = new Map(defs.map((d) => [d._id, d.number]));

    const yearSems = await ctx.db
      .query("academicYearSemesters")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", yearId))
      .collect();

    const semIdByNumber = new Map<number, (typeof yearSems)[number]["_id"]>();
    for (const s of yearSems) {
      const n = numberByDef.get(s.semesterDefinitionId);
      if (n === undefined) {
        // Dangling definition: this semester can't be numbered, so it can't
        // claim a column. Warn rather than abort — it may simply be unused.
        console.warn(
          `[workloadSemesters] year ${yearId}: semester ${s._id} has a dangling semesterDefinitionId`
        );
        continue;
      }
      if (semIdByNumber.has(n)) {
        throw new ConvexError({
          code: "DUPLICATE_SEMESTER_NUMBER",
          yearId,
          number: n,
        });
      }
      semIdByNumber.set(n, s._id);
    }

    let changed = false;

    const items = wl.items.map((item: any) => {
      if (Array.isArray(item.semesters) && item.semesters.length > 0) {
        return item; // already migrated
      }

      const semesters: Array<{
        semesterId: (typeof yearSems)[number]["_id"];
        weeks: number;
        hours: number;
        groupCount: number;
      }> = [];

      for (let i = 1; i <= MAX_LEGACY_SEMESTERS; i++) {
        const rawW = item[`weeks${i}`];
        const rawH = item[`hours${i}`];
        const rawG = item[`groupCount${i}`];

        // A gap in the middle must not truncate the tail, so no early break.
        if (rawW === undefined && rawH === undefined && rawG === undefined) {
          continue;
        }

        const w = num(rawW);
        const h = num(rawH);
        const g = num(rawG);

        // Surface values that parsed to 0 from a non-empty, non-zero string —
        // they'd silently erase hours otherwise.
        for (const [label, raw, parsed] of [
          ["weeks", rawW, w],
          ["hours", rawH, h],
          ["groupCount", rawG, g],
        ] as const) {
          const s = String(raw ?? "").trim();
          if (s !== "" && s !== "0" && parsed === 0) {
            console.warn(
              `[workloadSemesters] wl ${wl._id} item ${item.id} ${label}${i}: non-numeric '${raw}' → 0`
            );
          }
        }

        const semesterId = semIdByNumber.get(i);
        if (!semesterId) {
          if (w === 0 && h === 0 && g === 0) {
            console.warn(
              `[workloadSemesters] wl ${wl._id} item ${item.id}: empty column ${i} with no matching semester — skipped`
            );
            continue;
          }
          throw new ConvexError({
            code: "UNRESOLVED_SEMESTER_COLUMN",
            workloadId: wl._id,
            itemId: item.id,
            column: i,
            weeks: w,
            hours: h,
            groupCount: g,
          });
        }

        // Payroll guard: after the migration the wizard derives plannedHours as
        // weeks*hours, so that identity must already hold against the stored
        // copy. A large gap means one of the two is wrong and a human has to
        // say which.
        const stored = num(item[`hoursPerGroup${i}`]);
        const derived = w * h;
        const delta = Math.abs(derived - stored);
        if (delta > 0.5) {
          throw new ConvexError({
            code: "HOURS_DERIVATION_DRIFT",
            workloadId: wl._id,
            itemId: item.id,
            column: i,
            stored,
            derived,
          });
        }
        if (delta > 0.01) {
          console.warn(
            `[workloadSemesters] wl ${wl._id} item ${item.id} col ${i}: hoursPerGroup drift ${stored} → ${derived}`
          );
        }

        semesters.push({ semesterId, weeks: w, hours: h, groupCount: g });
      }

      changed = true;
      // Flat fields stay as-is — Phase 3 still reads them.
      return { ...item, semesters };
    });

    return changed ? { items } : undefined;
  },
});

/**
 * Phase 5b migration: drop all 24 flat semester fields (`weeks1..6`,
 * `hours1..6`, `hoursPerGroup1..6`, `groupCount1..6`) from every item in
 * every workload document.
 */
export const dropFlatSemesterFields = migrations.define({
  table: "workloads",
  migrateOne: async (ctx, wl) => {
    let changed = false;
    const items = wl.items.map((item: any) => {
      let hasFlat = false;
      for (let i = 1; i <= MAX_LEGACY_SEMESTERS; i++) {
        if (
          item[`weeks${i}`] !== undefined ||
          item[`hours${i}`] !== undefined ||
          item[`hoursPerGroup${i}`] !== undefined ||
          item[`groupCount${i}`] !== undefined
        ) {
          hasFlat = true;
          break;
        }
      }
      if (!hasFlat) return item;

      const {
        weeks1, weeks2, weeks3, weeks4, weeks5, weeks6,
        hours1, hours2, hours3, hours4, hours5, hours6,
        hoursPerGroup1, hoursPerGroup2, hoursPerGroup3, hoursPerGroup4, hoursPerGroup5, hoursPerGroup6,
        groupCount1, groupCount2, groupCount3, groupCount4, groupCount5, groupCount6,
        ...cleanItem
      } = item;

      changed = true;
      return cleanItem;
    });

    return changed ? { items } : undefined;
  },
});
