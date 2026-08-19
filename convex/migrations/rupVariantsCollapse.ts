import { internalQuery, internalMutation } from "../functions";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { scanRefs } from "../rupEntries/mutations";

const SHARED_FIELDS = [
  "totalCredits",
  "totalHours",
  "groupHours",
  "theoreticalHours",
  "labPracticalHours",
  "field3Value",
  "srspHours",
  "srsHours",
  "trainingPracticeHours",
  "individualHours",
  "individualAdditionalHours",
  "academicYearId",
  "position",
] as const;

/**
 * Pre-flight audit query for P5 RUP variants collapse.
 * Returns information on all multi-row groups, detects any divergence in shared
 * hour fields, specialtyIds, or distribution entries, and lists reference counts.
 */
export const auditGroups = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("rupEntries").collect();
    const groups = new Map<string, typeof all>();
    for (const r of all) {
      const key = r.groupId ?? `__solo__${r._id}`;
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }

    const report = [];
    for (const [gid, rows] of groups) {
      if (rows.length < 2) continue;

      const diverged: Record<string, string[]> = {};
      for (const f of SHARED_FIELDS) {
        const vals = [...new Set(rows.map((r: any) => JSON.stringify(r[f] ?? "")))];
        if (vals.length > 1) diverged[f] = vals;
      }

      const specs = [
        ...new Set(rows.map((r) => JSON.stringify([...r.specialtyIds].sort()))),
      ];
      if (specs.length > 1) diverged.specialtyIds = specs;

      const fingerprints = await Promise.all(
        rows.map(async (r) => {
          const ds = await ctx.db
            .query("distributionEntries")
            .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", r._id))
            .collect();
          return JSON.stringify(
            ds
              .map((d) => [
                d.semesterId,
                d.hours,
                d.srsHours ?? "",
                d.srspHours ?? "",
                d.individualHours ?? "",
                d.intermediateControlId ?? "",
                d.finalControlId ?? "",
                !!d.examEnabled,
                !!d.creditEnabled,
                !!d.controlLessonEnabled,
              ])
              .sort()
          );
        })
      );
      if (new Set(fingerprints).size > 1) {
        diverged.distributionEntries = fingerprints;
      }

      const refs: Record<string, Record<string, number>> = {};
      for (const r of rows) {
        refs[`${r.language || "unknown"}:${r._id}`] = await scanRefs(
          ctx,
          r._id as unknown as string
        );
      }

      report.push({
        groupId: gid,
        name: rows[0].moduleName,
        languages: rows.map((r) => r.language),
        diverged: Object.keys(diverged).length ? diverged : undefined,
        refs,
      });
    }

    return {
      totalRupEntries: all.length,
      multiRowGroupCount: report.length,
      divergedGroupCount: report.filter((g) => g.diverged).length,
      groups: report,
    };
  },
});

/**
 * Helper to pick the survivor row for a group.
 * Rule:
 * 1. Variant with most external references
 * 2. Else variant matching default study language (from studyLanguages setting)
 * 3. Else oldest creation time (_creationTime)
 */
async function pickSurvivor(
  ctx: any,
  rows: Doc<"rupEntries">[]
): Promise<Doc<"rupEntries">> {
  if (rows.length === 1) return rows[0];

  const defaultLangDoc = await ctx.db
    .query("studyLanguages")
    .withIndex("by_isDefault", (q: any) => q.eq("isDefault", true))
    .first();
  const defaultCode = defaultLangDoc?.code ?? "ru";

  const rowsWithRefs = await Promise.all(
    rows.map(async (r) => {
      const refs = await scanRefs(ctx, r._id as unknown as string);
      const totalRefs = Object.values(refs).reduce((sum, n) => sum + n, 0);
      return { row: r, totalRefs };
    })
  );

  // Sort by:
  // 1. Total references descending
  // 2. Matches default study language descending
  // 3. Oldest creation time ascending
  rowsWithRefs.sort((a, b) => {
    if (b.totalRefs !== a.totalRefs) return b.totalRefs - a.totalRefs;
    const aIsDefault = a.row.language === defaultCode ? 1 : 0;
    const bIsDefault = b.row.language === defaultCode ? 1 : 0;
    if (bIsDefault !== aIsDefault) return bIsDefault - aIsDefault;
    return a.row._creationTime - b.row._creationTime;
  });

  return rowsWithRefs[0].row;
}

/**
 * Atomic Collapse of RUP variants into a single entry with variants[].
 */
export const collapseAll = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    force: v.optional(v.literal("newest")),
  },
  handler: async (ctx, { dryRun, force }) => {
    const isDryRun = dryRun ?? false;
    const all = await ctx.db.query("rupEntries").collect();
    const groups = new Map<string, typeof all>();

    for (const r of all) {
      const key = r.groupId ?? `__solo__${r._id}`;
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }

    const defaultLangDoc = await ctx.db
      .query("studyLanguages")
      .withIndex("by_isDefault", (q: any) => q.eq("isDefault", true))
      .first();
    const defaultCode = defaultLangDoc?.code ?? "ru";

    const remap = new Map<string, string>(); // deadId -> survivorId
    const groupLogs = [];

    for (const [gid, rows] of groups) {
      if (rows.length === 1) {
        const single = rows[0];
        if (!single.variants || single.variants.length === 0) {
          const variants = [
            {
              language: single.language || defaultCode,
              moduleIndex: single.moduleIndex,
              moduleName: single.moduleName,
              learningOutcome: single.learningOutcome,
            },
          ];
          if (!isDryRun) {
            await ctx.db.patch(single._id, { variants });
          }
        }
        continue;
      }

      // Check divergence across shared hour fields
      const diverged: Record<string, string[]> = {};
      for (const f of SHARED_FIELDS) {
        const vals = [...new Set(rows.map((r: any) => JSON.stringify(r[f] ?? "")))];
        if (vals.length > 1) diverged[f] = vals;
      }
      if (Object.keys(diverged).length > 0 && force !== "newest") {
        throw new ConvexError({
          code: "DIVERGED_GROUP",
          message: `Группа ${gid} имеет расхождения в полях часов. Используйте force: "newest" или сохраните группу в UI.`,
          groupId: gid,
          diverged,
        });
      }

      // Pick winner for shared fields (newest updatedAt or first row)
      const sortedByUpdate = [...rows].sort((a, b) =>
        String(b.updatedAt).localeCompare(String(a.updatedAt))
      );
      const winner = sortedByUpdate[0];

      // Pick survivor row (will keep its ID)
      const survivor = await pickSurvivor(ctx, rows);

      // Compile variants array from all rows in group
      const variants = rows.map((r) => ({
        language: r.language || defaultCode,
        moduleIndex: r.moduleIndex,
        moduleName: r.moduleName,
        learningOutcome: r.learningOutcome,
      }));

      // Patch survivor with variants + winner's shared fields
      if (!isDryRun) {
        await ctx.db.patch(survivor._id, {
          variants,
          specialtyIds: winner.specialtyIds,
          totalCredits: winner.totalCredits,
          totalHours: winner.totalHours,
          groupHours: winner.groupHours,
          theoreticalHours: winner.theoreticalHours,
          labPracticalHours: winner.labPracticalHours,
          field3Value: winner.field3Value,
          srspHours: winner.srspHours,
          srsHours: winner.srsHours,
          trainingPracticeHours: winner.trainingPracticeHours,
          individualHours: winner.individualHours,
          individualAdditionalHours: winner.individualAdditionalHours,
          position: winner.position,
        });
      }

      // If winner !== survivor, replace survivor's distribution entries with winner's set
      if (winner._id !== survivor._id && !isDryRun) {
        const survivorDists = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", survivor._id))
          .collect();
        for (const d of survivorDists) await ctx.db.delete(d._id);

        const winnerDists = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", winner._id))
          .collect();
        for (const d of winnerDists) {
          await ctx.db.insert("distributionEntries", {
            rupEntryId: survivor._id,
            academicYearId: d.academicYearId,
            semesterId: d.semesterId,
            hours: d.hours,
            srsHours: d.srsHours,
            srspHours: d.srspHours,
            individualHours: d.individualHours,
            intermediateControlId: d.intermediateControlId,
            finalControlId: d.finalControlId,
            examEnabled: d.examEnabled,
            creditEnabled: d.creditEnabled,
            controlLessonEnabled: d.controlLessonEnabled,
          });
        }
      }

      // Record remap and delete non-survivors
      for (const r of rows) {
        if (r._id !== survivor._id) {
          remap.set(r._id as unknown as string, survivor._id as unknown as string);
          if (!isDryRun) {
            const dists = await ctx.db
              .query("distributionEntries")
              .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", r._id))
              .collect();
            for (const d of dists) await ctx.db.delete(d._id);
            await ctx.db.delete(r._id);
          }
        }
      }

      groupLogs.push({
        groupId: gid,
        survivorId: survivor._id,
        droppedIds: rows
          .filter((r) => r._id !== survivor._id)
          .map((r) => r._id),
        languages: rows.map((r) => r.language),
      });
    }

    // Repoint foreign keys in calendarEvents, ktps, scheduled controls, journals, workloads
    const repointedCounts = {
      calendarEvents: 0,
      ktps: 0,
      scheduledIntermediateControls: 0,
      scheduledFinalControls: 0,
      journals: 0,
      workloads: 0,
    };

    for (const [deadId, aliveId] of remap) {
      // calendarEvents
      const events = await ctx.db
        .query("calendarEvents")
        .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", deadId))
        .collect();
      for (const e of events) {
        repointedCounts.calendarEvents++;
        if (!isDryRun) {
          await ctx.db.patch(e._id, { rupEntryId: aliveId });
        }
      }

      // ktps
      const ktpList = await ctx.db
        .query("ktps")
        .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", deadId))
        .collect();
      for (const k of ktpList) {
        repointedCounts.ktps++;
        if (!isDryRun) {
          await ctx.db.patch(k._id, { rupEntryId: aliveId });
        }
      }

      // scheduledIntermediateControls
      const sicList = await ctx.db
        .query("scheduledIntermediateControls")
        .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", deadId))
        .collect();
      for (const c of sicList) {
        repointedCounts.scheduledIntermediateControls++;
        if (!isDryRun) {
          await ctx.db.patch(c._id, { rupEntryId: aliveId });
        }
      }

      // scheduledFinalControls
      const sfcList = await ctx.db
        .query("scheduledFinalControls")
        .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", deadId))
        .collect();
      for (const c of sfcList) {
        repointedCounts.scheduledFinalControls++;
        if (!isDryRun) {
          await ctx.db.patch(c._id, { rupEntryId: aliveId });
        }
      }
    }

    // journals (scanned by disciplineId)
    const allJournals = await ctx.db.query("journals").collect();
    for (const j of allJournals) {
      const alive = remap.get(j.disciplineId);
      if (alive) {
        repointedCounts.journals++;
        if (!isDryRun) {
          await ctx.db.patch(j._id, { disciplineId: alive });
        }
      }
    }

    // workloads (scanned by items[].subjectId)
    const allWorkloads = await ctx.db.query("workloads").collect();
    for (const w of allWorkloads) {
      let wlChanged = false;
      const items = w.items.map((it) => {
        if (remap.has(it.subjectId)) {
          wlChanged = true;
          return { ...it, subjectId: remap.get(it.subjectId)! };
        }
        return it;
      });
      if (wlChanged) {
        repointedCounts.workloads++;
        if (!isDryRun) {
          await ctx.db.patch(w._id, { items });
        }
      }
    }

    return {
      dryRun: isDryRun,
      groupsCollapsed: groupLogs.length,
      deletedEntriesCount: remap.size,
      repointedCounts,
      collapsedGroups: groupLogs,
    };
  },
});
