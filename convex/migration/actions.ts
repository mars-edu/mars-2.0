/**
 * Data Migration Actions
 *
 * These actions handle migrating data from D1/Pinia to Convex.
 * Run these once to transfer existing data.
 */

import { action, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

// ID mapping storage (in-memory for batch operations)
const idMappings: Record<string, Record<string, string>> = {};

/**
 * Internal mutation to insert an academic year
 */
export const insertAcademicYear = internalMutation({
  args: {
    name: v.string(),
    startYear: v.number(),
    endYear: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.string(),
  },
  handler: async (ctx, args) => {
    const { legacyId, ...data } = args;
    const id = await ctx.db.insert("academicYears", data);
    return { id, legacyId };
  },
});

/**
 * Internal mutation to insert a student
 */
export const insertStudent = internalMutation({
  args: {
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    specialty: v.string(),
    language: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    base: v.optional(v.number()),
    academicYearId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.string(),
  },
  handler: async (ctx, args) => {
    const { legacyId, ...data } = args;
    const id = await ctx.db.insert("students", data);
    return { id, legacyId };
  },
});

/**
 * Internal mutation to insert a teacher
 */
export const insertTeacher = internalMutation({
  args: {
    firstName: v.string(),
    surname: v.string(),
    patronymic: v.string(),
    position: v.string(),
    employmentYear: v.number(),
    gender: v.union(v.literal("male"), v.literal("female")),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.string(),
  },
  handler: async (ctx, args) => {
    const { legacyId, ...data } = args;
    const id = await ctx.db.insert("teachers", data);
    return { id, legacyId };
  },
});

/**
 * Internal mutation to insert a user
 */
export const insertUser = internalMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    username: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    roles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT")
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.string(),
  },
  handler: async (ctx, args) => {
    const { legacyId, ...data } = args;
    const id = await ctx.db.insert("users", data);
    return { id, legacyId };
  },
});

/**
 * Migrate academic years from D1
 */
export const migrateAcademicYears = action({
  args: {
    data: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        startYear: v.number(),
        endYear: v.number(),
        isActive: v.boolean(),
        createdAt: v.optional(v.string()),
        updatedAt: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const mappings: Record<string, string> = {};

    for (const item of args.data) {
      const result = await ctx.runMutation(internal.migration.actions.insertAcademicYear, {
        name: item.name,
        startYear: item.startYear,
        endYear: item.endYear,
        isActive: item.isActive,
        createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now(),
        legacyId: item.id,
      });

      mappings[item.id] = result.id;
    }

    return {
      migrated: args.data.length,
      mappings,
    };
  },
});

/**
 * Migrate students from D1/Pinia
 */
export const migrateStudents = action({
  args: {
    data: v.array(
      v.object({
        id: v.string(),
        firstName: v.string(),
        surname: v.string(),
        patronymic: v.string(),
        specialty: v.string(),
        language: v.string(),
        gender: v.union(v.literal("male"), v.literal("female")),
        base: v.optional(v.number()),
        academicYearId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const mappings: Record<string, string> = {};

    for (const item of args.data) {
      const result = await ctx.runMutation(internal.migration.actions.insertStudent, {
        firstName: item.firstName,
        surname: item.surname,
        patronymic: item.patronymic,
        specialty: item.specialty,
        language: item.language,
        gender: item.gender,
        base: item.base,
        academicYearId: item.academicYearId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        legacyId: item.id,
      });

      mappings[item.id] = result.id;
    }

    return {
      migrated: args.data.length,
      mappings,
    };
  },
});

/**
 * Migrate teachers from D1/Pinia
 */
export const migrateTeachers = action({
  args: {
    data: v.array(
      v.object({
        id: v.string(),
        firstName: v.string(),
        surname: v.string(),
        patronymic: v.string(),
        position: v.string(),
        employmentYear: v.number(),
        gender: v.union(v.literal("male"), v.literal("female")),
        email: v.optional(v.string()),
        username: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const mappings: Record<string, string> = {};

    for (const item of args.data) {
      const result = await ctx.runMutation(internal.migration.actions.insertTeacher, {
        firstName: item.firstName,
        surname: item.surname,
        patronymic: item.patronymic,
        position: item.position,
        employmentYear: item.employmentYear,
        gender: item.gender,
        email: item.email,
        username: item.username,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        legacyId: item.id,
      });

      mappings[item.id] = result.id;
    }

    return {
      migrated: args.data.length,
      mappings,
    };
  },
});

/**
 * Migrate users from Prisma
 */
export const migrateUsers = action({
  args: {
    data: v.array(
      v.object({
        id: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        username: v.string(),
        email: v.string(),
        password: v.string(), // Already hashed from D1
        roles: v.array(v.string()),
        createdAt: v.optional(v.string()),
        updatedAt: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const mappings: Record<string, string> = {};

    for (const item of args.data) {
      // Validate roles
      const validRoles = item.roles.filter((r) =>
        ["ADMIN", "TEACHER", "STUDENT", "PARENT"].includes(r)
      ) as Array<"ADMIN" | "TEACHER" | "STUDENT" | "PARENT">;

      const result = await ctx.runMutation(internal.migration.actions.insertUser, {
        firstName: item.firstName,
        lastName: item.lastName,
        username: item.username,
        email: item.email,
        passwordHash: item.password,
        roles: validRoles.length > 0 ? validRoles : ["STUDENT"],
        createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now(),
        legacyId: item.id,
      });

      mappings[item.id] = result.id;
    }

    return {
      migrated: args.data.length,
      mappings,
    };
  },
});

/**
 * Import Pinia state directly
 * This is useful for stores that weren't synced to D1
 */
export const importPiniaState = action({
  args: {
    storeName: v.string(),
    state: v.string(), // JSON string
  },
  handler: async (ctx, args): Promise<{ migrated: number; error?: string; mappings?: any }> => {
    const parsedState = JSON.parse(args.state);

    // Route to appropriate migration based on store name
    switch (args.storeName) {
      case "academicYear":
        if (parsedState.academicYears) {
          return await ctx.runAction(api.migration.actions.migrateAcademicYears, {
            data: parsedState.academicYears,
          });
        }
        break;

      case "student":
        if (parsedState.students) {
          return await ctx.runAction(api.migration.actions.migrateStudents, {
            data: parsedState.students,
          });
        }
        break;

      case "teacher":
        if (parsedState.teachers) {
          return await ctx.runAction(api.migration.actions.migrateTeachers, {
            data: parsedState.teachers,
          });
        }
        break;

      default:
        throw new Error(`Unknown store: ${args.storeName}`);
    }

    return { migrated: 0, error: "No data found in state" };
  },
});

/**
 * Get migration status
 */
export const getMigrationStatus = action({
  args: {},
  handler: async (ctx): Promise<{
    academicYears: number;
    students: number;
    teachers: number;
    users: number;
  }> => {
    // Count records in each table directly
    const academicYears = (await ctx.runQuery(internal.migration.actions.listAcademicYears, {})).length;
    const students = (await ctx.runQuery(internal.migration.actions.listStudents, {})).length;
    const teachers = (await ctx.runQuery(internal.migration.actions.listTeachers, {})).length;
    const users = (await ctx.runQuery(internal.migration.actions.listUsers, {})).length;

    return {
      academicYears,
      students,
      teachers,
      users,
    };
  },
});

// List queries for migration status (avoid count method issues)
import { internalQuery } from "../_generated/server";

export const listAcademicYears = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("academicYears").collect();
  },
});

export const listStudents = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
  },
});

export const listTeachers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teachers").collect();
  },
});

export const listUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
