#!/usr/bin/env ts-node

/**
 * Export final controls from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Final controls are stored in PiniaState table as JSON blob
 *
 * Usage:
 *   cd backend
 *   npm run export:final-controls
 *
 * Or directly:
 *   npx ts-node scripts/export-final-controls-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-final-controls-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table finalControls backend/exports/convex-final-controls-export.json
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

interface D1FinalControlRow {
  id?: string;
  name?: string | null;
  shortName?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1FinalControlPiniaState {
  finalControls: D1FinalControlRow[];
}

interface ConvexFinalControl {
  name: string;
  shortName: string;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(__dirname, "..", "exports", "convex-final-controls-export.json"),
};

const FINAL_CONTROLS_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'finalControl'
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

function queryD1FinalControls(): D1FinalControlRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: FINAL_CONTROLS_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error("No PiniaState record found for storeId='finalControl'");
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const state = parsePiniaState<D1FinalControlPiniaState>(stateJson);
  const controls = state?.finalControls;

  if (!controls || !Array.isArray(controls)) {
    throw new Error("Invalid PiniaState structure: expected finalControls array");
  }

  console.log(`✓ Found ${controls.length} final controls in PiniaState`);

  if (controls.length === 0) {
    console.warn("⚠ Warning: No final controls found in PiniaState");
  }

  return controls;
}

function transformFinalControl(d1Control: D1FinalControlRow): ConvexFinalControl {
  const name = normalizeString(d1Control.name);
  const shortName = normalizeString(d1Control.shortName);

  const createdAt = toEpochMillis(d1Control.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Control.updatedAt) ?? createdAt;

  return {
    name,
    shortName,
    createdAt,
    updatedAt,
  };
}

function validateFinalControls(controls: ConvexFinalControl[]): void {
  const stats = {
    missingName: 0,
    missingShortName: 0,
  };

  for (const control of controls) {
    if (!control.name) stats.missingName++;
    if (!control.shortName) stats.missingShortName++;
  }

  if (stats.missingName > 0) {
    console.warn(`  ⚠ ${stats.missingName} control(s) missing name`);
  }

  if (stats.missingShortName > 0) {
    console.warn(`  ⚠ ${stats.missingShortName} control(s) missing shortName`);
  }

  console.log("✓ All required fields validated");
}

function writeJsonFile(controls: ConvexFinalControl[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, controls);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

function printSummary(controls: ConvexFinalControl[]): void {
  console.log(`\n  Total final controls exported: ${controls.length}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table finalControls backend/exports/convex-final-controls-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Final Controls Export Script\n");
  console.log("=========================================\n");

  try {
    console.log("[1/5] Checking Wrangler authentication...");
    checkWranglerAuth();

    console.log("\n[2/5] Querying production D1 database (PiniaState)...");
    const d1Controls = queryD1FinalControls();

    console.log("\n[3/5] Transforming final control data...");
    const convexControls = d1Controls.map(transformFinalControl);
    console.log(`✓ Transformed ${convexControls.length} final controls`);

    console.log("\n[4/5] Validating data...");
    validateFinalControls(convexControls);

    console.log("\n[5/5] Writing to file...");
    writeJsonFile(convexControls);
    printSummary(convexControls);

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Export failed:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
