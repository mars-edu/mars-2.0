import { internalQuery } from "../_generated/server";

/**
 * Read-only: THIRD/final referential pass — every remaining FK not covered by
 * referentialAudit / referentialAudit2, including structural self-refs and the
 * user/permission audit-metadata refs. No writes.
 */
export const referentialAudit3 = internalQuery({
  args: {},
  handler: async (ctx) => {
    const idset = async (t: any) => new Set((await ctx.db.query(t).collect()).map((d: any) => d._id as string));
    const rups = await idset("rupEntries");
    const events = await idset("calendarEvents");
    const journals = await idset("journals");
    const teachers = await idset("teachers");
    const users = await idset("users");
    const permissions = await idset("permissions");
    const intC = await idset("intermediateControls");
    const finC = await idset("finalControls");
    const subs = await idset("substitutions");
    const si = await ctx.db.query("scheduledIntermediateControls").collect();
    const sf = await ctx.db.query("scheduledFinalControls").collect();
    const schedIds = new Set([...si, ...sf].map((c) => c._id as string));
    const eventsOrJournals = new Set([...events, ...journals]);
    const catalogs = new Set([...intC, ...finC]);

    const r: Record<string, { total: number; orphan: number; samples: string[] }> = {};
    const chk = (key: string, vals: any[], parent: Set<string>) => {
      let total = 0, orphan = 0; const s: string[] = [];
      for (const v of vals) { if (v == null || v === "") continue; total++; if (!parent.has(v)) { orphan++; if (s.length < 3) s.push(v); } }
      r[key] = { total, orphan, samples: s };
    };
    const col = async (t: any, f: string) => (await ctx.db.query(t).collect()).map((d: any) => d[f]);

    // structural
    const rupRows = await ctx.db.query("rupEntries").collect();
    chk("dist.rupEntryId->rupEntries", rupRows.flatMap((x: any) => (x.distributionEntries ?? []).map((d: any) => d.rupEntryId)), rups);
    chk("ktps.eventId->events", await col("ktps", "eventId"), events);
    chk("events.sourceGroupEventId->events", await col("calendarEvents", "sourceGroupEventId"), events);
    chk("events.parentIndividualJournalId->events|journals", await col("calendarEvents", "parentIndividualJournalId"), eventsOrJournals);
    chk("journals.parentIndividualJournalId->events|journals", await col("journals", "parentIndividualJournalId"), eventsOrJournals);
    chk("marks.scheduledControlId->schedControls", await col("marks", "scheduledControlId"), schedIds);
    chk("marks.controlId->controlCatalogs", await col("marks", "controlId"), catalogs);
    chk("workloads.teacherId->teachers", await col("workloads", "teacherId"), teachers);
    chk("teachers.userId->users", await col("teachers", "userId"), users);
    chk("substitutions.fromTeacherId->teachers", await col("substitutions", "fromTeacherId"), teachers);
    chk("substitutions.toTeacherId->teachers", await col("substitutions", "toTeacherId"), teachers);
    chk("teacherChangeHistory.calendarEventId->events", await col("teacherChangeHistory", "calendarEventId"), events);
    chk("teacherChangeHistory.journalId->journals", await col("teacherChangeHistory", "journalId"), journals);
    chk("teacherChangeHistory.substitutionId->subs", await col("teacherChangeHistory", "substitutionId"), subs);
    chk("passwordChangeHistory.teacherId->teachers", await col("passwordChangeHistory", "teacherId"), teachers);

    // user / permission metadata
    chk("marks.createdBy->users", await col("marks", "createdBy"), users);
    chk("marks.updatedBy->users", await col("marks", "updatedBy"), users);
    chk("markHistory.changedBy->users", await col("markHistory", "changedBy"), users);
    chk("files.uploadedBy->users", await col("files", "uploadedBy"), users);
    chk("passwordChangeHistory.userId->users", await col("passwordChangeHistory", "userId"), users);
    chk("passwordChangeHistory.changedBy->users", await col("passwordChangeHistory", "changedBy"), users);
    chk("offlineQueue.userId->users", await col("offlineQueue", "userId"), users);
    chk("notifications.userId->users", await col("notifications", "userId"), users);
    chk("substitutions.toUserId->users", await col("substitutions", "toUserId"), users);
    chk("substitutions.createdBy->users", await col("substitutions", "createdBy"), users);
    chk("teacherChangeHistory.changedBy->users", await col("teacherChangeHistory", "changedBy"), users);
    chk("makeupRequests.createdBy->users", await col("makeupRequests", "createdBy"), users);
    chk("journalClosureReminders.createdBy->users", await col("journalClosureReminders", "createdBy"), users);
    chk("ktps.createdBy->users", await col("ktps", "createdBy"), users);
    chk("ktps.updatedBy->users", await col("ktps", "updatedBy"), users);
    chk("permissionHistory.permissionId->permissions", await col("permissionHistory", "permissionId"), permissions);
    chk("permissionHistory.changedBy->users", await col("permissionHistory", "changedBy"), users);

    return r;
  },
});
