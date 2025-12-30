#!/usr/bin/env ts-node

/**
 * Export users and roles from production Cloudflare D1 to Convex-ready JSON
 *
 * Usage:
 *   cd backend
 *   npm run export:users
 *
 * Or directly:
 *   npx ts-node scripts/export-users-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-users-export.json (Convex-ready format)
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table users backend/exports/convex-users-export.json
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  checkWranglerAuth,
  runD1Query,
  writeJsonFile as writeJsonFileToDisk,
} from "./lib/d1.ts";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * User row from D1 query result
 */
interface D1UserRow {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string; // This is actually the bcrypt hash
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
  roles: string | null; // Pipe-delimited: "ADMIN|TEACHER" or null
}

/**
 * Convex user record (matches convex/schema.ts)
 */
interface ConvexUser {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  passwordHash: string;
  roles: Array<"ADMIN" | "TEACHER" | "STUDENT" | "PARENT">;
  createdAt: number; // milliseconds since epoch
  updatedAt: number; // milliseconds since epoch
}

type ValidRole = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(__dirname, "..", "exports", "convex-users-export.json"),
  validRoles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] as const,
  defaultRole: "STUDENT" as ValidRole,
};

// ============================================================================
// SQL Query
// ============================================================================

const USERS_QUERY = `
SELECT
  u.id,
  u.firstName,
  u.lastName,
  u.username,
  u.email,
  u.password,
  u.createdAt,
  u.updatedAt,
  GROUP_CONCAT(ur.role, '|') as roles
FROM User u
LEFT JOIN UserRole ur ON u.id = ur.userId
GROUP BY u.id, u.firstName, u.lastName, u.username, u.email, u.password, u.createdAt, u.updatedAt
ORDER BY u.createdAt ASC
`.trim();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Query D1 database and return user rows
 */
function queryD1Users(): D1UserRow[] {
  const response = runD1Query<D1UserRow>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: USERS_QUERY,
  });

  console.log(`✓ Found ${response.results.length} users`);

  if (response.results.length === 0) {
    console.warn("⚠ Warning: No users found in database");
  }

  return response.results;
}

/**
 * Transform D1 user row to Convex format
 */
function transformUser(d1User: D1UserRow, index: number): ConvexUser {
  // Parse and validate roles
  let rolesArray: ValidRole[];

  if (d1User.roles) {
    // Split pipe-delimited string and filter valid roles
    const parsedRoles = d1User.roles
      .split("|")
      .filter((r) => CONFIG.validRoles.includes(r as ValidRole)) as ValidRole[];

    if (parsedRoles.length === 0) {
      console.warn(
        `  ⚠ User '${d1User.username}' has invalid roles, defaulting to ${CONFIG.defaultRole}`
      );
      rolesArray = [CONFIG.defaultRole];
    } else if (parsedRoles.length < d1User.roles.split("|").length) {
      console.warn(
        `  ⚠ User '${d1User.username}' has some invalid roles, filtered to: ${parsedRoles.join(", ")}`
      );
      rolesArray = parsedRoles;
    } else {
      rolesArray = parsedRoles;
    }
  } else {
    console.warn(
      `  ⚠ User '${d1User.username}' has no roles, defaulting to ${CONFIG.defaultRole}`
    );
    rolesArray = [CONFIG.defaultRole];
  }

  // Convert timestamps
  const createdAt = Date.parse(d1User.createdAt);
  const updatedAt = Date.parse(d1User.updatedAt);

  // Validate timestamps
  if (isNaN(createdAt)) {
    console.warn(
      `  ⚠ User '${d1User.username}' has invalid createdAt timestamp, using current time`
    );
  }
  if (isNaN(updatedAt)) {
    console.warn(
      `  ⚠ User '${d1User.username}' has invalid updatedAt timestamp, using current time`
    );
  }

  return {
    firstName: d1User.firstName,
    lastName: d1User.lastName,
    username: d1User.username,
    email: d1User.email,
    passwordHash: d1User.password,
    roles: rolesArray,
    createdAt: isNaN(createdAt) ? Date.now() : createdAt,
    updatedAt: isNaN(updatedAt) ? Date.now() : updatedAt,
  };
}

/**
 * Validate transformed users for common issues
 */
function validateUsers(users: ConvexUser[]): void {
  const usernames = new Set<string>();
  const emails = new Set<string>();
  const duplicateUsernames: string[] = [];
  const duplicateEmails: string[] = [];

  for (const user of users) {
    // Check for duplicate usernames
    if (usernames.has(user.username)) {
      duplicateUsernames.push(user.username);
    } else {
      usernames.add(user.username);
    }

    // Check for duplicate emails
    if (emails.has(user.email)) {
      duplicateEmails.push(user.email);
    } else {
      emails.add(user.email);
    }

    // Validate timestamp ranges (should be between 2000 and now + 1 year)
    const minTimestamp = new Date("2000-01-01").getTime();
    const maxTimestamp = Date.now() + 365 * 24 * 60 * 60 * 1000;

    if (user.createdAt < minTimestamp || user.createdAt > maxTimestamp) {
      console.warn(
        `  ⚠ User '${user.username}' has suspicious createdAt timestamp: ${new Date(user.createdAt).toISOString()}`
      );
    }

    if (user.updatedAt < minTimestamp || user.updatedAt > maxTimestamp) {
      console.warn(
        `  ⚠ User '${user.username}' has suspicious updatedAt timestamp: ${new Date(user.updatedAt).toISOString()}`
      );
    }
  }

  // Report validation results
  if (duplicateUsernames.length > 0) {
    console.warn(
      `  ⚠ Found ${duplicateUsernames.length} duplicate username(s): ${duplicateUsernames.join(", ")}`
    );
    console.warn("    Convex import may fail for duplicates");
  } else {
    console.log("✓ All usernames are unique");
  }

  if (duplicateEmails.length > 0) {
    console.warn(
      `  ⚠ Found ${duplicateEmails.length} duplicate email(s): ${duplicateEmails.join(", ")}`
    );
    console.warn("    Convex import may fail for duplicates");
  } else {
    console.log("✓ All emails are unique");
  }

  console.log("✓ All timestamps validated");
}

/**
 * Write users array to JSON file
 */
function writeJsonFile(users: ConvexUser[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, users);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

/**
 * Print summary statistics
 */
function printSummary(users: ConvexUser[]): void {
  const roleCount: Record<ValidRole, number> = {
    ADMIN: 0,
    TEACHER: 0,
    STUDENT: 0,
    PARENT: 0,
  };

  // Count roles (users can have multiple roles)
  for (const user of users) {
    for (const role of user.roles) {
      roleCount[role]++;
    }
  }

  console.log(`\n  Total users exported: ${users.length}`);
  console.log(`  ADMIN: ${roleCount.ADMIN}`);
  console.log(`  TEACHER: ${roleCount.TEACHER}`);
  console.log(`  STUDENT: ${roleCount.STUDENT}`);
  console.log(`  PARENT: ${roleCount.PARENT}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    `  cd .. && npx convex import --table users backend/exports/convex-users-export.json\n`
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex User Export Script\n");
  console.log("================================\n");

  try {
    // Step 1: Check authentication
    console.log("[1/6] Checking Wrangler authentication...");
    checkWranglerAuth();

    // Step 2: Query D1
    console.log("\n[2/6] Querying production D1 database...");
    const d1Users = queryD1Users();

    // Step 3: Transform data
    console.log("\n[3/6] Transforming user data...");
    const convexUsers = d1Users.map(transformUser);
    console.log(`✓ Transformed ${convexUsers.length} users`);

    // Step 4: Validate
    console.log("\n[4/6] Validating data...");
    validateUsers(convexUsers);

    // Step 5: Write file
    console.log("\n[5/6] Writing to file...");
    writeJsonFile(convexUsers);

    // Step 6: Summary
    console.log("\n[6/6] Summary:");
    printSummary(convexUsers);

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Export failed:", error.message);
    process.exit(1);
  }
}

// Execute if run directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
