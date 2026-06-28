import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fix the two issues found by referentialAudit3:
 *  1. substitutions.fromTeacherId / toTeacherId that hold a users._id instead of
 *     a teachers._id (dual-identity) → reassign to the matching teachers._id via
 *     teachers.userId. Skipped if it can't be resolved.
 *  2. ktps.eventId that hold an un-migrated D1 UUID (not a valid calendarEvents._id)
 *     → cleared to undefined (the ktp↔event link falls back to events.ktpId; the
 *     UUID never resolved, so this is a zero-behavior-change cleanup).
 * { dryRun: true } previews.
 */
export const fixRemainingRefs = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const teachers = await ctx.db.query("teachers").collect();
    const teacherIds = new Set(teachers.map((t) => t._id as string));
    const teacherByUser = new Map<string, string>();
    for (const t of teachers) if ((t as any).userId) teacherByUser.set((t as any).userId, t._id as string);
    const eventIds = new Set((await ctx.db.query("calendarEvents").collect()).map((e) => e._id as string));

    const out = { subsFromFixed: 0, subsToFixed: 0, ktpEventCleared: 0 };
    const skipped: Array<{ table: string; id: string; field: string; value: string }> = [];

    for (const s of await ctx.db.query("substitutions").collect()) {
      const patch: any = {};
      for (const field of ["fromTeacherId", "toTeacherId"] as const) {
        const val = (s as any)[field] as string | undefined;
        if (!val || teacherIds.has(val)) continue; // already valid
        const mapped = teacherByUser.get(val);
        if (mapped) {
          patch[field] = mapped;
          if (field === "fromTeacherId") out.subsFromFixed++; else out.subsToFixed++;
        } else {
          skipped.push({ table: "substitutions", id: s._id as string, field, value: val });
        }
      }
      if (!dryRun && Object.keys(patch).length) await ctx.db.patch(s._id, patch);
    }

    for (const k of await ctx.db.query("ktps").collect()) {
      const ev = (k as any).eventId as string | undefined;
      if (ev && !eventIds.has(ev)) {
        out.ktpEventCleared++;
        if (!dryRun) await ctx.db.patch(k._id, { eventId: undefined } as any);
      }
    }

    return { dryRun: !!dryRun, fixed: out, skipped };
  },
});
