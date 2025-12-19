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

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
 * D1 query response wrapper
 */
interface D1QueryResponse {
  results: D1UserRow[];
  success: boolean;
  meta?: {
    served_by?: string;
    duration?: number;
    changes?: number;
    last_row_id?: number;
    changed_db?: boolean;
    size_after?: number;
    rows_read?: number;
    rows_written?: number;
  };
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
 * Check if wrangler is authenticated
 * Throws error if not authenticated
 */
function checkWranglerAuth(): void {
  try {
    const result = execSync("npx wrangler whoami", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (result.includes("You are logged in")) {
      console.log("✓ Authenticated with Wrangler");
    } else {
      throw new Error("Wrangler authentication check failed");
    }
  } catch (error: any) {
    console.error("✗ Wrangler authentication failed");
    console.error("\nPlease re-authenticate with:");
    console.error("  npx wrangler login");
    console.error("\nOr use API token authentication:");
    console.error("  export CLOUDFLARE_API_TOKEN=your_token");
    console.error("  export CLOUDFLARE_ACCOUNT_ID=your_account_id\n");
    throw new Error("Not authenticated with Wrangler");
  }
}

/**
 * Query D1 database and return user rows
 */
function queryD1Users(): D1UserRow[] {
  try {
    // Execute query via wrangler with account ID
    const command = `npx wrangler d1 execute ${CONFIG.databaseName} --remote --json --command="${USERS_QUERY.replace(/"/g, '\\"')}"`;

    const output = execSync(command, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large results
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: CONFIG.accountId, // Set account ID
      },
    });

    // Debug: log raw output
    if (process.env.DEBUG) {
      console.log("Raw wrangler output:", output);
    }

    // Parse JSON response - wrangler returns an array with response object inside
    const parsed = JSON.parse(output);
    const response: D1QueryResponse = Array.isArray(parsed) ? parsed[0] : parsed;

    if (!response.success) {
      throw new Error("D1 query failed");
    }

    if (!Array.isArray(response.results)) {
      throw new Error("Invalid response format from D1");
    }

    console.log(`✓ Found ${response.results.length} users`);

    if (response.results.length === 0) {
      console.warn("⚠ Warning: No users found in database");
    }

    return response.results;
  } catch (error: any) {
    console.error("✗ Failed to query D1 database");

    // Show the actual error output
    if (error.stderr) {
      console.error("\nWrangler error output:");
      console.error(error.stderr.toString());
    }

    if (error.stdout) {
      console.error("\nWrangler stdout:");
      console.error(error.stdout.toString());
    }

    // Check for authentication errors
    if (error.stdout?.includes("Authentication error") || error.stdout?.includes("code: 10000")) {
      console.error("\n⚠ Authentication error detected!");
      console.error("\nPlease re-authenticate with:");
      console.error("  npx wrangler login");
      console.error("\nIf that doesn't work, try using API token authentication:");
      console.error("  1. Get your API token from: https://dash.cloudflare.com/profile/api-tokens");
      console.error("  2. Create a token with 'D1 Edit' permissions");
      console.error("  3. Set environment variables:");
      console.error("     export CLOUDFLARE_API_TOKEN=your_token");
      console.error("     export CLOUDFLARE_ACCOUNT_ID=1baf07e2bf54af133428fea840266f45");
      console.error("  4. Run the script again");
    }

    if (error.message.includes("JSON")) {
      console.error("\nError parsing JSON response from wrangler");
    }

    throw error;
  }
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
    const json = JSON.stringify(users, null, 2);
    writeFileSync(CONFIG.outputFile, json, "utf-8");

    const fileSizeKB = (json.length / 1024).toFixed(1);
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
