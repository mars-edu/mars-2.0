import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new semester definition
 */
export const create = mutation({
  args: {
    name: v.string(),
    shortName: v.string(),
    fullName: v.optional(v.string()),
    number: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("semesterDefinitions", {
      name: args.name,
      shortName: args.shortName,
      fullName: args.fullName,
      number: args.number,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing semester definition
 */
export const update = mutation({
  args: {
    id: v.id("semesterDefinitions"),
    name: v.optional(v.string()),
    shortName: v.optional(v.string()),
    fullName: v.optional(v.string()),
    number: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = Date.now();

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Remove a semester definition
 */
export const remove = mutation({
  args: {
    id: v.id("semesterDefinitions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
