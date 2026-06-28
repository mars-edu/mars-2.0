import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Normalize calendarEvents.teacherId to the canonical teachers._id. Many events
 * store the teacher's users._id instead (dual-identity debt) — readers handle
 * both defensively, but the data should be consistent. Maps users._id ->
 * teachers._id via teachers.userId. Already-canonical / unresolvable values are
 * left as-is. { dryRun: true } previews.
 */
export const fixCalendarEventTeacherId = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun }) => {
    const teachers = await ctx.db.query("teachers").collect();
    const teacherIds = new Set(teachers.map((t) => t._id as string));
    const teacherByUser = new Map<string, string>();
    for (const t of teachers) if ((t as any).userId) teacherByUser.set((t as any).userId, t._id as string);

    let fixed = 0, alreadyOk = 0;
    const skipped: Array<{ id: string; teacherId: string }> = [];
    for (const e of await ctx.db.query("calendarEvents").collect()) {
      const tid = (e as any).teacherId as string | undefined;
      if (!tid) { continue; }
      if (teacherIds.has(tid)) { alreadyOk++; continue; }
      const mapped = teacherByUser.get(tid);
      if (mapped) {
        fixed++;
        if (!dryRun) await ctx.db.patch(e._id, { teacherId: mapped });
      } else {
        skipped.push({ id: e._id as string, teacherId: tid });
      }
    }
    return { dryRun: !!dryRun, fixed, alreadyOk, skipped };
  },
});
