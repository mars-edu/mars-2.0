import { internalQuery } from "../_generated/server";

/**
 * Read-only audit: classify every specialty reference across the DB as
 *   - canonical: equals a specialties._id
 *   - legacy:    equals a specialties.legacyId (still un-migrated)
 *   - orphan:    matches neither
 * Reports counts per field plus sample offending values. No writes.
 */
export const auditSpecialtyRefs = internalQuery({
  args: {},
  handler: async (ctx) => {
    const specialties = await ctx.db.query("specialties").collect();
    const canonical = new Set<string>();
    const legacy = new Set<string>();
    for (const s of specialties) {
      canonical.add(s._id);
      if ((s as any).legacyId) legacy.add((s as any).legacyId);
    }

    const classify = (id: string) =>
      canonical.has(id) ? "canonical" : legacy.has(id) ? "legacy" : "orphan";

    const tally = () => ({
      canonical: 0,
      legacy: 0,
      orphan: 0,
      legacySamples: [] as string[],
      orphanSamples: [] as string[],
    });
    const add = (t: ReturnType<typeof tally>, id: string) => {
      const c = classify(id);
      t[c]++;
      if (c === "legacy" && t.legacySamples.length < 5) t.legacySamples.push(id);
      if (c === "orphan" && t.orphanSamples.length < 5) t.orphanSamples.push(id);
    };

    const students = await ctx.db.query("students").collect();
    const studentsT = tally();
    for (const st of students) if (st.specialty) add(studentsT, st.specialty);

    const rupEntries = await ctx.db.query("rupEntries").collect();
    const rupT = tally();
    for (const r of rupEntries)
      for (const id of (r as any).specialtyIds ?? []) add(rupT, id);

    const workloads = await ctx.db.query("workloads").collect();
    const wlT = tally();
    for (const w of workloads)
      for (const item of w.items ?? [])
        for (const id of (item as any).specialtyIds ?? []) add(wlT, id);

    return {
      specialties: { total: specialties.length, withLegacyId: legacy.size },
      "students.specialty": studentsT,
      "rupEntries.specialtyIds": rupT,
      "workloads.items.specialtyIds": wlT,
    };
  },
});
