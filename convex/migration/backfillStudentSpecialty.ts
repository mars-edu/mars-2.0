import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-off migration: normalize specialty references from the legacy D1 id
 * (`specialties.legacyId`) to the canonical Convex `specialties._id`, so the
 * runtime legacy→canonical normalization (studentStore.buildSpecialtyMap, the
 * legacyId branch of specialtyStore.getSpecialtyById, the legacy student-query
 * filter) can be removed.
 *
 * Rewrites:
 *   - students.specialty                    (single id)
 *   - rupEntries.specialtyIds               (id[])
 *   - workloads.items[].specialtyIds        (id[] per item)
 *
 * Idempotent: values already equal to a canonical `_id` are left as-is; values
 * matching no specialty (neither `_id` nor `legacyId`) are left untouched and
 * counted as `orphan` so they can be inspected. Run with { dryRun: true } first.
 */
export const backfillStudentSpecialty = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const specialties = await ctx.db.query("specialties").collect();
    const byLegacy = new Map<string, string>(); // legacyId -> canonical _id
    const canonical = new Set<string>(); // valid _id set
    for (const s of specialties) {
      canonical.add(s._id);
      if ((s as any).legacyId) byLegacy.set((s as any).legacyId, s._id);
    }

    // Resolve one specialty ref: canonical -> unchanged; legacy -> canonical;
    // unknown -> null (caller counts as orphan and leaves it).
    const resolve = (id: string): string | null => {
      if (!id) return null;
      if (canonical.has(id)) return id; // already canonical
      const mapped = byLegacy.get(id);
      return mapped ?? null;
    };

    // --- students.specialty ---
    const students = await ctx.db.query("students").collect();
    let stMigrated = 0,
      stOk = 0,
      stOrphan = 0;
    for (const st of students) {
      const cur = st.specialty;
      if (cur && canonical.has(cur)) {
        stOk++;
        continue;
      }
      const mapped = cur ? byLegacy.get(cur) : undefined;
      if (mapped) {
        stMigrated++;
        if (!dryRun) await ctx.db.patch(st._id, { specialty: mapped });
      } else {
        stOrphan++;
      }
    }

    // --- rupEntries.specialtyIds ---
    const rupEntries = await ctx.db.query("rupEntries").collect();
    let rupMigrated = 0,
      rupOk = 0,
      rupOrphanRefs = 0;
    for (const rup of rupEntries) {
      const ids = (rup as { specialtyIds?: string[] }).specialtyIds ?? [];
      if (ids.length === 0) {
        rupOk++;
        continue;
      }
      let changed = false;
      const next = ids.map((id) => {
        const r = resolve(id);
        if (r === null) {
          rupOrphanRefs++;
          return id;
        }
        if (r !== id) changed = true;
        return r;
      });
      if (changed) {
        rupMigrated++;
        if (!dryRun) await ctx.db.patch(rup._id, { specialtyIds: next });
      } else {
        rupOk++;
      }
    }

    // --- workloads.items[].specialtyIds ---
    const workloads = await ctx.db.query("workloads").collect();
    let wlMigrated = 0,
      wlOk = 0,
      wlOrphanRefs = 0;
    for (const wl of workloads) {
      let changed = false;
      const items = (wl.items ?? []).map((item: any) => {
        const ids = (item.specialtyIds as string[] | undefined) ?? [];
        if (ids.length === 0) return item;
        const next = ids.map((id) => {
          const r = resolve(id);
          if (r === null) {
            wlOrphanRefs++;
            return id;
          }
          if (r !== id) changed = true;
          return r;
        });
        return { ...item, specialtyIds: next };
      });
      if (changed) {
        wlMigrated++;
        if (!dryRun) await ctx.db.patch(wl._id, { items });
      } else {
        wlOk++;
      }
    }

    return {
      dryRun: !!dryRun,
      specialties: { total: specialties.length, withLegacy: byLegacy.size },
      students: { migrated: stMigrated, ok: stOk, orphan: stOrphan },
      rupEntries: { migrated: rupMigrated, ok: rupOk, orphanRefs: rupOrphanRefs },
      workloads: { migrated: wlMigrated, ok: wlOk, orphanRefs: wlOrphanRefs },
    };
  },
});
