import { mutation } from "../functions";
import { v, ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../functions";

/**
 * Scan for live references to a study language across `rupEntries.language`
 * and `students.language`. Shared by `remove` so the reference-check policy
 * (block delete if referenced) stays in one place — mirrors the `scanRefs`
 * pattern in convex/rupEntries/mutations.ts.
 */
async function scanRefs(
  ctx: MutationCtx,
  code: string
): Promise<Record<string, number>> {
  const [rupEntries, students] = await Promise.all([
    ctx.db
      .query("rupEntries")
      .filter((q) => q.eq(q.field("language"), code))
      .collect(),
    ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("language"), code))
      .collect(),
  ]);

  const refs: Record<string, number> = {};
  if (rupEntries.length) refs.rupEntries = rupEntries.length;
  if (students.length) refs.students = students.length;
  return refs;
}

async function assertUniqueCode(
  ctx: MutationCtx,
  code: string,
  excludeId?: Id<"studyLanguages">
) {
  const existing = await ctx.db
    .query("studyLanguages")
    .withIndex("by_code", (q) => q.eq("code", code))
    .first();

  if (existing && existing._id !== excludeId) {
    throw new ConvexError({ code: "STUDY_LANGUAGE_CODE_TAKEN" });
  }
}

/**
 * Create a study language
 */
export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    shortName: v.optional(v.string()),
    color: v.optional(v.string()),
    isDefault: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertUniqueCode(ctx, args.code);

    // If this language is being set as default, clear isDefault on all others
    if (args.isDefault) {
      const allLanguages = await ctx.db.query("studyLanguages").collect();
      for (const lang of allLanguages) {
        if (lang.isDefault) {
          await ctx.db.patch(lang._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("studyLanguages", { ...args });
  },
});

/**
 * Update a study language
 */
export const update = mutation({
  args: {
    id: v.id("studyLanguages"),
    code: v.optional(v.string()),
    name: v.optional(v.string()),
    shortName: v.optional(v.string()),
    color: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    if (updates.code) {
      await assertUniqueCode(ctx, updates.code, id);
    }

    // If setting as default, clear isDefault on all others
    if (updates.isDefault) {
      const allLanguages = await ctx.db.query("studyLanguages").collect();
      for (const lang of allLanguages) {
        if (lang._id !== id && lang.isDefault) {
          await ctx.db.patch(lang._id, { isDefault: false });
        }
      }
    }

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);

    return await ctx.db.get(id);
  },
});

/**
 * Delete a study language.
 *
 * Blocked when:
 *  - it is the current default (there must always be a fallback language)
 *  - one or more `rupEntries` or `students` rows still store this code
 *    (must be re-pointed to another language first)
 */
export const remove = mutation({
  args: { id: v.id("studyLanguages") },
  handler: async (ctx, args) => {
    const lang = await ctx.db.get(args.id);
    if (!lang) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    if (lang.isDefault) {
      throw new ConvexError({ code: "CANNOT_DELETE_DEFAULT_LANGUAGE" });
    }

    const refs = await scanRefs(ctx, lang.code);
    if (Object.keys(refs).length > 0) {
      throw new ConvexError({
        code: "STUDY_LANGUAGE_IN_USE",
        references: refs,
      });
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
