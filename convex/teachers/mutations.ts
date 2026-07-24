import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Internal mutation to create a teacher (called from actions)
 */
export const createTeacherInternal = internalMutation({
  args: {
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    position: v.string(),
    employmentYear: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    userId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teachers", {
      ...args,
      searchName: `${args.surname} ${args.firstName} ${args.patronymic}`,
    });
  },
});

/**
 * Create a teacher
 */
export const create = mutation({
  args: {
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    position: v.string(),
    employmentYear: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();
    return await ctx.db.insert("teachers", {
      ...args,
      searchName: `${args.surname} ${args.firstName} ${args.patronymic}`,
      ...timestamps,
    });
  },
});

/**
 * Update a teacher
 */
export const update = mutation({
  args: {
    id: v.id("teachers"),
    firstName: v.optional(v.string()),
    surname: v.optional(v.string()),
    patronymic: v.optional(v.string()),
    position: v.optional(v.string()),
    employmentYear: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Teacher not found");
    const merged = { ...existing, ...cleanUpdates };
    await ctx.db.patch(id, {
      ...cleanUpdates,
      searchName: `${merged.surname} ${merged.firstName} ${merged.patronymic}`,
      ...updateTimestamp(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a teacher
 */
export const remove = mutation({
  args: { id: v.id("teachers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
