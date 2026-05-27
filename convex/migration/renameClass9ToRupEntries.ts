/**
 * Migration: Rename class9Items → rupEntries
 *
 * This migration handles:
 * 1. Copying all documents from the old `class9Items` table to the new `rupEntries` table
 * 2. Rebuilding `distributionEntries` with renamed field (`class9ItemId` → `rupEntryId`)
 * 3. Renaming FK fields on related tables (`class9Id` → `rupEntryId`)
 * 4. Remapping IDs in `journals.disciplineId` and `workloads.items[].subjectId`
 * 5. Deleting old `class9Items` data
 *
 * DEPLOYMENT ORDER:
 *   1. `npx convex deploy` — pushes new schema + migration code
 *   2. `npx convex run migration/renameClass9ToRupEntries:checkStatus` — verify
 *   3. `npx convex run migration/renameClass9ToRupEntries:migrate` — run migration
 *   4. Deploy frontend code
 *
 * The migration is idempotent — running it twice is safe.
 */

import { action, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// ============================================================================
// Status check — run this first to see what needs migrating
// ============================================================================

export const checkStatus = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    const status: any = await ctx.runQuery(
      internal.migration.renameClass9ToRupEntries.getTablesStatus,
      {}
    );
    console.log("[Migration] Status:", JSON.stringify(status, null, 2));
    return status;
  },
});

export const getTablesStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Check old table (may not exist if already migrated)
    let oldClass9Count = 0;
    try {
      const oldItems = await ctx.db.query("class9Items" as any).collect();
      oldClass9Count = oldItems.length;
    } catch {
      oldClass9Count = 0;
    }

    // Check new table
    const newRupEntries = await ctx.db.query("rupEntries").collect();

    // Check distributionEntries for old field name
    const allDistEntries = await ctx.db.query("distributionEntries").collect();
    const distWithOldField = allDistEntries.filter(
      (d: any) => d.class9ItemId !== undefined && d.rupEntryId === undefined
    );
    const distWithNewField = allDistEntries.filter(
      (d: any) => d.rupEntryId !== undefined
    );

    // Check calendarEvents for old field name
    const allCalEvents = await ctx.db.query("calendarEvents").collect();
    const calWithOldField = allCalEvents.filter(
      (d: any) => d.class9Id !== undefined && d.rupEntryId === undefined
    );

    // Check ktps for old field name
    const allKtps = await ctx.db.query("ktps").collect();
    const ktpsWithOldField = allKtps.filter(
      (d: any) => d.class9Id !== undefined && d.rupEntryId === undefined
    );

    // Check scheduled controls
    const allSchedFinal = await ctx.db
      .query("scheduledFinalControls")
      .collect();
    const schedFinalOld = allSchedFinal.filter(
      (d: any) => d.class9Id !== undefined && d.rupEntryId === undefined
    );

    const allSchedInterm = await ctx.db
      .query("scheduledIntermediateControls")
      .collect();
    const schedIntermOld = allSchedInterm.filter(
      (d: any) => d.class9Id !== undefined && d.rupEntryId === undefined
    );

    // Check journals (disciplineId stays same name, but value needs ID mapping)
    const allJournals = await ctx.db.query("journals").collect();

    return {
      oldClass9Items: oldClass9Count,
      newRupEntries: newRupEntries.length,
      distributionEntries: {
        total: allDistEntries.length,
        needsFieldRename: distWithOldField.length,
        alreadyMigrated: distWithNewField.length,
      },
      calendarEvents: {
        total: allCalEvents.length,
        needsFieldRename: calWithOldField.length,
      },
      ktps: {
        total: allKtps.length,
        needsFieldRename: ktpsWithOldField.length,
      },
      scheduledFinalControls: {
        total: allSchedFinal.length,
        needsFieldRename: schedFinalOld.length,
      },
      scheduledIntermediateControls: {
        total: allSchedInterm.length,
        needsFieldRename: schedIntermOld.length,
      },
      journals: {
        total: allJournals.length,
      },
      needsMigration:
        oldClass9Count > 0 ||
        distWithOldField.length > 0 ||
        calWithOldField.length > 0 ||
        ktpsWithOldField.length > 0 ||
        schedFinalOld.length > 0 ||
        schedIntermOld.length > 0,
    };
  },
});

// ============================================================================
// Main migration action
// ============================================================================

export const migrate = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    console.log(
      "[Migration] Starting class9Items → rupEntries rename migration..."
    );

    // Step 1: Copy class9Items → rupEntries and build ID mapping
    const step1: any = await ctx.runMutation(
      internal.migration.renameClass9ToRupEntries.copyClass9ToRupEntries,
      {}
    );
    console.log(
      `[Migration] Step 1: Copied ${step1.copied} class9Items → rupEntries`
    );

    if (step1.copied === 0 && step1.alreadyExist > 0) {
      console.log(
        `[Migration] Step 1: ${step1.alreadyExist} rupEntries already exist, skipping copy. Using identity mapping.`
      );
    }

    const idMapping = step1.idMapping;
    console.log(
      `[Migration] ID mapping has ${Object.keys(idMapping).length} entries`
    );

    // Step 2: Migrate distributionEntries (rename field + remap IDs)
    const step2: any = await ctx.runMutation(
      internal.migration.renameClass9ToRupEntries.migrateDistributionEntries,
      { idMapping }
    );
    console.log(
      `[Migration] Step 2: Migrated ${step2.migrated} distributionEntries`
    );

    // Step 3: Rename FK fields on related tables (batched)
    const step3a: any = await ctx.runMutation(
      internal.migration.renameClass9ToRupEntries.migrateCalendarEvents,
      { idMapping }
    );
    console.log(
      `[Migration] Step 3a: Migrated ${step3a.migrated} calendarEvents`
    );

    const step3b: any = await ctx.runMutation(
      internal.migration.renameClass9ToRupEntries.migrateKtps,
      { idMapping }
    );
    console.log(`[Migration] Step 3b: Migrated ${step3b.migrated} ktps`);

    const step3c: any = await ctx.runMutation(
      internal.migration.renameClass9ToRupEntries.migrateScheduledControls,
      { idMapping }
    );
    console.log(
      `[Migration] Step 3c: Migrated ${step3c.migratedFinal} final + ${step3c.migratedIntermediate} intermediate controls`
    );

    const step3d: any = await ctx.runMutation(
      internal.migration.renameClass9ToRupEntries.migrateJournals,
      { idMapping }
    );
    console.log(`[Migration] Step 3d: Migrated ${step3d.migrated} journals`);

    const step3e: any = await ctx.runMutation(
      internal.migration.renameClass9ToRupEntries.migrateWorkloads,
      { idMapping }
    );
    console.log(`[Migration] Step 3e: Migrated ${step3e.migrated} workloads`);

    // Step 4: Clean up old class9Items table
    const step4: any = await ctx.runMutation(
      internal.migration.renameClass9ToRupEntries.deleteOldClass9Items,
      {}
    );
    console.log(`[Migration] Step 4: Deleted ${step4.deleted} old class9Items`);

    const summary: any = {
      success: true,
      rupEntriesCopied: step1.copied,
      distributionEntriesMigrated: step2.migrated,
      calendarEventsMigrated: step3a.migrated,
      ktpsMigrated: step3b.migrated,
      scheduledFinalControlsMigrated: step3c.migratedFinal,
      scheduledIntermediateControlsMigrated: step3c.migratedIntermediate,
      journalsMigrated: step3d.migrated,
      workloadsMigrated: step3e.migrated,
      oldClass9ItemsDeleted: step4.deleted,
    };

    console.log("[Migration] Complete!", JSON.stringify(summary, null, 2));
    return summary;
  },
});

// ============================================================================
// Step 1: Copy class9Items → rupEntries
// ============================================================================

export const copyClass9ToRupEntries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const idMapping: Record<string, string> = {};

    // Check if rupEntries already has data (migration already partially done)
    const existingRupEntries = await ctx.db.query("rupEntries").collect();
    if (existingRupEntries.length > 0) {
      // If rupEntries already has data, build identity mapping from existing data
      // (the table was already populated, just need to map for FK updates)
      for (const entry of existingRupEntries) {
        idMapping[entry._id] = entry._id;
      }
      return {
        copied: 0,
        alreadyExist: existingRupEntries.length,
        idMapping,
      };
    }

    // Read from old table
    let oldItems: any[] = [];
    try {
      oldItems = await ctx.db.query("class9Items" as any).collect();
    } catch {
      console.log("[Migration] No class9Items table found, nothing to copy");
      return { copied: 0, alreadyExist: 0, idMapping };
    }

    if (oldItems.length === 0) {
      console.log("[Migration] class9Items table is empty");
      return { copied: 0, alreadyExist: 0, idMapping };
    }

    for (const oldItem of oldItems) {
      const oldId = oldItem._id;

      // Extract data fields (exclude _id and _creationTime which are system fields)
      const {
        _id,
        _creationTime,
        ...data
      } = oldItem;

      const newId = await ctx.db.insert("rupEntries", {
        specialtyIds: data.specialtyIds ?? [],
        academicYearId: data.academicYearId ?? "",
        baseClass: data.baseClass,
        language: data.language,
        groupId: data.groupId,
        moduleIndex: data.moduleIndex ?? "",
        moduleName: data.moduleName ?? "",
        learningOutcome: data.learningOutcome ?? "",
        totalCredits: data.totalCredits ?? "0",
        totalHours: data.totalHours ?? "0",
        theoreticalHours: data.theoreticalHours ?? "0",
        labPracticalHours: data.labPracticalHours ?? "0",
        field3Value: data.field3Value ?? "0",
        srspHours: data.srspHours ?? "0",
        srsHours: data.srsHours ?? "0",
        trainingPracticeHours: data.trainingPracticeHours ?? "0",
        individualHours: data.individualHours ?? "0",
        individualAdditionalHours: data.individualAdditionalHours,
        position: data.position ?? 0,
        createdAt: data.createdAt ?? Date.now(),
        updatedAt: data.updatedAt ?? Date.now(),
      });

      idMapping[oldId] = newId;
    }

    return { copied: oldItems.length, alreadyExist: 0, idMapping };
  },
});

// ============================================================================
// Step 2: Migrate distributionEntries (field rename + ID remap)
// ============================================================================

export const migrateDistributionEntries = internalMutation({
  args: {
    idMapping: v.any(),
  },
  handler: async (ctx, { idMapping }) => {
    const allEntries = await ctx.db.query("distributionEntries").collect();
    let migrated = 0;

    for (const entry of allEntries) {
      const raw = entry as any;

      // Check if this entry still has the old field name
      if (raw.class9ItemId !== undefined && raw.rupEntryId === undefined) {
        const oldRefId = raw.class9ItemId;
        const newRefId = (idMapping as Record<string, string>)[oldRefId] ?? oldRefId;

        // Replace the entire document to rename the field
        const { _id, _creationTime, class9ItemId, ...rest } = raw;

        await ctx.db.replace(_id, {
          ...rest,
          rupEntryId: newRefId,
        });
        migrated++;
      } else if (raw.rupEntryId !== undefined) {
        // Already has new field name — check if ID needs remapping
        const oldRefId = raw.rupEntryId;
        const newRefId = (idMapping as Record<string, string>)[oldRefId];
        if (newRefId && newRefId !== oldRefId) {
          await ctx.db.patch(raw._id, { rupEntryId: newRefId } as any);
          migrated++;
        }
      }
    }

    return { migrated };
  },
});

// ============================================================================
// Step 3a: Migrate calendarEvents (class9Id → rupEntryId)
// ============================================================================

export const migrateCalendarEvents = internalMutation({
  args: {
    idMapping: v.any(),
  },
  handler: async (ctx, { idMapping }) => {
    const allEvents = await ctx.db.query("calendarEvents").collect();
    let migrated = 0;

    for (const event of allEvents) {
      const raw = event as any;

      if (raw.class9Id !== undefined && raw.rupEntryId === undefined) {
        const oldRefId = raw.class9Id;
        const newRefId = (idMapping as Record<string, string>)[oldRefId] ?? oldRefId;

        const { _id, _creationTime, class9Id, ...rest } = raw;
        await ctx.db.replace(_id, {
          ...rest,
          rupEntryId: newRefId,
        });
        migrated++;
      } else if (raw.rupEntryId !== undefined) {
        const oldRefId = raw.rupEntryId;
        const newRefId = (idMapping as Record<string, string>)[oldRefId];
        if (newRefId && newRefId !== oldRefId) {
          await ctx.db.patch(raw._id, { rupEntryId: newRefId } as any);
          migrated++;
        }
      }
    }

    return { migrated };
  },
});

// ============================================================================
// Step 3b: Migrate ktps (class9Id → rupEntryId)
// ============================================================================

export const migrateKtps = internalMutation({
  args: {
    idMapping: v.any(),
  },
  handler: async (ctx, { idMapping }) => {
    const allKtps = await ctx.db.query("ktps").collect();
    let migrated = 0;

    for (const ktp of allKtps) {
      const raw = ktp as any;

      if (raw.class9Id !== undefined && raw.rupEntryId === undefined) {
        const oldRefId = raw.class9Id;
        const newRefId = (idMapping as Record<string, string>)[oldRefId] ?? oldRefId;

        const { _id, _creationTime, class9Id, ...rest } = raw;
        await ctx.db.replace(_id, {
          ...rest,
          rupEntryId: newRefId,
        });
        migrated++;
      } else if (raw.rupEntryId !== undefined) {
        const oldRefId = raw.rupEntryId;
        const newRefId = (idMapping as Record<string, string>)[oldRefId];
        if (newRefId && newRefId !== oldRefId) {
          await ctx.db.patch(raw._id, { rupEntryId: newRefId } as any);
          migrated++;
        }
      }
    }

    return { migrated };
  },
});

// ============================================================================
// Step 3c: Migrate scheduled controls (class9Id → rupEntryId)
// ============================================================================

export const migrateScheduledControls = internalMutation({
  args: {
    idMapping: v.any(),
  },
  handler: async (ctx, { idMapping }) => {
    let migratedFinal = 0;
    let migratedIntermediate = 0;

    // Final controls
    const allFinal = await ctx.db.query("scheduledFinalControls").collect();
    for (const control of allFinal) {
      const raw = control as any;
      if (raw.class9Id !== undefined && raw.rupEntryId === undefined) {
        const oldRefId = raw.class9Id;
        const newRefId = (idMapping as Record<string, string>)[oldRefId] ?? oldRefId;

        const { _id, _creationTime, class9Id, ...rest } = raw;
        await ctx.db.replace(_id, {
          ...rest,
          rupEntryId: newRefId,
        });
        migratedFinal++;
      }
    }

    // Intermediate controls
    const allInterm = await ctx.db
      .query("scheduledIntermediateControls")
      .collect();
    for (const control of allInterm) {
      const raw = control as any;
      if (raw.class9Id !== undefined && raw.rupEntryId === undefined) {
        const oldRefId = raw.class9Id;
        const newRefId = (idMapping as Record<string, string>)[oldRefId] ?? oldRefId;

        const { _id, _creationTime, class9Id, ...rest } = raw;
        await ctx.db.replace(_id, {
          ...rest,
          rupEntryId: newRefId,
        });
        migratedIntermediate++;
      }
    }

    return { migratedFinal, migratedIntermediate };
  },
});

// ============================================================================
// Step 3d: Migrate journals (disciplineId value → new rupEntries ID)
// ============================================================================

export const migrateJournals = internalMutation({
  args: {
    idMapping: v.any(),
  },
  handler: async (ctx, { idMapping }) => {
    const allJournals = await ctx.db.query("journals").collect();
    let migrated = 0;

    for (const journal of allJournals) {
      const oldRefId = journal.disciplineId;
      const newRefId = (idMapping as Record<string, string>)[oldRefId];

      if (newRefId && newRefId !== oldRefId) {
        await ctx.db.patch(journal._id, { disciplineId: newRefId });
        migrated++;
      }
    }

    return { migrated };
  },
});

// ============================================================================
// Step 3e: Migrate workloads (items[].subjectId → remap to new rupEntries IDs)
// ============================================================================

export const migrateWorkloads = internalMutation({
  args: {
    idMapping: v.any(),
  },
  handler: async (ctx, { idMapping }) => {
    const allWorkloads = await ctx.db.query("workloads").collect();
    let migrated = 0;
    const mapping = idMapping as Record<string, string>;

    for (const workload of allWorkloads) {
      let changed = false;
      const updatedItems = workload.items.map((item) => {
        const newSubjectId = mapping[item.subjectId];
        if (newSubjectId && newSubjectId !== item.subjectId) {
          changed = true;
          return { ...item, subjectId: newSubjectId };
        }
        return item;
      });

      if (changed) {
        await ctx.db.patch(workload._id, { items: updatedItems });
        migrated++;
      }
    }

    return { migrated };
  },
});

// ============================================================================
// Step 4: Delete old class9Items documents
// ============================================================================

export const deleteOldClass9Items = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0;

    try {
      const oldItems = await ctx.db.query("class9Items" as any).collect();
      for (const item of oldItems) {
        await ctx.db.delete(item._id);
        deleted++;
      }
    } catch {
      console.log(
        "[Migration] No class9Items table found or already cleaned up"
      );
    }

    return { deleted };
  },
});
