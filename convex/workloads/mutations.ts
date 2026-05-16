import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Save a workload (create or update)
 */
export const save = mutation({
  args: {
    id: v.optional(v.id("workloads")),
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.string(),
    academicYearId: v.string(),
    totalHours: v.number(),
    items: v.array(
      v.object({
        id: v.string(),
        subjectId: v.string(),
        department: v.string(),
        course: v.string(),
        studentCount: v.string(),
        weeks1: v.string(),
        weeks2: v.string(),
        weeks3: v.optional(v.string()),
        hours1: v.string(),
        hours2: v.string(),
        hours3: v.optional(v.string()),
        hoursPerGroup1: v.string(),
        hoursPerGroup2: v.string(),
        hoursPerGroup3: v.optional(v.string()),
        groupCount1: v.string(),
        groupCount2: v.string(),
        groupCount3: v.optional(v.string()),
        totalHours: v.string(),
        teacherName: v.optional(v.string()),
        index: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    
    if (id) {
      // Update existing
      await ctx.db.patch(id, {
        ...data,
        ...updateTimestamp(),
      });
      return id;
    } else {
      // Create new
      return await ctx.db.insert("workloads", {
        ...data,
        ...createTimestamps(),
      });
    }
  },
});

/**
 * Delete a workload
 */
export const remove = mutation({
  args: { id: v.id("workloads") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
