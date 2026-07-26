import { mutation } from "../functions";
import { v, ConvexError } from "convex/values";

/**
 * Create an education technology
 */
export const create = mutation({
  args: {
    name: v.string(),
    shortName: v.optional(v.string()),
    academicHourMinutes: v.number(),
    isDefault: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If this technology is being set as default, deactivate all others
    if (args.isDefault) {
      const allTechs = await ctx.db.query("educationTechnologies").collect();
      for (const tech of allTechs) {
        if (tech.isDefault) {
          await ctx.db.patch(tech._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("educationTechnologies", { ...args });
  },
});

/**
 * Update an education technology
 */
export const update = mutation({
  args: {
    id: v.id("educationTechnologies"),
    name: v.optional(v.string()),
    shortName: v.optional(v.string()),
    academicHourMinutes: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If setting as default, deactivate all others
    if (updates.isDefault) {
      const allTechs = await ctx.db.query("educationTechnologies").collect();
      for (const tech of allTechs) {
        if (tech._id !== id && tech.isDefault) {
          await ctx.db.patch(tech._id, { isDefault: false });
        }
      }
    }

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);

    return await ctx.db.get(id);
  },
});

/**
 * Delete an education technology.
 *
 * Blocked when:
 *  - one or more academic years still reference it (must be re-pointed first)
 *  - it is the current default (there must always be a fallback technology)
 */
export const remove = mutation({
  args: { id: v.id("educationTechnologies") },
  handler: async (ctx, args) => {
    const tech = await ctx.db.get(args.id);
    if (!tech) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    if (tech.isDefault) {
      throw new ConvexError({ code: "CANNOT_DELETE_DEFAULT_TECH" });
    }

    const referencingYears = await ctx.db
      .query("academicYears")
      .withIndex("by_technology", (q) => q.eq("technologyId", args.id))
      .collect();

    if (referencingYears.length > 0) {
      throw new ConvexError({
        code: "TECH_HAS_YEARS",
        references: { academicYears: referencingYears.length },
      });
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
