import { mutation, query, internalMutation, internalQuery } from "../functions";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { scanRefs } from "../rupEntries/mutations";

/**
 * Audit all RUP entries and their language-variant groups.
 * Reports groups, multi-language variants, hour-field divergence, and reference counts.
 */
export const auditGroups = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("rupEntries").collect();
    const groups = new Map<string, Doc<"rupEntries">[]>();

    for (const r of all) {
      const key = r.groupId ?? `__solo__${r._id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

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
    ] as const;

    const report: Array<{
      groupId: string;
      moduleName: string;
      variantCount: number;
      languages: string[];
      diverged?: Record<string, string[]>;
      references: Record<string, Record<string, number>>;
    }> = [];

    for (const [gid, rows] of groups) {
      if (rows.length < 2) continue;

      const diverged: Record<string, string[]> = {};
      for (const f of SHARED_FIELDS) {
        const vals = [
          ...new Set(rows.map((r) => JSON.stringify((r as any)[f] ?? ""))),
        ];
        if (vals.length > 1) {
          diverged[f] = vals;
        }
      }

      const specs = [
        ...new Set(
          rows.map((r) => JSON.stringify([...(r.specialtyIds || [])].sort()))
        ),
      ];
      if (specs.length > 1) {
        diverged.specialtyIds = specs;
      }

      const refs: Record<string, Record<string, number>> = {};
      for (const r of rows) {
        refs[`${r.language || "unknown"}:${r._id}`] = await scanRefs(ctx, r._id);
      }

      report.push({
        groupId: gid,
        moduleName: rows[0].moduleName,
        variantCount: rows.length,
        languages: rows.map((r) => r.language || ""),
        diverged: Object.keys(diverged).length ? diverged : undefined,
        references: refs,
      });
    }

    return {
      totalRupEntries: all.length,
      multiVariantGroups: report.length,
      divergedGroups: report.filter((g) => g.diverged).length,
      groups: report,
    };
  },
});

/**
 * Atomic collapse of N-variant RUP groups into a single entry with embedded `variants[]`.
 * Repoints references across calendarEvents, ktps, journals, scheduled controls, and workloads.
 */
export const collapseAll = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    force: v.optional(v.literal("newest")),
  },
  handler: async (ctx, { dryRun = false, force }) => {
    // 1. Get default study language from settings
    const defaultStudyLang = await ctx.db
      .query("studyLanguages")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();
    const defaultLangCode = defaultStudyLang?.code ?? "ru";

    const all = await ctx.db.query("rupEntries").collect();
    const groups = new Map<string, Doc<"rupEntries">[]>();

    for (const r of all) {
      const key = r.groupId ?? `__solo__${r._id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    const remap = new Map<string, string>(); // deadId -> survivorId
    const log: Array<{
      groupId: string;
      survivorId: string;
      survivorLanguage: string;
      droppedVariantIds: string[];
      variantCount: number;
    }> = [];

    // Helper to count total external references for a RUP entry
    async function getRefCount(id: string): Promise<number> {
      const refs = await scanRefs(ctx, id);
      return Object.values(refs).reduce((sum, n) => sum + n, 0);
    }

    for (const [gid, rows] of groups) {
      if (rows.length === 1) {
        const solo = rows[0];
        // Ensure solo entries have variants[] array initialized
        if (!solo.variants || solo.variants.length === 0) {
          const variants = [
            {
              language: solo.language || defaultLangCode,
              moduleIndex: solo.moduleIndex,
              moduleName: solo.moduleName,
              learningOutcome: solo.learningOutcome,
            },
          ];
          if (!dryRun) {
            await ctx.db.patch(solo._id, { variants });
          }
        }
        continue;
      }

      // Check for hour divergence
      const hoursSet = new Set(rows.map((r) => `${r.totalHours}|${r.totalCredits}`));
      if (hoursSet.size > 1 && force !== "newest") {
        throw new ConvexError({
          code: "DIVERGED_GROUP",
          message: `Группа ${gid} имеет разные часы между вариантами. Пересохраните группу через интерфейс или используйте force="newest"`,
          groupId: gid,
        });
      }

      // Pick winner (source of shared fields)
      let winner = rows[0];
      if (force === "newest") {
        winner = [...rows].sort((a, b) =>
          (b.updatedAt || "").localeCompare(a.updatedAt || "")
        )[0];
      }

      // Pick survivor based on reference count, default language, creation time
      const rowsWithRefs = await Promise.all(
        rows.map(async (r) => ({
          row: r,
          refCount: await getRefCount(r._id),
        }))
      );

      // Sort: highest refCount desc -> default language first -> oldest creationTime asc
      rowsWithRefs.sort((a, b) => {
        if (b.refCount !== a.refCount) return b.refCount - a.refCount;
        const aIsDef = a.row.language === defaultLangCode ? 1 : 0;
        const bIsDef = b.row.language === defaultLangCode ? 1 : 0;
        if (bIsDef !== aIsDef) return bIsDef - aIsDef;
        return a.row._creationTime - b.row._creationTime;
      });

      const survivor = rowsWithRefs[0].row;

      // Compile variants array from all rows in the group
      const compiledVariants = rows.map((r) => ({
        language: r.language || defaultLangCode,
        moduleIndex: r.moduleIndex,
        moduleName: r.moduleName,
        learningOutcome: r.learningOutcome,
      }));

      // Patch survivor with compiled variants and winner's shared fields
      if (!dryRun) {
        await ctx.db.patch(survivor._id, {
          variants: compiledVariants,
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
          specialtyIds: winner.specialtyIds,
          baseClass: winner.baseClass,
        });
      }

      // Record dead IDs for repointing and deletion
      const droppedIds: string[] = [];
      for (const r of rows) {
        if (r._id !== survivor._id) {
          remap.set(r._id, survivor._id);
          droppedIds.push(r._id);

          if (!dryRun) {
            // Delete non-survivor distribution entries
            const nonSurvivorDists = await ctx.db
              .query("distributionEntries")
              .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", r._id))
              .collect();
            for (const d of nonSurvivorDists) {
              await ctx.db.delete(d._id);
            }
            // Delete non-survivor rupEntry
            await ctx.db.delete(r._id);
          }
        }
      }

      log.push({
        groupId: gid,
        survivorId: survivor._id,
        survivorLanguage: survivor.language || defaultLangCode,
        droppedVariantIds: droppedIds,
        variantCount: rows.length,
      });
    }

    // 2. Repoint foreign keys in referencing tables
    const repointStats = {
      calendarEvents: 0,
      ktps: 0,
      scheduledIntermediateControls: 0,
      scheduledFinalControls: 0,
      journals: 0,
      workloadItems: 0,
    };

    if (remap.size > 0) {
      for (const [deadId, aliveId] of remap) {
        // calendarEvents
        const events = await ctx.db
          .query("calendarEvents")
          .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", deadId))
          .collect();
        for (const e of events) {
          if (!dryRun) await ctx.db.patch(e._id, { rupEntryId: aliveId });
          repointStats.calendarEvents++;
        }

        // ktps
        const ktps = await ctx.db
          .query("ktps")
          .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", deadId))
          .collect();
        for (const k of ktps) {
          if (!dryRun) await ctx.db.patch(k._id, { rupEntryId: aliveId });
          repointStats.ktps++;
        }

        // scheduledIntermediateControls
        const sics = await ctx.db
          .query("scheduledIntermediateControls")
          .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", deadId))
          .collect();
        for (const s of sics) {
          if (!dryRun) await ctx.db.patch(s._id, { rupEntryId: aliveId });
          repointStats.scheduledIntermediateControls++;
        }

        // scheduledFinalControls
        const sfcs = await ctx.db
          .query("scheduledFinalControls")
          .withIndex("by_rupEntryId", (q) => q.eq("rupEntryId", deadId))
          .collect();
        for (const s of sfcs) {
          if (!dryRun) await ctx.db.patch(s._id, { rupEntryId: aliveId });
          repointStats.scheduledFinalControls++;
        }
      }

      // journals (scan)
      const journals = await ctx.db.query("journals").collect();
      for (const j of journals) {
        const aliveId = remap.get(j.disciplineId);
        if (aliveId) {
          if (!dryRun) await ctx.db.patch(j._id, { disciplineId: aliveId });
          repointStats.journals++;
        }
      }

      // workloads (scan items)
      const workloads = await ctx.db.query("workloads").collect();
      for (const w of workloads) {
        let changed = false;
        const updatedItems = w.items.map((item) => {
          const aliveId = remap.get(item.subjectId);
          if (aliveId) {
            changed = true;
            repointStats.workloadItems++;
            return { ...item, subjectId: aliveId };
          }
          return item;
        });

        if (changed && !dryRun) {
          await ctx.db.patch(w._id, { items: updatedItems });
        }
      }
    }

    return {
      dryRun,
      collapsedGroupsCount: log.length,
      deletedEntriesCount: remap.size,
      repointStats,
      log,
    };
  },
});
