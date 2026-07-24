import { mutation } from "../functions";
import { v } from "convex/values";
import { createTimestamps, updateTimestamp } from "../lib/validators";

/**
 * Create a base
 */
export const create = mutation({
  args: {
    value: v.number(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const timestamps = createTimestamps();

    return await ctx.db.insert("bases", {
      ...args,
      ...timestamps,
    });
  },
});

/**
 * Update a base
 */
export const update = mutation({
  args: {
    id: v.id("bases"),
    value: v.optional(v.number()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a base
 */
export const remove = mutation({
  args: { id: v.id("bases") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Seed default bases (9 and 11)
 * This is idempotent - only creates bases if they don't exist
 */
export const seedBases = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultBases = [
      { value: 9, name: "9" },
      { value: 11, name: "11" },
    ];

    const createdBases = [];

    for (const baseData of defaultBases) {
      // Check if base already exists
      const existingBase = await ctx.db
        .query("bases")
        .filter((q) => q.eq(q.field("value"), baseData.value))
        .first();

      if (existingBase) {
        console.log(`[SeedBases] Base already exists: ${baseData.value}`);
        createdBases.push(existingBase._id);
        continue;
      }

      // Create base
      const timestamps = createTimestamps();
      const baseId = await ctx.db.insert("bases", {
        ...baseData,
        ...timestamps,
      });

      console.log(`[SeedBases] Created base: ${baseData.value} (${baseId})`);
      createdBases.push(baseId);
    }

    return {
      success: true,
      message: `Seeded ${createdBases.length} bases`,
      baseIds: createdBases,
    };
  },
});
