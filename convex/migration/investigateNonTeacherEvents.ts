import { internalQuery } from "../_generated/server";

/**
 * Read-only: resolve the remaining flagged items —
 *  (a) calendarEvents whose teacherId is neither a teachers._id nor a user with a
 *      teacher record (the "non-teacher owns an event" edge), with the owning
 *      user's identity + each event's live-ness (journals/marks/participants).
 *  (b) files.storageId → _storage orphans (system table).
 */
export const investigateNonTeacherEvents = internalQuery({
  args: {},
  handler: async (ctx) => {
    const teachers = await ctx.db.query("teachers").collect();
    const teacherIds = new Set(teachers.map((t) => t._id as string));
    const teacherUserIds = new Set(teachers.map((t) => (t as any).userId).filter(Boolean));
    const users = await ctx.db.query("users").collect();
    const userById = new Map(users.map((u) => [u._id as string, u]));

    const journals = await ctx.db.query("journals").collect();
    const events = await ctx.db.query("calendarEvents").collect();

    const bad = events.filter((e) => {
      const tid = (e as any).teacherId;
      return tid && !teacherIds.has(tid) && !teacherUserIds.has(tid);
    });

    const byUser: Record<string, any> = {};
    for (const e of bad) {
      const tid = (e as any).teacherId as string;
      const u = userById.get(tid);
      if (!byUser[tid]) {
        byUser[tid] = {
          owner: u ? { name: `${(u as any).firstName} ${(u as any).lastName}`, roles: (u as any).roles } : "NOT A USER EITHER",
          events: [] as any[],
        };
      }
      const js = journals.filter((j) => j.calendarEventId === e._id);
      let marks = 0;
      for (const j of js) marks += (await ctx.db.query("marks").withIndex("by_journal", (q) => q.eq("journalId", j._id)).collect()).length;
      byUser[tid].events.push({
        eventId: e._id,
        startDate: (e as any).startDate,
        participants: ((e as any).participants ?? []).length,
        journals: js.length,
        markRows: marks,
      });
    }

    // files.storageId -> _storage
    let fileTotal = 0, fileOrphan = 0; const fileSamples: string[] = [];
    try {
      const storageIds = new Set((await ctx.db.system.query("_storage").collect()).map((s: any) => s._id as string));
      for (const f of await ctx.db.query("files").collect()) {
        const sid = (f as any).storageId; if (!sid) continue; fileTotal++;
        if (!storageIds.has(sid)) { fileOrphan++; if (fileSamples.length < 3) fileSamples.push(f._id as string); }
      }
    } catch (e) {
      return { nonTeacherEventOwners: byUser, storage: "system query unavailable: " + String(e) };
    }

    return { nonTeacherEventOwners: byUser, storage: { total: fileTotal, orphan: fileOrphan, samples: fileSamples } };
  },
});
