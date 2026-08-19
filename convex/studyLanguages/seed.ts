import { internalMutation } from "../functions";

/**
 * One-shot seed: ensure the default study languages (ru/kk/en) exist.
 *
 * Idempotent — bails out if the `studyLanguages` table is already non-empty,
 * so re-running (e.g. after a partial deploy) is a no-op.
 *
 * Colors match the previously-hardcoded pill classes in RupLanguageTabs.vue
 * (ru = gray-900, kk = yellow-500, en = purple-500).
 *
 * ─── PROD RUNBOOK ───
 *   1. npx convex deploy
 *   2. npx convex run studyLanguages/seed:seedDefaults
 *   3. Verify: npx convex data studyLanguages
 */
export const seedDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("studyLanguages").first();
    if (existing) {
      return { created: false };
    }

    const defaults = [
      { code: "ru", name: "Русский", isDefault: true, order: 1, color: "#111827" },
      { code: "kk", name: "Қазақша", isDefault: false, order: 2, color: "#eab308" },
      { code: "en", name: "English", isDefault: false, order: 3, color: "#a855f7" },
    ];

    const ids = [];
    for (const language of defaults) {
      ids.push(await ctx.db.insert("studyLanguages", language));
    }

    return { created: true, ids };
  },
});
