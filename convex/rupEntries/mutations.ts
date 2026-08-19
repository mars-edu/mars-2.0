import { mutation } from "../functions";
import { v, ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Scan all tables that might hold a foreign-key reference pointing at this
 * RUP entry. Returns an object of non-zero reference counts keyed by table
 * name. Used by delete operations to block cascading into live user data.
 */
export async function scanRefs(
  ctx: any,
  rupEntryId: string
): Promise<Record<string, number>> {
  const [
    calendarEvents,
    ktps,
    journals,
    scheduledIntermediateControls,
    scheduledFinalControls,
  ] = await Promise.all([
    ctx.db
      .query("calendarEvents")
      .withIndex("by_rupEntryId", (q: any) => q.eq("rupEntryId", rupEntryId))
      .collect(),
    ctx.db
      .query("ktps")
      .withIndex("by_rupEntryId", (q: any) => q.eq("rupEntryId", rupEntryId))
      .collect(),
    ctx.db
      .query("journals")
      .filter((q: any) => q.eq(q.field("disciplineId"), rupEntryId))
      .collect(),
    ctx.db
      .query("scheduledIntermediateControls")
      .withIndex("by_rupEntryId", (q: any) => q.eq("rupEntryId", rupEntryId))
      .collect(),
    ctx.db
      .query("scheduledFinalControls")
      .withIndex("by_rupEntryId", (q: any) => q.eq("rupEntryId", rupEntryId))
      .collect(),
  ]);

  const refs: Record<string, number> = {};
  if (calendarEvents.length) refs.calendarEvents = calendarEvents.length;
  if (ktps.length) refs.ktps = ktps.length;
  if (journals.length) refs.journals = journals.length;
  if (scheduledIntermediateControls.length)
    refs.scheduledIntermediateControls = scheduledIntermediateControls.length;
  if (scheduledFinalControls.length)
    refs.scheduledFinalControls = scheduledFinalControls.length;

  return refs;
}

function mergeRefs(
  target: Record<string, number>,
  source: Record<string, number>
): Record<string, number> {
  for (const [k, v] of Object.entries(source)) {
    target[k] = (target[k] ?? 0) + v;
  }
  return target;
}

/**
 * Delete a single RUP entry. BLOCKS if other tables reference it.
 */
export const remove = mutation({
  args: { id: v.id("rupEntries") },
  handler: async (ctx, args) => {
    const idStr = args.id as unknown as string;
    const refs = await scanRefs(ctx, idStr);
    if (Object.keys(refs).length > 0) {
      throw new ConvexError({
        code: "RUP_ENTRY_HAS_REFERENCES",
        message: "Запись РУП используется — сначала удалите связанные записи",
        references: refs,
      });
    }

    const distributions = await ctx.db
      .query("distributionEntries")
      .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", args.id))
      .collect();

    for (const dist of distributions) {
      await ctx.db.delete(dist._id);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Delete an entire RUP entry language-variant group. BLOCKS if any variant in
 * the group is referenced.
 */
export const removeGroup = mutation({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const variants = await ctx.db
      .query("rupEntries")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    if (variants.length === 0) return { deletedCount: 0 };

    const totalRefs: Record<string, number> = {};
    for (const variant of variants) {
      const refs = await scanRefs(ctx, variant._id as unknown as string);
      mergeRefs(totalRefs, refs);
    }

    if (Object.keys(totalRefs).length > 0) {
      throw new ConvexError({
        code: "RUP_ENTRY_HAS_REFERENCES",
        message: "Группа записей РУП используется — сначала удалите связанные записи",
        references: totalRefs,
      });
    }

    for (const variant of variants) {
      const distributions = await ctx.db
        .query("distributionEntries")
        .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", variant._id))
        .collect();
      for (const dist of distributions) {
        await ctx.db.delete(dist._id);
      }
      await ctx.db.delete(variant._id);
    }

    return { deletedCount: variants.length };
  },
});

/**
 * Batch-reorder RUP entries by updating positions in one transaction.
 */
export const reorder = mutation({
  args: { orderedIds: v.array(v.id("rupEntries")) },
  handler: async (ctx, { orderedIds }) => {
    await Promise.all(
      orderedIds.map((id, index) => ctx.db.patch(id, { position: index }))
    );
    return { success: true };
  },
});

/**
 * Atomic duplication of a RUP entry and its semester distributions.
 */
export const duplicate = mutation({
  args: { id: v.id("rupEntries") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.id);
    if (!original) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Запись РУП не найдена" });
    }

    const insertionPosition = original.position + 1;

    // Shift positions of items that come after in the same academic year
    const itemsInYear = await ctx.db
      .query("rupEntries")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", original.academicYearId))
      .collect();

    for (const item of itemsInYear) {
      if (item.position >= insertionPosition) {
        await ctx.db.patch(item._id, { position: item.position + 1 });
      }
    }

    const { _id, _creationTime, ...copyFields } = original;

    // Create standalone duplicate (no groupId)
    const newId = await ctx.db.insert("rupEntries", {
      ...copyFields,
      groupId: undefined,
      position: insertionPosition,
    });

    // Duplicate distribution entries
    const dists = await ctx.db
      .query("distributionEntries")
      .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", original._id))
      .collect();

    for (const dist of dists) {
      const { _id: _dId, _creationTime: _dCt, ...dCopy } = dist;
      await ctx.db.insert("distributionEntries", {
        ...dCopy,
        rupEntryId: newId,
      });
    }

    return newId;
  },
});

const HOURS_RE = /^\d+(\.\d+)?$/;
function isValidHours(val: string | undefined): boolean {
  return val === undefined || val === "" || HOURS_RE.test(val);
}

/**
 * Save (create or edit) an entire RUP entry language-variant group in ONE
 * atomic mutation.
 */
export const saveRupEntryGroup = mutation({
  args: {
    id: v.optional(v.id("rupEntries")),
    groupId: v.optional(v.string()),
    specialtyIds: v.array(v.string()),
    academicYearId: v.id("academicYears"),
    baseClass: v.optional(v.array(v.number())),
    position: v.optional(v.number()),
    totalCredits: v.string(),
    totalHours: v.string(),
    groupHours: v.optional(v.string()),
    theoreticalHours: v.string(),
    labPracticalHours: v.string(),
    field3Value: v.string(),
    srspHours: v.string(),
    srsHours: v.string(),
    trainingPracticeHours: v.string(),
    individualHours: v.string(),
    individualAdditionalHours: v.optional(v.string()),
    variants: v.array(
      v.object({
        id: v.optional(v.id("rupEntries")),
        language: v.string(),
        moduleIndex: v.string(),
        moduleName: v.string(),
        learningOutcome: v.string(),
      })
    ),
    removedVariantIds: v.optional(v.array(v.id("rupEntries"))),
    distributionEntries: v.optional(
      v.array(
        v.object({
          academicYearId: v.id("academicYears"),
          semesterId: v.id("academicYearSemesters"),
          hours: v.string(),
          srsHours: v.optional(v.string()),
          srspHours: v.optional(v.string()),
          individualHours: v.optional(v.string()),
          intermediateControlId: v.optional(v.string()),
          finalControlId: v.optional(v.string()),
          examEnabled: v.optional(v.boolean()),
          creditEnabled: v.optional(v.boolean()),
          controlLessonEnabled: v.optional(v.boolean()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const {
      groupId,
      specialtyIds,
      academicYearId,
      baseClass,
      position,
      totalCredits,
      totalHours,
      groupHours,
      theoreticalHours,
      labPracticalHours,
      field3Value,
      srspHours,
      srsHours,
      trainingPracticeHours,
      individualHours,
      individualAdditionalHours,
      variants,
      removedVariantIds,
      distributionEntries,
    } = args;

    const hourFields: Record<string, string | undefined> = {
      totalCredits,
      totalHours,
      theoreticalHours,
      labPracticalHours,
      srspHours,
      srsHours,
      trainingPracticeHours,
      individualHours,
      individualAdditionalHours,
      groupHours,
    };
    for (const [field, val] of Object.entries(hourFields)) {
      if (!isValidHours(val)) {
        throw new ConvexError({
          code: "INVALID_HOURS",
          message: `Поле "${field}" должно быть положительным числом`,
          field,
        });
      }
    }

    if (variants.length === 0) {
      throw new ConvexError({
        code: "NO_VARIANTS",
        message: "Нужен хотя бы один языковой вариант",
      });
    }

    if (specialtyIds.length === 0) {
      throw new ConvexError({
        code: "NO_SPECIALTIES",
        message: "Выберите хотя бы одну специальность",
      });
    }

    for (const v of variants) {
      if (!v.moduleIndex.trim() || !v.moduleName.trim() || !v.learningOutcome.trim()) {
        throw new ConvexError({
          code: "EMPTY_VARIANT_TEXT",
          message: `Языковой вариант "${v.language}": заполните индекс, название и результат обучения`,
          language: v.language,
        });
      }
    }

    const gid = groupId ?? crypto.randomUUID();

    const shared = {
      specialtyIds,
      academicYearId,
      baseClass: baseClass ?? [9],
      groupId: gid,
      totalCredits,
      totalHours,
      groupHours,
      theoreticalHours,
      labPracticalHours,
      field3Value,
      srspHours,
      srsHours,
      trainingPracticeHours,
      individualHours,
      individualAdditionalHours: individualAdditionalHours ?? "",
      position: position ?? 0,
    };

    const toRemove = removedVariantIds ?? [];
    if (toRemove.length > 0) {
      const totalRefs: Record<string, number> = {};
      for (const id of toRemove) {
        mergeRefs(totalRefs, await scanRefs(ctx, id));
      }
      if (Object.keys(totalRefs).length > 0) {
        throw new ConvexError({
          code: "RUP_ENTRY_HAS_REFERENCES",
          message: "Запись РУП используется — сначала удалите ссылки",
          references: totalRefs,
        });
      }

      for (const id of toRemove) {
        const dists = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", id))
          .collect();
        for (const d of dists) await ctx.db.delete(d._id);
        await ctx.db.delete(id);
      }
    }

    // Compile language variants array for target P5 schema (expand phase)
    const compiledVariants = variants.map((v) => ({
      language: v.language,
      moduleIndex: v.moduleIndex,
      moduleName: v.moduleName,
      learningOutcome: v.learningOutcome,
    }));

    // Primary variant drives the top-level projection fields
    const primaryVariant = variants[0];
    const primaryText = {
      language: primaryVariant.language,
      moduleIndex: primaryVariant.moduleIndex,
      moduleName: primaryVariant.moduleName,
      learningOutcome: primaryVariant.learningOutcome,
      variants: compiledVariants,
    };

    const targetId = args.id ?? variants.find((v) => v.id)?.id;
    const allIds: Id<"rupEntries">[] = [];

    if (targetId) {
      // Single-row update
      await ctx.db.patch(targetId, {
        ...shared,
        ...primaryText,
      });
      allIds.push(targetId);
    } else {
      // Single-row insert
      const newId = await ctx.db.insert("rupEntries", {
        ...shared,
        ...primaryText,
      });
      allIds.push(newId);
    }

    if (distributionEntries) {
      for (const variantId of allIds) {
        const existing = await ctx.db
          .query("distributionEntries")
          .withIndex("by_rupEntry", (q) => q.eq("rupEntryId", variantId))
          .collect();
        for (const d of existing) await ctx.db.delete(d._id);

        for (const dist of distributionEntries) {
          await ctx.db.insert("distributionEntries", {
            rupEntryId: variantId,
            academicYearId: dist.academicYearId,
            semesterId: dist.semesterId,
            hours: dist.hours,
            srsHours: dist.srsHours,
            srspHours: dist.srspHours,
            individualHours: dist.individualHours,
            intermediateControlId: dist.intermediateControlId,
            finalControlId: dist.finalControlId,
            examEnabled: dist.examEnabled,
            creditEnabled: dist.creditEnabled,
            controlLessonEnabled: dist.controlLessonEnabled,
          });
        }
      }
    }

    return {
      groupId: gid,
      ids: allIds,
    };
  },
});
