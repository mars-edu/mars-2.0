import { mutation } from "../_generated/server";

export const run = mutation({
  handler: async (ctx) => {
    let deleted = 0;
    
    // Check and delete orphaned schedules
    const schedules = await ctx.db.query("educationSchedules").collect();
    for (const s of schedules) {
      if (!s.semesterId) {
        await ctx.db.delete(s._id);
        deleted++;
      }
    }

    const vacations = await ctx.db.query("vacations").collect();
    for (const v of vacations) {
      if (!v.semesterId) {
        await ctx.db.delete(v._id);
        deleted++;
      }
    }

    const finals = await ctx.db.query("scheduledFinalControls").collect();
    for (const f of finals) {
      if (!f.semesterId) {
        await ctx.db.delete(f._id);
        deleted++;
      }
    }

    const intermediates = await ctx.db.query("scheduledIntermediateControls").collect();
    for (const i of intermediates) {
      if (!i.semesterId) {
        await ctx.db.delete(i._id);
        deleted++;
      }
    }

    return deleted;
  },
});
