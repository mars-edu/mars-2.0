#!/usr/bin/env ts-node

/**
 * Export specialties from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Specialties are stored in PiniaState table as JSON blob, not in a dedicated table
 *
 * Usage:
 *   cd backend
 *   npm run export:specialties
 *
 * Or directly:
 *   npx ts-node scripts/export-specialties-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-specialties-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table specialties backend/exports/convex-specialties-export.json
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  checkWranglerAuth,
  parsePiniaState,
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
 * Specialty data stored in D1 PiniaState JSON blob
 */
interface D1SpecialtyRow {
  id: string;
  name: string;
  code: string;
  codeName: string;
  details?: string | null;
  hasModule?: boolean | null;
  isHighlighted?: boolean | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

/**
 * Convex specialty record (matches convex/schema.ts)
 */
interface ConvexSpecialty {
  legacyId?: string;
  name: string;
  code: string;
  codeName: string;
  details?: string;
  hasModule?: boolean;
  isHighlighted?: boolean;
  createdAt: number; // milliseconds since epoch
  updatedAt: number; // milliseconds since epoch
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(__dirname, "..", "exports", "convex-specialties-export.json"),
};

// ============================================================================
// SQL Query
// ============================================================================

const SPECIALTIES_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'specialty'
`.trim();

// ============================================================================
// Helper Functions
// ============================================================================

function toEpochMillis(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Query D1 database and return specialty rows from PiniaState
 */
function queryD1Specialties(): D1SpecialtyRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: SPECIALTIES_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error("No PiniaState record found for storeId='specialty'");
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const state = parsePiniaState<{ specialties: D1SpecialtyRow[] }>(stateJson);
  const specialties = state?.specialties;

  if (!specialties || !Array.isArray(specialties)) {
    throw new Error("Invalid PiniaState structure: expected specialties array");
  }

  console.log(`✓ Found ${specialties.length} specialties in PiniaState`);

  if (specialties.length === 0) {
    console.warn("⚠ Warning: No specialties found in PiniaState");
  }

  return specialties as D1SpecialtyRow[];
}

/**
 * Transform D1 specialty row to Convex format
 */
function transformSpecialty(d1Specialty: D1SpecialtyRow): ConvexSpecialty {
  const legacyId = normalizeString(d1Specialty.id);
  const name = normalizeString(d1Specialty.name);
  const code = normalizeString(d1Specialty.code);
  const codeName = normalizeString(d1Specialty.codeName);
  const details = normalizeString(d1Specialty.details);

  const createdAt = toEpochMillis(d1Specialty.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Specialty.updatedAt) ?? createdAt;

  return {
    legacyId: legacyId ? legacyId : undefined,
    name,
    code,
    codeName,
    details: details ? details : undefined,
    hasModule:
      typeof d1Specialty.hasModule === "boolean" ? d1Specialty.hasModule : undefined,
    isHighlighted:
      typeof d1Specialty.isHighlighted === "boolean"
        ? d1Specialty.isHighlighted
        : undefined,
    createdAt,
    updatedAt,
  };
}

/**
 * Validate transformed specialties for common issues
 */
function validateSpecialties(specialties: ConvexSpecialty[]): void {
  const codeSet = new Set<string>();
  const nameSet = new Set<string>();

  const stats = {
    missingName: 0,
    missingCode: 0,
    missingCodeName: 0,
    duplicateCode: 0,
    duplicateName: 0,
  };

  for (const specialty of specialties) {
    if (!specialty.name) {
      stats.missingName++;
    }

    if (!specialty.code) {
      stats.missingCode++;
    }

    if (!specialty.codeName) {
      stats.missingCodeName++;
    }

    if (specialty.code) {
      if (codeSet.has(specialty.code)) {
        stats.duplicateCode++;
      } else {
        codeSet.add(specialty.code);
      }
    }

    if (specialty.name) {
      if (nameSet.has(specialty.name)) {
        stats.duplicateName++;
      } else {
        nameSet.add(specialty.name);
      }
    }
  }

  if (stats.duplicateCode > 0) {
    console.warn(`  ⚠ Found ${stats.duplicateCode} duplicate code(s)`);
  } else {
    console.log("✓ No duplicate specialty codes detected");
  }

  if (stats.duplicateName > 0) {
    console.warn(`  ⚠ Found ${stats.duplicateName} duplicate name(s)`);
  } else {
    console.log("✓ No duplicate specialty names detected");
  }

  if (stats.missingName > 0) {
    console.warn(`  ⚠ ${stats.missingName} specialty(ies) have missing name`);
  }

  if (stats.missingCode > 0) {
    console.warn(`  ⚠ ${stats.missingCode} specialty(ies) have missing code`);
  }

  if (stats.missingCodeName > 0) {
    console.warn(`  ⚠ ${stats.missingCodeName} specialty(ies) have missing codeName`);
  }

  console.log("✓ All required fields validated");
}

/**
 * Write specialties array to JSON file
 */
function writeJsonFile(specialties: ConvexSpecialty[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, specialties);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

/**
 * Print summary statistics
 */
function printSummary(specialties: ConvexSpecialty[]): void {
  const withDetails = specialties.filter((s) => s.details && s.details.length > 0).length;
  const withModules = specialties.filter((s) => s.hasModule).length;
  const highlighted = specialties.filter((s) => s.isHighlighted).length;

  console.log(`\n  Total specialties exported: ${specialties.length}`);
  console.log(`  With details: ${withDetails}`);
  console.log(`  With modules: ${withModules}`);
  console.log(`  Highlighted: ${highlighted}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table specialties backend/exports/convex-specialties-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Specialty Export Script\n");
  console.log("=====================================\n");

  try {
    // Step 1: Check authentication
    console.log("[1/6] Checking Wrangler authentication...");
    checkWranglerAuth();

    // Step 2: Query D1
    console.log("\n[2/6] Querying production D1 database (PiniaState)...");
    const d1Specialties = queryD1Specialties();

    // Step 3: Transform data
    console.log("\n[3/6] Transforming specialty data...");
    const convexSpecialties = d1Specialties.map(transformSpecialty);
    console.log(`✓ Transformed ${convexSpecialties.length} specialties`);

    // Step 4: Validate
    console.log("\n[4/6] Validating data...");
    validateSpecialties(convexSpecialties);

    // Step 5: Write file
    console.log("\n[5/6] Writing to file...");
    writeJsonFile(convexSpecialties);

    // Step 6: Summary
    console.log("\n[6/6] Summary:");
    printSummary(convexSpecialties);

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
