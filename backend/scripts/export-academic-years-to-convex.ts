#!/usr/bin/env ts-node

/**
 * Export academic years from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Academic years are stored in PiniaState table as JSON blob
 *
 * Usage:
 *   cd backend
 *   npm run export:academic-years
 *
 * Or directly:
 *   npx ts-node scripts/export-academic-years-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-academic-years-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table academicYears backend/exports/convex-academic-years-export.json
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  checkWranglerAuth,
  parsePiniaState,
  runD1Query,
  writeJsonFile as writeJsonFileToDisk,
} from "./lib/d1.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Type Definitions
// ============================================================================

interface D1AcademicYearRow {
  id?: string;
  name?: string | null;
  startYear?: number | string | null;
  endYear?: number | string | null;
  isActive?: boolean | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1AcademicYearPiniaState {
  academicYears: D1AcademicYearRow[];
}

interface ConvexAcademicYear {
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface ConvexAcademicYearWithLegacyId extends ConvexAcademicYear {
  legacyId: string; // D1 ID for mapping purposes
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(
    __dirname,
    "..",
    "exports",
    "convex-academic-years-export.json"
  ),
};

const ACADEMIC_YEARS_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'academicYear'
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

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function queryD1AcademicYears(): D1AcademicYearRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: ACADEMIC_YEARS_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error("No PiniaState record found for storeId='academicYear'");
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const state = parsePiniaState<D1AcademicYearPiniaState>(stateJson);
  const years = state?.academicYears;

  if (!years || !Array.isArray(years)) {
    throw new Error("Invalid PiniaState structure: expected academicYears array");
  }

  console.log(`✓ Found ${years.length} academic years in PiniaState`);

  if (years.length === 0) {
    console.warn("⚠ Warning: No academic years found in PiniaState");
  }

  return years;
}

function transformAcademicYear(d1Year: D1AcademicYearRow): ConvexAcademicYearWithLegacyId {
  const startYear = normalizeNumber(d1Year.startYear) ?? 0;
  const endYear = normalizeNumber(d1Year.endYear) ?? startYear;
  const name =
    normalizeString(d1Year.name) ||
    (startYear ? `${startYear}-${endYear}` : "Academic Year");

  const createdAt = toEpochMillis(d1Year.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Year.updatedAt) ?? createdAt;

  const legacyId = normalizeString(d1Year.id) || `legacy-${startYear}`;

  return {
    name,
    startYear,
    endYear,
    isActive: Boolean(d1Year.isActive),
    createdAt,
    updatedAt,
    legacyId,
  };
}

function validateAcademicYears(years: ConvexAcademicYearWithLegacyId[]): void {
  const stats = {
    missingName: 0,
    missingStart: 0,
    missingEnd: 0,
    activeCount: 0,
  };

  for (const year of years) {
    if (!year.name) stats.missingName++;
    if (!year.startYear) stats.missingStart++;
    if (!year.endYear) stats.missingEnd++;
    if (year.isActive) stats.activeCount++;
  }

  if (stats.missingName > 0) {
    console.warn(`  ⚠ ${stats.missingName} academic year(s) missing name`);
  }

  if (stats.missingStart > 0) {
    console.warn(`  ⚠ ${stats.missingStart} academic year(s) missing startYear`);
  }

  if (stats.missingEnd > 0) {
    console.warn(`  ⚠ ${stats.missingEnd} academic year(s) missing endYear`);
  }

  if (stats.activeCount === 0) {
    console.warn("  ⚠ No academic year marked as active");
  }

  console.log("✓ All required fields validated");
}

function writeJsonFile(years: ConvexAcademicYearWithLegacyId[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, years);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

function printSummary(years: ConvexAcademicYearWithLegacyId[]): void {
  const active = years.filter((y) => y.isActive).length;
  console.log(`\n  Total academic years exported: ${years.length}`);
  console.log(`  Active years: ${active}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table academicYears backend/exports/convex-academic-years-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Academic Years Export Script\n");
  console.log("=========================================\n");

  try {
    console.log("[1/5] Checking Wrangler authentication...");
    checkWranglerAuth();

    console.log("\n[2/5] Querying production D1 database (PiniaState)...");
    const d1Years = queryD1AcademicYears();

    console.log("\n[3/5] Transforming academic year data...");
    const convexYears = d1Years.map(transformAcademicYear);
    console.log(`✓ Transformed ${convexYears.length} academic years`);

    console.log("\n[4/5] Validating data...");
    validateAcademicYears(convexYears);

    console.log("\n[5/5] Writing to file...");
    writeJsonFile(convexYears);
    printSummary(convexYears);

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Export failed:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
