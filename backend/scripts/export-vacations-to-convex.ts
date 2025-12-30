#!/usr/bin/env ts-node

/**
 * Export vacations from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Vacations are stored in PiniaState table as JSON blob
 *
 * Usage:
 *   cd backend
 *   npm run export:vacations
 *
 * Or directly:
 *   npx ts-node scripts/export-vacations-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-vacations-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table vacations backend/exports/convex-vacations-export.json
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  checkWranglerAuth,
  parsePiniaState,
  runD1Query,
  writeJsonFile as writeJsonFileToDisk,
} from "./lib/d1.ts";
import { buildAcademicYearIdMap } from "./lib/academicYearMap.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Type Definitions
// ============================================================================

interface D1VacationRow {
  id?: string;
  shortName?: string | null;
  fullName?: string | null;
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  academicYearId?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1VacationPiniaState {
  vacations: D1VacationRow[];
}

interface ConvexVacation {
  shortName: string;
  fullName: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(__dirname, "..", "exports", "convex-vacations-export.json"),
};

const VACATIONS_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'vacation'
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

function queryD1Vacations(): D1VacationRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: VACATIONS_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error("No PiniaState record found for storeId='vacation'");
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const state = parsePiniaState<D1VacationPiniaState>(stateJson);
  const vacations = state?.vacations;

  if (!vacations || !Array.isArray(vacations)) {
    throw new Error("Invalid PiniaState structure: expected vacations array");
  }

  console.log(`✓ Found ${vacations.length} vacations in PiniaState`);

  if (vacations.length === 0) {
    console.warn("⚠ Warning: No vacations found in PiniaState");
  }

  return vacations;
}

function transformVacation(
  d1Vacation: D1VacationRow,
  academicYearIdMap: Map<string, string>,
  defaultAcademicYearId: string | null
): ConvexVacation {
  const legacyName = normalizeString(d1Vacation.name);
  const shortName = normalizeString(d1Vacation.shortName) || legacyName;
  const fullName = normalizeString(d1Vacation.fullName) || shortName;

  const createdAt = toEpochMillis(d1Vacation.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Vacation.updatedAt) ?? createdAt;
  const legacyAcademicYearId = normalizeString(d1Vacation.academicYearId);
  const academicYearId =
    academicYearIdMap.get(legacyAcademicYearId) ||
    defaultAcademicYearId ||
    "";

  return {
    shortName,
    fullName,
    academicYearId,
    startDate: normalizeString(d1Vacation.startDate),
    endDate: normalizeString(d1Vacation.endDate),
    createdAt,
    updatedAt,
  };
}

function validateVacations(vacations: ConvexVacation[]): void {
  const stats = {
    missingNames: 0,
    missingDates: 0,
    missingAcademicYear: 0,
  };

  for (const vacation of vacations) {
    if (!vacation.shortName || !vacation.fullName) stats.missingNames++;
    if (!vacation.startDate || !vacation.endDate) stats.missingDates++;
    if (!vacation.academicYearId) stats.missingAcademicYear++;
  }

  if (stats.missingNames > 0) {
    console.warn(`  ⚠ ${stats.missingNames} vacation(s) missing names`);
  }

  if (stats.missingDates > 0) {
    console.warn(`  ⚠ ${stats.missingDates} vacation(s) missing dates`);
  }

  if (stats.missingAcademicYear > 0) {
    console.warn(
      `  ⚠ ${stats.missingAcademicYear} vacation(s) missing academicYearId`
    );
  }

  console.log("✓ All required fields validated");
}

function writeJsonFile(vacations: ConvexVacation[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, vacations);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

function printSummary(vacations: ConvexVacation[]): void {
  console.log(`\n  Total vacations exported: ${vacations.length}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table vacations backend/exports/convex-vacations-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Vacations Export Script\n");
  console.log("====================================\n");

  try {
    console.log("[1/5] Checking Wrangler authentication...");
    checkWranglerAuth();

    console.log("\n[2/6] Loading academic year defaults...");
    const { idMap, defaultConvexAcademicYearId } = buildAcademicYearIdMap(CONFIG);
    if (defaultConvexAcademicYearId) {
      console.log(
        `✓ Default academicYearId resolved: ${defaultConvexAcademicYearId}`
      );
    } else {
      console.warn("⚠ No default academicYearId found");
    }

    console.log("\n[3/6] Querying production D1 database (PiniaState)...");
    const d1Vacations = queryD1Vacations();

    console.log("\n[4/6] Transforming vacation data...");
    const convexVacations = d1Vacations.map((vacation) =>
      transformVacation(vacation, idMap, defaultConvexAcademicYearId)
    );
    console.log(`✓ Transformed ${convexVacations.length} vacations`);

    console.log("\n[5/6] Validating data...");
    validateVacations(convexVacations);

    console.log("\n[6/6] Writing to file...");
    writeJsonFile(convexVacations);
    printSummary(convexVacations);

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Export failed:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
