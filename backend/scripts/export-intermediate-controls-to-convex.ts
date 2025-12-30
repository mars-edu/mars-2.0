#!/usr/bin/env ts-node

/**
 * Export intermediate controls from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Intermediate controls are stored in PiniaState table as JSON blob
 *
 * Usage:
 *   cd backend
 *   npm run export:intermediate-controls
 *
 * Or directly:
 *   npx ts-node scripts/export-intermediate-controls-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-intermediate-controls-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table intermediateControls backend/exports/convex-intermediate-controls-export.json
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

interface D1IntermediateControlRow {
  id?: string;
  name?: string | null;
  shortName?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1IntermediateControlPiniaState {
  intermediateControls: D1IntermediateControlRow[];
}

interface ConvexIntermediateControl {
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
  outputFile: join(
    __dirname,
    "..",
    "exports",
    "convex-intermediate-controls-export.json"
  ),
};

const INTERMEDIATE_CONTROLS_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'intermediateControl'
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

function queryD1IntermediateControls(): D1IntermediateControlRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: INTERMEDIATE_CONTROLS_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error(
      "No PiniaState record found for storeId='intermediateControl'"
    );
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const state = parsePiniaState<D1IntermediateControlPiniaState>(stateJson);
  const controls = state?.intermediateControls;

  if (!controls || !Array.isArray(controls)) {
    throw new Error(
      "Invalid PiniaState structure: expected intermediateControls array"
    );
  }

  console.log(`✓ Found ${controls.length} intermediate controls in PiniaState`);

  if (controls.length === 0) {
    console.warn("⚠ Warning: No intermediate controls found in PiniaState");
  }

  return controls;
}

function transformIntermediateControl(
  d1Control: D1IntermediateControlRow
): ConvexIntermediateControl {
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

function validateIntermediateControls(controls: ConvexIntermediateControl[]): void {
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

function writeJsonFile(controls: ConvexIntermediateControl[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, controls);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

function printSummary(controls: ConvexIntermediateControl[]): void {
  console.log(`\n  Total intermediate controls exported: ${controls.length}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table intermediateControls backend/exports/convex-intermediate-controls-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Intermediate Controls Export Script\n");
  console.log("===============================================\n");

  try {
    console.log("[1/5] Checking Wrangler authentication...");
    checkWranglerAuth();

    console.log("\n[2/5] Querying production D1 database (PiniaState)...");
    const d1Controls = queryD1IntermediateControls();

    console.log("\n[3/5] Transforming intermediate control data...");
    const convexControls = d1Controls.map(transformIntermediateControl);
    console.log(`✓ Transformed ${convexControls.length} intermediate controls`);

    console.log("\n[4/5] Validating data...");
    validateIntermediateControls(convexControls);

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
