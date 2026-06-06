import { mutation } from "../_generated/server";

export const backfill = mutation({
  handler: async (ctx) => {
    let updatedSchedules = 0;
    let updatedVacations = 0;
    let updatedFinals = 0;
    let updatedIntermediates = 0;

    // Cache of academicYearId -> semesterId (first semester for that year)
    const semesterMap = new Map<string, string>();

    const getSemesterId = async (academicYearId: string) => {
      if (semesterMap.has(academicYearId)) {
        return semesterMap.get(academicYearId);
      }
      
      const semesters = await ctx.db
        .query("academicYearSemesters")
        .withIndex("by_academicYear", (q) => q.eq("academicYearId", academicYearId as any))
        .collect();
        
      if (semesters.length > 0) {
        // Sort by start date to get the first semester
        semesters.sort((a, b) => a.startDate.localeCompare(b.startDate));
        semesterMap.set(academicYearId, semesters[0]._id as string);
        return semesters[0]._id as string;
      }
      return null;
    };

    // 1. Update educationSchedules
    const schedules = await ctx.db.query("educationSchedules").collect();
    for (const schedule of schedules) {
      if (!schedule.semesterId) {
        const semId = await getSemesterId(schedule.academicYearId);
        if (semId) {
          await ctx.db.patch(schedule._id, { semesterId: semId as any });
          updatedSchedules++;
        }
      }
    }

    // 2. Update vacations
    const vacations = await ctx.db.query("vacations").collect();
    for (const vacation of vacations) {
      if (!vacation.semesterId) {
        const semId = await getSemesterId(vacation.academicYearId);
        if (semId) {
          await ctx.db.patch(vacation._id, { semesterId: semId as any });
          updatedVacations++;
        }
      }
    }

    // 3. Update scheduledFinalControls
    const finals = await ctx.db.query("scheduledFinalControls").collect();
    for (const final of finals) {
      if (!final.semesterId) {
        const semId = await getSemesterId(final.academicYearId);
        if (semId) {
          await ctx.db.patch(final._id, { semesterId: semId as any });
          updatedFinals++;
        }
      }
    }

    // 4. Update scheduledIntermediateControls
    const intermediates = await ctx.db.query("scheduledIntermediateControls").collect();
    for (const intermediate of intermediates) {
      if (!intermediate.semesterId) {
        const semId = await getSemesterId(intermediate.academicYearId);
        if (semId) {
          await ctx.db.patch(intermediate._id, { semesterId: semId as any });
          updatedIntermediates++;
        }
      }
    }

    return {
      updatedSchedules,
      updatedVacations,
      updatedFinals,
      updatedIntermediates
    };
  },
});
