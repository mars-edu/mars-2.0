import { internalQuery } from "../_generated/server";

/**
 * Read-only audit: classify every academicYearId reference across the DB as
 *   - canonical: equals an academicYears._id
 *   - legacy:    equals an academicYears.legacyId (still un-migrated)
 *   - orphan:    matches neither (and is non-empty)
 * Counts per table + sample offenders. No writes.
 */
export const auditAcademicYearRefs = internalQuery({
  args: {},
  handler: async (ctx) => {
    const years = await ctx.db.query("academicYears").collect();
    const canonical = new Set<string>();
    const legacy = new Set<string>();
    for (const y of years) {
      canonical.add(y._id);
      if ((y as any).legacyId) legacy.add((y as any).legacyId);
    }

    const classify = (id: string) =>
      canonical.has(id) ? "canonical" : legacy.has(id) ? "legacy" : "orphan";

    const tally = () => ({ canonical: 0, legacy: 0, orphan: 0, legacySamples: [] as string[], orphanSamples: [] as string[] });
    const add = (t: ReturnType<typeof tally>, id: string | undefined | null) => {
      if (!id) return;
      const c = classify(id);
      t[c]++;
      if (c === "legacy" && t.legacySamples.length < 3) t.legacySamples.push(id);
      if (c === "orphan" && t.orphanSamples.length < 3) t.orphanSamples.push(id);
    };

    const out: Record<string, ReturnType<typeof tally>> = {};
    const scan = async (
      table:
        | "students" | "rupEntries" | "scheduledIntermediateControls"
        | "scheduledFinalControls" | "ktps" | "journals" | "educationSchedules"
        | "vacations" | "sessions" | "journalClosureReminders" | "workloads"
        | "academicYearSemesters"
    ) => {
      const t = tally();
      const rows = await ctx.db.query(table).collect();
      for (const r of rows) add(t, (r as any).academicYearId);
      out[table] = t;
    };

    await scan("students");
    await scan("rupEntries");
    await scan("scheduledIntermediateControls");
    await scan("scheduledFinalControls");
    await scan("ktps");
    await scan("journals");
    await scan("educationSchedules");
    await scan("vacations");
    await scan("sessions");
    await scan("journalClosureReminders");
    await scan("workloads");
    await scan("academicYearSemesters");

    // nested rupEntries.distributionEntries[].academicYearId
    const distT = tally();
    for (const rup of await ctx.db.query("rupEntries").collect())
      for (const d of (rup as any).distributionEntries ?? [])
        add(distT, d?.academicYearId);
    out["rupEntries.distributionEntries"] = distT;

    return {
      academicYears: { total: years.length, withLegacyId: legacy.size },
      ...out,
    };
  },
});
