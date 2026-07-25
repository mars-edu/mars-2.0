/**
 * Backend i18n — Paraglide wrapper for Convex mutations.
 *
 * Message files: `messages/backend/{ru,kk,en}.json`
 * Compile:       `npm run build:paraglide:backend`
 */

import type { MutationCtx, QueryCtx, ActionCtx } from "../functions";
import type { Id } from "../_generated/dataModel";
import { setLocale } from "../paraglide/runtime.js";

export type Locale = "ru" | "kk" | "en";

// Re-export all Paraglide message functions as `m`
export * as m from "../paraglide/messages.js";
export { setLocale };

/**
 * Resolve a user's preferred locale from the database.
 * Falls back to "ru" if not set.
 */
export async function getUserLocale(
  ctx: MutationCtx | QueryCtx | ActionCtx,
  userId: Id<"users"> | string | undefined
): Promise<Locale> {
  if (!userId) return "ru";
  try {
    const user = await (ctx as any).db.get(userId as Id<"users">);
    return (user?.locale as Locale) ?? "ru";
  } catch {
    return "ru";
  }
}

/**
 * Wrapper pattern to automatically resolve and set the locale for a Convex handler.
 * NOTE: If your handler sends notifications to MULTIPLE users with DIFFERENT locales
 * (e.g. in a loop), you must call `setLocale(locale)` manually inside the loop,
 * because `withI18n` only sets the locale once for the executing user!
 */
import { customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { mutation, query } from "../functions";
import type { TimestampedDatabaseWriter } from "../functions";

export const withI18nMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    let locale: Locale = "ru";
    const id = (args as any).userId || (args as any).createdBy || (args as any).teacherId;
    if (id) {
      locale = await getUserLocale(ctx, id);
    }
    setLocale(locale);
    // `mutation` (from "../functions") already wraps ctx.db with the timestamped
    // writer at runtime. The generic signature of `customMutation` types its
    // `input` callback's `ctx` against the *base* GenericMutationCtx, so without
    // this explicit re-assertion the wrap is lost at the type level and
    // ctx.db.insert/patch would (incorrectly) require createdAt/updatedAt again.
    return {
      ctx: { db: ctx.db as unknown as TimestampedDatabaseWriter },
      args: {},
    };
  },
});

export const withI18nQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    let locale: Locale = "ru";
    const id = (args as any).userId || (args as any).createdBy || (args as any).teacherId;
    if (id) {
      locale = await getUserLocale(ctx, id);
    }
    setLocale(locale);
    return { ctx, args };
  },
});
