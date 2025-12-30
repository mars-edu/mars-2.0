/**
 * Maintenance actions for clearing/resetting Convex data.
 */

import { action, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

const ALLOWED_TABLES = [
  "users",
  "academicYears",
  "semesters",
  "specialties",
  "courses",
  "bases",
  "positions",
  "disciplines",
  "modules",
  "students",
  "teachers",
  "class9Items",
  "distributionEntries",
  "intermediateControls",
  "finalControls",
  "scheduledIntermediateControls",
  "scheduledFinalControls",
  "calendarEvents",
  "ktps",
  "ktpDetails",
  "journals",
  "journalStudents",
  "marks",
  "markHistory",
  "educationSchedules",
  "vacations",
  "sessions",
  "files",
  "passwordChangeHistory",
  "offlineQueue",
  "rupEntries",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

export const clearTablesInternal = internalMutation({
  args: {
    tables: v.array(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results: Record<string, number> = {};
    const dryRun = args.dryRun ?? false;

    for (const table of args.tables) {
      if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
        throw new Error(`Table '${table}' is not allowed for clearing`);
      }

      // Dynamic table access is intentional for maintenance.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = await ctx.db.query(table as any).collect();
      results[table] = docs.length;

      if (!dryRun) {
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
        }
      }
    }

    const total = Object.values(results).reduce((sum, count) => sum + count, 0);

    return {
      dryRun,
      total,
      perTable: results,
    };
  },
});

/**
 * Clear selected tables. Requires explicit confirmation string.
 */
export const clearTables: any = action({
  args: {
    tables: v.array(v.string()),
    confirm: v.string(),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.confirm !== "DELETE_DATA") {
      throw new Error("Confirmation failed. Set confirm to 'DELETE_DATA'.");
    }

    if (args.tables.length === 0) {
      throw new Error(
        "No tables specified. Provide at least one table name to clear."
      );
    }

    return await ctx.runMutation(internal.maintenance.actions.clearTablesInternal, {
      tables: args.tables,
      dryRun: args.dryRun ?? false,
    });
  },
});

/**
 * List tables eligible for clearing.
 */
export const listClearableTables = action({
  args: {},
  handler: async () => {
    return {
      tables: ALLOWED_TABLES,
    };
  },
});
