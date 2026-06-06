import { mutation } from "../_generated/server";

export const run = mutation({
  handler: async (ctx) => {
    // 1. Get active academic year
    const activeYear = await ctx.db
      .query("academicYears")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!activeYear) {
      throw new Error("No active academic year found");
    }

    // 2. Get semesters for active year
    const semesters = await ctx.db
      .query("academicYearSemesters")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", activeYear._id))
      .collect();

    if (semesters.length < 2) {
      throw new Error("Less than 2 semesters found for active year");
    }

    semesters.sort((a, b) => a.startDate.localeCompare(b.startDate));
    const sem1 = semesters[0]._id;
    const sem2 = semesters[1]._id;

    let copiedSchedules = 0;
    let copiedVacations = 0;
    let copiedFinals = 0;
    let copiedIntermediates = 0;

    const now = Date.now();

    // Copy schedules
    const schedules = await ctx.db
      .query("educationSchedules")
      .withIndex("by_semester", (q) => q.eq("semesterId", sem1))
      .collect();

    for (const s of schedules) {
      await ctx.db.insert("educationSchedules", {
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        order: s.order,
        academicYearId: s.academicYearId,
        semesterId: sem2,
        createdAt: now,
        updatedAt: now,
      });
      copiedSchedules++;
    }

    // Copy vacations
    const vacations = await ctx.db
      .query("vacations")
      .withIndex("by_semester", (q) => q.eq("semesterId", sem1))
      .collect();

    for (const v of vacations) {
      await ctx.db.insert("vacations", {
        shortName: v.shortName,
        fullName: v.fullName,
        academicYearId: v.academicYearId,
        semesterId: sem2,
        startDate: v.startDate,
        endDate: v.endDate,
        createdAt: now,
        updatedAt: now,
      });
      copiedVacations++;
    }

    // Copy final controls
    const finals = await ctx.db
      .query("scheduledFinalControls")
      .withIndex("by_semester", (q) => q.eq("semesterId", sem1))
      .collect();

    for (const f of finals) {
      await ctx.db.insert("scheduledFinalControls", {
        finalControlId: f.finalControlId,
        shortName: f.shortName,
        academicYearId: f.academicYearId,
        semesterId: sem2,
        startDate: f.startDate,
        endDate: f.endDate,
        rupEntryId: f.rupEntryId,
        date: f.date,
        createdAt: now,
        updatedAt: now,
      });
      copiedFinals++;
    }

    // Copy intermediate controls
    const intermediates = await ctx.db
      .query("scheduledIntermediateControls")
      .withIndex("by_semester", (q) => q.eq("semesterId", sem1))
      .collect();

    for (const i of intermediates) {
      await ctx.db.insert("scheduledIntermediateControls", {
        intermediateControlId: i.intermediateControlId,
        shortName: i.shortName,
        academicYearId: i.academicYearId,
        semesterId: sem2,
        startDate: i.startDate,
        endDate: i.endDate,
        rupEntryId: i.rupEntryId,
        date: i.date,
        createdAt: now,
        updatedAt: now,
      });
      copiedIntermediates++;
    }

    return {
      copiedSchedules,
      copiedVacations,
      copiedFinals,
      copiedIntermediates,
      sem1,
      sem2
    };
  },
});
