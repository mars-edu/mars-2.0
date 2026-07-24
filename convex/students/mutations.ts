import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a student
 */
export const create = mutation({
  args: {
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    specialty: v.string(),
    language: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    base: v.optional(v.number()),
    academicYearId: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("expelled"),
        v.literal("academic_leave"),
        v.literal("debt"),
        v.literal("graduated")
      )
    ),
    history: v.optional(
      v.array(
        v.object({
          date: v.string(),
          type: v.union(
            v.literal("transfer"),
            v.literal("expulsion"),
            v.literal("status_change"),
            v.literal("admission"),
            v.literal("restoration")
          ),
          orderNumber: v.string(),
          description: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();
    return await ctx.db.insert("students", {
      ...args,
      searchName: `${args.surname} ${args.firstName} ${args.patronymic}`,
      ...timestamps,
    });
  },
});

/**
 * Update a student
 */
export const update = mutation({
  args: {
    id: v.id("students"),
    firstName: v.optional(v.string()),
    surname: v.optional(v.string()),
    patronymic: v.optional(v.string()),
    specialty: v.optional(v.string()),
    language: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    base: v.optional(v.number()),
    academicYearId: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("expelled"),
        v.literal("academic_leave"),
        v.literal("debt"),
        v.literal("graduated")
      )
    ),
    history: v.optional(
      v.array(
        v.object({
          date: v.string(),
          type: v.union(
            v.literal("transfer"),
            v.literal("expulsion"),
            v.literal("status_change"),
            v.literal("admission"),
            v.literal("restoration")
          ),
          orderNumber: v.string(),
          description: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Student not found");
    const merged = { ...existing, ...cleanUpdates };
    await ctx.db.patch(id, {
      ...cleanUpdates,
      searchName: `${merged.surname} ${merged.firstName} ${merged.patronymic}`,
      });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a student
 */
export const remove = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Batch create students
 */
export const batchCreate = mutation({
  args: {
    students: v.array(
      v.object({
        firstName: v.string(),
        surname: v.string(),
        patronymic: v.string(),
        specialty: v.string(),
        language: v.string(),
        gender: v.union(v.literal("male"), v.literal("female")),
        base: v.optional(v.number()),
        academicYearId: v.optional(v.string()),
        status: v.optional(
          v.union(
            v.literal("active"),
            v.literal("expelled"),
            v.literal("academic_leave"),
            v.literal("debt"),
            v.literal("graduated")
          )
        ),
        history: v.optional(
          v.array(
            v.object({
              date: v.string(),
              type: v.union(
                v.literal("transfer"),
                v.literal("expulsion"),
                v.literal("status_change"),
                v.literal("admission"),
                v.literal("restoration")
              ),
              orderNumber: v.string(),
              description: v.string(),
            })
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();
    const ids: string[] = [];

    for (const student of args.students) {
      const id = await ctx.db.insert("students", {
        ...student,
        searchName: `${student.surname} ${student.firstName} ${student.patronymic}`,
        ...timestamps,
      });
      ids.push(id);
    }

    return ids;
  },
});
