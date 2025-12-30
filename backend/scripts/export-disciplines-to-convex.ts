#!/usr/bin/env ts-node

/**
 * Export disciplines from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Disciplines are stored in PiniaState table as JSON blob, not in a dedicated table
 *
 * Usage:
 *   cd backend
 *   npm run export:disciplines
 *
 * Or directly:
 *   npx ts-node scripts/export-disciplines-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-disciplines-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table disciplines backend/exports/convex-disciplines-export.json
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
 * Discipline data stored in D1 PiniaState JSON blob
 */
interface D1DisciplineRow {
  id?: string;
  moduleIndex?: string | null;
  moduleName?: string | null;
  learningOutcome?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
  isHighlighted?: boolean | null;
}

/**
 * PiniaState structure for disciplines
 */
interface D1DisciplinePiniaState {
  disciplines: D1DisciplineRow[];
}

/**
 * Convex discipline record (matches convex/schema.ts)
 */
interface ConvexDiscipline {
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  createdAt: number; // milliseconds since epoch
  updatedAt: number; // milliseconds since epoch
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(__dirname, "..", "exports", "convex-disciplines-export.json"),
};

// ============================================================================
// SQL Query
// ============================================================================

const DISCIPLINES_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'discipline'
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
 * Query D1 database and return discipline rows from PiniaState
 */
function queryD1Disciplines(): D1DisciplineRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: DISCIPLINES_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error("No PiniaState record found for storeId='discipline'");
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const piniaState = parsePiniaState<D1DisciplinePiniaState>(stateJson);

  if (!piniaState.disciplines || !Array.isArray(piniaState.disciplines)) {
    throw new Error("Invalid PiniaState structure: expected disciplines array");
  }

  const disciplines = piniaState.disciplines;
  console.log(`✓ Found ${disciplines.length} disciplines in PiniaState`);

  if (disciplines.length === 0) {
    console.warn("⚠ Warning: No disciplines found in PiniaState");
  }

  return disciplines;
}

/**
 * Transform D1 discipline row to Convex format
 */
function transformDiscipline(d1Discipline: D1DisciplineRow): ConvexDiscipline {
  const moduleIndex = normalizeString(d1Discipline.moduleIndex);
  const moduleName = normalizeString(d1Discipline.moduleName);
  const learningOutcome = normalizeString(d1Discipline.learningOutcome);

  const createdAt = toEpochMillis(d1Discipline.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Discipline.updatedAt) ?? createdAt;

  return {
    moduleIndex,
    moduleName,
    learningOutcome,
    createdAt,
    updatedAt,
  };
}

/**
 * Validate transformed disciplines for common issues
 */
function validateDisciplines(disciplines: ConvexDiscipline[]): void {
  const seen = new Set<string>();

  const stats = {
    missingModuleIndex: 0,
    missingModuleName: 0,
    missingLearningOutcome: 0,
    duplicateRows: 0,
  };

  for (const discipline of disciplines) {
    if (!discipline.moduleIndex) {
      stats.missingModuleIndex++;
    }

    if (!discipline.moduleName) {
      stats.missingModuleName++;
    }

    if (!discipline.learningOutcome) {
      stats.missingLearningOutcome++;
    }

    const signature = `${discipline.moduleIndex}|${discipline.moduleName}|${discipline.learningOutcome}`;
    if (seen.has(signature)) {
      stats.duplicateRows++;
    } else {
      seen.add(signature);
    }
  }

  if (stats.duplicateRows > 0) {
    console.warn(`  ⚠ Found ${stats.duplicateRows} duplicate discipline row(s)`);
  } else {
    console.log("✓ No duplicate discipline rows detected");
  }

  if (stats.missingModuleIndex > 0) {
    console.warn(`  ⚠ ${stats.missingModuleIndex} discipline(s) missing moduleIndex`);
  }

  if (stats.missingModuleName > 0) {
    console.warn(`  ⚠ ${stats.missingModuleName} discipline(s) missing moduleName`);
  }

  if (stats.missingLearningOutcome > 0) {
    console.warn(
      `  ⚠ ${stats.missingLearningOutcome} discipline(s) missing learningOutcome`
    );
  }

  console.log("✓ All required fields validated");
}

/**
 * Write disciplines array to JSON file
 */
function writeJsonFile(disciplines: ConvexDiscipline[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, disciplines);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

/**
 * Print summary statistics
 */
function printSummary(disciplines: ConvexDiscipline[]): void {
  const withIndex = disciplines.filter((d) => d.moduleIndex).length;
  const withOutcome = disciplines.filter((d) => d.learningOutcome).length;

  console.log(`\n  Total disciplines exported: ${disciplines.length}`);
  console.log(`  With moduleIndex: ${withIndex}`);
  console.log(`  With learningOutcome: ${withOutcome}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table disciplines backend/exports/convex-disciplines-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Discipline Export Script\n");
  console.log("=====================================\n");

  try {
    // Step 1: Check authentication
    console.log("[1/6] Checking Wrangler authentication...");
    checkWranglerAuth();

    // Step 2: Query D1
    console.log("\n[2/6] Querying production D1 database (PiniaState)...");
    const d1Disciplines = queryD1Disciplines();

    // Step 3: Transform data
    console.log("\n[3/6] Transforming discipline data...");
    const convexDisciplines = d1Disciplines.map(transformDiscipline);
    console.log(`✓ Transformed ${convexDisciplines.length} disciplines`);

    // Step 4: Validate
    console.log("\n[4/6] Validating data...");
    validateDisciplines(convexDisciplines);

    // Step 5: Write file
    console.log("\n[5/6] Writing to file...");
    writeJsonFile(convexDisciplines);

    // Step 6: Summary
    console.log("\n[6/6] Summary:");
    printSummary(convexDisciplines);

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
