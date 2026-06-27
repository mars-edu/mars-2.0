import { internalQuery } from "../_generated/server";

/**
 * Read-only: second-pass referential audit covering the app-relevant FKs not in
 * referentialAudit (control catalogs, distributionEntries, ktps, substitutions,
 * makeupRequests, tests, reminders). Skips pure audit-metadata (createdBy→users).
 */
export const referentialAudit2 = internalQuery({
  args: {},
  handler: async (ctx) => {
    const idset = async (t: any) => new Set((await ctx.db.query(t).collect()).map((d: any) => d._id as string));
    const aySems = await idset("academicYearSemesters");
    const intC = await idset("intermediateControls");
    const finC = await idset("finalControls");
    const rups = await idset("rupEntries");
    const journals = await idset("journals");
    const events = await idset("calendarEvents");
    const ktps = await idset("ktps");
    const subs = await idset("substitutions");
    const teachers = await idset("teachers");
    const students = await idset("students");
    const tests = await idset("tests");
    const testAssignments = await idset("testAssignments");

    const r: Record<string, { total: number; orphan: number; samples: string[] }> = {};
    const chk = (key: string, vals: any[], parent: Set<string>) => {
      let total = 0, orphan = 0; const samples: string[] = [];
      for (const v of vals) { if (v == null || v === "") continue; total++; if (!parent.has(v)) { orphan++; if (samples.length < 3) samples.push(v); } }
      r[key] = { total, orphan, samples };
    };

    // distributionEntries (nested in rupEntries)
    const rupRows = await ctx.db.query("rupEntries").collect();
    const dist = rupRows.flatMap((x) => (x as any).distributionEntries ?? []);
    chk("dist.semesterId->aySems", dist.map((d: any) => d.semesterId), aySems);
    chk("dist.intermediateControlId->intC", dist.map((d: any) => d.intermediateControlId), intC);
    chk("dist.finalControlId->finC", dist.map((d: any) => d.finalControlId), finC);

    const si = await ctx.db.query("scheduledIntermediateControls").collect();
    chk("schedInt.intermediateControlId->intC", si.map((c: any) => c.intermediateControlId), intC);
    const sf = await ctx.db.query("scheduledFinalControls").collect();
    chk("schedFin.finalControlId->finC", sf.map((c: any) => c.finalControlId), finC);

    const ktpRows = await ctx.db.query("ktps").collect();
    chk("ktps.semesterId->aySems", ktpRows.map((k: any) => k.semesterId), aySems);
    chk("ktps.rupEntryId->rupEntries", ktpRows.map((k: any) => k.rupEntryId), rups);

    const subRows = await ctx.db.query("substitutions").collect();
    chk("substitutions.calendarEventId->events", subRows.map((s: any) => s.calendarEventId), events);
    chk("substitutions.journalId->journals", subRows.map((s: any) => s.journalId), journals);

    const mr = await ctx.db.query("makeupRequests").collect();
    chk("makeupRequests.journalId->journals", mr.map((m: any) => m.journalId), journals);
    chk("makeupRequests.teacherId->teachers", mr.map((m: any) => m.teacherId), teachers);

    const notif = await ctx.db.query("notifications").collect();
    chk("notifications.journalId->journals", notif.map((n: any) => n.journalId), journals);
    chk("notifications.substitutionId->subs", notif.map((n: any) => n.substitutionId), subs);

    const rem = await ctx.db.query("journalClosureReminders").collect();
    chk("reminders.semesterId->aySems", rem.map((x: any) => x.semesterId), aySems);

    const ta = await ctx.db.query("testAssignments").collect();
    chk("testAssignments.journalId->journals", ta.map((x: any) => x.journalId), journals);
    chk("testAssignments.testId->tests", ta.map((x: any) => x.testId), tests);
    const ts = await ctx.db.query("testResults").collect();
    chk("testResults.assignmentId->testAssignments", ts.map((x: any) => x.assignmentId), testAssignments);
    chk("testResults.studentId->students", ts.map((x: any) => x.studentId), students);

    return r;
  },
});
