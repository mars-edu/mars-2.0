/**
 * Test Data Seed Script
 *
 * This script seeds the Convex database with test data for E2E tests.
 * Run with: npx convex run testSeed:seedTestData
 *
 * Or reset and reseed: npx convex run testSeed:resetAndSeed
 */

import { action, internalMutation } from "./functions";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword } from "./auth/helpers";

/**
 * Clear all test data from the database (internal)
 */
const clearTestDataInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[TestSeed] Clearing test data...");

    // Delete test users
    const testUsers = await ctx.db
      .query("users")
      .filter((q) => q.or(
        q.eq(q.field("username"), "Килаш Расул Жангелдыулы"),
        q.eq(q.field("username"), "Админ Тестовый"),
        q.eq(q.field("username"), "Студент Тестовый")
      ))
      .collect();

    for (const user of testUsers) {
      await ctx.db.delete(user._id);
      console.log(`[TestSeed] Deleted test user: ${user.username}`);
    }

    console.log("[TestSeed] Test data cleared successfully");
    return { success: true, message: "Test data cleared" };
  },
});

/**
 * Seed basic data like bases (internal)
 */
const seedBasicDataInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[TestSeed] Seeding basic data (bases)...");

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
        console.log(`[TestSeed] Base already exists: ${baseData.value}`);
        createdBases.push(existingBase._id);
        continue;
      }

      // Create base
      const baseId = await ctx.db.insert("bases", {
        value: baseData.value,
        name: baseData.name,
        });

      console.log(`[TestSeed] Created base: ${baseData.value} (${baseId})`);
      createdBases.push(baseId);
    }

    // Seed default education technology
    let defaultTech = await ctx.db
      .query("educationTechnologies")
      .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
      .first();

    if (!defaultTech) {
      const now = new Date().toISOString();
      const techId = await ctx.db.insert("educationTechnologies", {
        name: "Классическая",
        shortName: "КЛ",
        academicHourMinutes: 45,
        isDefault: true,
        description: "Стандартная технология",
      });
      defaultTech = await ctx.db.get(techId);
    }

    // Seed default academic year
    let activeYear = await ctx.db
      .query("academicYears")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!activeYear && defaultTech) {
      const now = new Date().toISOString();
      const currentYear = new Date().getFullYear();
      const yearId = await ctx.db.insert("academicYears", {
        name: `${currentYear}-${currentYear + 1}`,
        startYear: currentYear,
        endYear: currentYear + 1,
        isActive: true,
        technologyId: defaultTech._id,
        startDate: `${currentYear}-09-01`,
        endDate: `${currentYear + 1}-06-30`,
      });
      activeYear = await ctx.db.get(yearId);
    }

    // Seed semester definitions
    const def1 = await ctx.db
      .query("semesterDefinitions")
      .withIndex("by_number", (q) => q.eq("number", 1))
      .first();
    let def1Id = def1?._id;
    if (!def1) {
      const now = new Date().toISOString();
      def1Id = await ctx.db.insert("semesterDefinitions", {
        name: "1 семестр",
        shortName: "1 сем",
        number: 1,
      });
    }

    const def2 = await ctx.db
      .query("semesterDefinitions")
      .withIndex("by_number", (q) => q.eq("number", 2))
      .first();
    let def2Id = def2?._id;
    if (!def2) {
      const now = new Date().toISOString();
      def2Id = await ctx.db.insert("semesterDefinitions", {
        name: "2 семестр",
        shortName: "2 сем",
        number: 2,
      });
    }

    // Seed academic year semesters for active year
    if (activeYear && def1Id && def2Id) {
      const existingSem = await ctx.db
        .query("academicYearSemesters")
        .withIndex("by_academicYear", (q) => q.eq("academicYearId", activeYear._id))
        .first();

      if (!existingSem) {
        const now = new Date().toISOString();
        const currentYear = activeYear.startYear;
        await ctx.db.insert("academicYearSemesters", {
          academicYearId: activeYear._id,
          semesterDefinitionId: def1Id,
          startDate: `${currentYear}-09-01`,
          endDate: `${currentYear + 1}-01-15`,
          weeksCount: 18,
        });
        await ctx.db.insert("academicYearSemesters", {
          academicYearId: activeYear._id,
          semesterDefinitionId: def2Id,
          startDate: `${currentYear + 1}-01-16`,
          endDate: `${currentYear + 1}-06-30`,
          weeksCount: 20,
        });
      }
    }

    console.log(`[TestSeed] Seeded ${createdBases.length} bases, tech, year, and semesters`);
    return {
      success: true,
      message: `Seeded ${createdBases.length} bases`,
      baseIds: createdBases.map(id => id.toString())
    };
  },
});

/**
 * Seed test user accounts (internal)
 */
const seedTestUsersInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("[TestSeed] Seeding test users...");

    const testUsers = [
      {
        firstName: "Килаш",
        lastName: "Расул",
        middleName: "Жангелдыулы",
        username: "Килаш Расул Жангелдыулы",
        email: "kilash.rasul@test.mars.edu",
        password: "teachertest",
        roles: ["ADMIN" as const, "TEACHER" as const],
      },
      {
        firstName: "Админ",
        lastName: "Тестовый",
        middleName: undefined,
        username: "Админ Тестовый",
        email: "admin@test.mars.edu",
        password: "admintest",
        roles: ["ADMIN" as const],
      },
      {
        firstName: "Студент",
        lastName: "Тестовый",
        middleName: undefined,
        username: "Студент Тестовый",
        email: "student@test.mars.edu",
        password: "studenttest",
        roles: ["STUDENT" as const],
      },
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("username"), userData.username))
        .first();

      if (existingUser) {
        console.log(`[TestSeed] User already exists: ${userData.username}`);
        createdUsers.push(existingUser._id);
        continue;
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      // Create user
      const userId = await ctx.db.insert("users", {
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName,
        username: userData.username,
        email: userData.email,
        passwordHash,
        roles: userData.roles,
        });

      console.log(`[TestSeed] Created test user: ${userData.username} (${userId})`);
      createdUsers.push(userId);
    }

    console.log(`[TestSeed] Seeded ${createdUsers.length} test users`);
    return {
      success: true,
      message: `Seeded ${createdUsers.length} test users`,
      userIds: createdUsers.map(id => id.toString())
    };
  },
});

/**
 * Public action to seed basic data (bases) - useful for production initialization
 */
export const seedBasicData = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string; baseIds: string[] }> => {
    console.log("[TestSeed] Starting basic data seed (bases)...");
    const result: { success: boolean; message: string; baseIds: string[] } = await ctx.runMutation(internal.testSeed.seedBasicDataInternal, {});
    console.log("[TestSeed] Basic data seed completed:", result);
    return result;
  },
});

/**
 * Public action to seed test users (can be called from CLI)
 */
export const seedTestData: any = action({
  args: {},
  handler: async (ctx) => {
    console.log("[TestSeed] Starting test data seed...");

    // First seed basic data (bases)
    await ctx.runMutation(internal.testSeed.seedBasicDataInternal, {});

    // Then seed test users
    const result = await ctx.runMutation(internal.testSeed.seedTestUsersInternal, {});
    console.log("[TestSeed] Seed completed:", result);
    return result;
  },
});

/**
 * Public action to reset and seed all test data
 */
export const resetAndSeed: any = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string; userIds: string[] }> => {
    console.log("[TestSeed] Resetting and seeding test data...");

    // Clear existing test data
    await ctx.runMutation(internal.testSeed.clearTestDataInternal, {});

    // Seed permissions
    await ctx.runMutation(internal.permissions.mutations.seedPermissions, {});

    // Seed basic data (bases) first
    await ctx.runMutation(internal.testSeed.seedBasicDataInternal, {});

    // Seed test users
    const result: { success: boolean; message: string; userIds: string[] } = await ctx.runMutation(internal.testSeed.seedTestUsersInternal, {});

    console.log("[TestSeed] Reset and seed completed successfully");
    return {
      ...result,
      message: "Test data reset and seeded successfully"
    };
  },
});

/**
 * Get test user credentials (for documentation/reference)
 */
export const getTestCredentials = action({
  args: {},
  handler: async () => {
    return {
      teacher: {
        username: "Килаш Расул Жангелдыулы",
        password: "teachertest",
        roles: ["TEACHER"],
      },
      admin: {
        username: "Админ Тестовый",
        password: "admintest",
        roles: ["ADMIN"],
      },
      student: {
        username: "Студент Тестовый",
        password: "studenttest",
        roles: ["STUDENT"],
      },
    };
  },
});

// Export internal mutations for use by actions
export { clearTestDataInternal, seedTestUsersInternal, seedBasicDataInternal };
