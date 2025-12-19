/**
 * Test Data Seed Script
 *
 * This script seeds the Convex database with test data for E2E tests.
 * Run with: npx convex run testSeed:seedTestData
 *
 * Or reset and reseed: npx convex run testSeed:resetAndSeed
 */

import { action, internalMutation } from "./_generated/server";
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
        roles: ["TEACHER" as const],
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
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
 * Public action to seed test users (can be called from CLI)
 */
export const seedTestData: any = action({
  args: {},
  handler: async (ctx) => {
    console.log("[TestSeed] Starting test data seed...");
    const result = await ctx.runMutation(internal.testSeed.seedTestUsersInternal, {});
    console.log("[TestSeed] Seed completed:", result);
    return result;
  },
});

/**
 * Public action to reset and seed all test data
 */
export const resetAndSeed = action({
  args: {},
  handler: async (ctx) => {
    console.log("[TestSeed] Resetting and seeding test data...");

    // Clear existing test data
    await ctx.runMutation(internal.testSeed.clearTestDataInternal, {});

    // Seed test users
    const result = await ctx.runMutation(internal.testSeed.seedTestUsersInternal, {});

    console.log("[TestSeed] Reset and seed completed successfully");
    return {
      success: true,
      message: "Test data reset and seeded successfully",
      ...result
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
export { clearTestDataInternal, seedTestUsersInternal };
