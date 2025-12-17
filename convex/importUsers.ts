/**
 * Import users from D1 database export
 *
 * Run with: npx convex run importUsers:importFromD1 --watch
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Import the exported data
const usersData = require("../backend/users_export.json");
const userRolesData = require("../backend/user_roles_export.json");

export const importFromD1 = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting user import from D1...");

    // Parse the data
    const users = usersData[0].results;
    const userRoles = userRolesData[0].results;

    // Create a map of userId -> roles[]
    const rolesMap = new Map<string, string[]>();
    for (const ur of userRoles) {
      if (!rolesMap.has(ur.userId)) {
        rolesMap.set(ur.userId, []);
      }
      rolesMap.get(ur.userId)!.push(ur.role);
    }

    let imported = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Check if user already exists
        const existing = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", user.username))
          .unique();

        if (existing) {
          console.log(`Skipping existing user: ${user.username}`);
          skipped++;
          continue;
        }

        // Get roles for this user (default to STUDENT if none)
        const roles = rolesMap.get(user.id) || ["STUDENT"];

        // Convert dates to timestamps
        const createdAt = new Date(user.createdAt).getTime();
        const updatedAt = new Date(user.updatedAt).getTime();

        // Insert user
        await ctx.db.insert("users", {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          passwordHash: user.password, // D1 "password" field is actually the hash
          roles: roles as Array<"ADMIN" | "TEACHER" | "STUDENT" | "PARENT">,
          createdAt,
          updatedAt,
        });

        console.log(`Imported user: ${user.username} (${roles.join(", ")})`);
        imported++;
      } catch (error) {
        console.error(`Error importing user ${user.username}:`, error);
      }
    }

    console.log(`Import complete: ${imported} imported, ${skipped} skipped`);

    return {
      success: true,
      imported,
      skipped,
      total: users.length,
    };
  },
});
