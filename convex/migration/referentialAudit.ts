import { internalQuery } from "../_generated/server";

/**
 * Read-only referential-integrity audit: for the main foreign keys, count
 * references that point to a non-existent parent document (orphans). No writes.
 */
export const referentialAudit = internalQuery({
  args: {},
  handler: async (ctx) => {
    const ids = async (
      t:
        | "calendarEvents" | "rupEntries" | "academicYearSemesters" | "journals"
        | "students" | "ktps" | "teachers" | "users" | "semesterDefinitions"
    ) => new Set((await ctx.db.query(t).collect()).map((d) => d._id as string));

    const events = await ids("calendarEvents");
    const rups = await ids("rupEntries");
    const sems = await ids("academicYearSemesters");
    const journalsSet = await ids("journals");
    const studs = await ids("students");
    const ktpsSet = await ids("ktps");
    const teachers = await ids("teachers");
    const users = await ids("users");
    const semDefs = await ids("semesterDefinitions");

    const r: Record<string, { total: number; orphan: number; samples: string[] }> = {};
    const chk = (key: string, vals: (string | undefined | null)[], parent: Set<string>) => {
      let total = 0, orphan = 0; const samples: string[] = [];
      for (const v of vals) {
        if (v == null || v === "") continue;
        total++;
        if (!parent.has(v)) { orphan++; if (samples.length < 3) samples.push(v); }
      }
      r[key] = { total, orphan, samples };
    };

    const journals = await ctx.db.query("journals").collect();
    chk("journals.calendarEventId->events", journals.map((j) => j.calendarEventId as string), events);
    chk("journals.disciplineId->rupEntries", journals.map((j) => j.disciplineId as string), rups);
    chk("journals.semesterId->aySems", journals.map((j) => (j as any).semesterId), sems);
    chk("journals.ktpId->ktps", journals.map((j) => (j as any).ktpId), ktpsSet);

    const js = await ctx.db.query("journalStudents").collect();
    chk("journalStudents.journalId->journals", js.map((x) => x.journalId as string), journalsSet);
    chk("journalStudents.studentId->students", js.map((x) => x.studentId as string), studs);

    const marks = await ctx.db.query("marks").collect();
    chk("marks.journalId->journals", marks.map((m) => m.journalId as string), journalsSet);
    chk("marks.studentId->students", marks.map((m) => (m as any).studentId), studs);

    const evs = await ctx.db.query("calendarEvents").collect();
    chk("calendarEvents.rupEntryId->rupEntries", evs.map((e) => (e as any).rupEntryId), rups);
    chk("calendarEvents.semester->aySems", evs.map((e) => (e as any).semester), sems);
    const partVals: string[] = [];
    for (const e of evs) for (const p of ((e as any).participants ?? [])) partVals.push(p);
    chk("calendarEvents.participants->students", partVals, studs);
    // teacherId is dual-identity (teachers._id OR users._id) — orphan only if in NEITHER
    chk("calendarEvents.teacherId->teachers|users", evs.map((e) => (e as any).teacherId), new Set([...teachers, ...users]));

    const si = await ctx.db.query("scheduledIntermediateControls").collect();
    const sf = await ctx.db.query("scheduledFinalControls").collect();
    chk("scheduledControls.rupEntryId->rupEntries", [...si, ...sf].map((c) => (c as any).rupEntryId), rups);
    chk("scheduledControls.semesterId->aySems", [...si, ...sf].map((c) => (c as any).semesterId), sems);

    const kd = await ctx.db.query("ktpDetails").collect();
    chk("ktpDetails.ktpId->ktps", kd.map((d) => d.ktpId as string), ktpsSet);

    chk("aySems.semesterDefinitionId->semesterDefinitions", (await ctx.db.query("academicYearSemesters").collect()).map((s) => (s as any).semesterDefinitionId), semDefs);

    return r;
  },
});
