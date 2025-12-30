#!/usr/bin/env ts-node

/**
 * Export scheduled intermediate controls from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Scheduled intermediate controls are stored in PiniaState table as JSON blob
 *
 * Usage:
 *   cd backend
 *   npm run export:scheduled-intermediate-controls
 *
 * Or directly:
 *   npx ts-node scripts/export-scheduled-intermediate-controls-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-scheduled-intermediate-controls-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table scheduledIntermediateControls backend/exports/convex-scheduled-intermediate-controls-export.json
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

interface D1ScheduledIntermediateControlRow {
  id?: string;
  academicYearId?: string | null;
  intermediateControlId?: string | null;
  controlId?: string | null;
  class9Id?: string | null;
  semesterId?: string | null;
  shortName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  date?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1ScheduledIntermediateControlPiniaState {
  scheduledIntermediateControls: D1ScheduledIntermediateControlRow[];
}

interface ConvexScheduledIntermediateControl {
  intermediateControlId: string;
  class9Id: string;
  semesterId: string;
  date?: string;
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
    "convex-scheduled-intermediate-controls-export.json"
  ),
};

const SCHEDULED_INTERMEDIATE_CONTROLS_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'scheduledIntermediateControl'
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

function queryD1ScheduledIntermediateControls(): D1ScheduledIntermediateControlRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: SCHEDULED_INTERMEDIATE_CONTROLS_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error(
      "No PiniaState record found for storeId='scheduledIntermediateControl'"
    );
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const state =
    parsePiniaState<D1ScheduledIntermediateControlPiniaState>(stateJson);
  const controls = state?.scheduledIntermediateControls;

  if (!controls || !Array.isArray(controls)) {
    throw new Error(
      "Invalid PiniaState structure: expected scheduledIntermediateControls array"
    );
  }

  console.log(
    `✓ Found ${controls.length} scheduled intermediate controls in PiniaState`
  );

  if (controls.length === 0) {
    console.warn(
      "⚠ Warning: No scheduled intermediate controls found in PiniaState"
    );
  }

  return controls;
}

function transformScheduledIntermediateControl(
  d1Control: D1ScheduledIntermediateControlRow
): ConvexScheduledIntermediateControl {
  const intermediateControlId =
    normalizeString(d1Control.intermediateControlId) ||
    normalizeString(d1Control.controlId);
  const class9Id = normalizeString(d1Control.class9Id);
  const semesterId = normalizeString(d1Control.semesterId);
  const date =
    normalizeString(d1Control.date) ||
    normalizeString(d1Control.startDate) ||
    normalizeString(d1Control.endDate);

  const createdAt = toEpochMillis(d1Control.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Control.updatedAt) ?? createdAt;

  return {
    intermediateControlId,
    class9Id,
    semesterId,
    date: date || undefined,
    createdAt,
    updatedAt,
  };
}

function validateScheduledIntermediateControls(
  controls: ConvexScheduledIntermediateControl[]
): void {
  const stats = {
    missingControlId: 0,
    missingClass9Id: 0,
    missingSemesterId: 0,
  };

  for (const control of controls) {
    if (!control.intermediateControlId) stats.missingControlId++;
    if (!control.class9Id) stats.missingClass9Id++;
    if (!control.semesterId) stats.missingSemesterId++;
  }

  if (stats.missingControlId > 0) {
    console.warn(
      `  ⚠ ${stats.missingControlId} scheduled intermediate control(s) missing intermediateControlId`
    );
  }

  if (stats.missingClass9Id > 0) {
    console.warn(
      `  ⚠ ${stats.missingClass9Id} scheduled intermediate control(s) missing class9Id`
    );
  }

  if (stats.missingSemesterId > 0) {
    console.warn(
      `  ⚠ ${stats.missingSemesterId} scheduled intermediate control(s) missing semesterId`
    );
  }

  console.log("✓ All required fields validated");
}

function writeJsonFile(controls: ConvexScheduledIntermediateControl[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, controls);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

function printSummary(controls: ConvexScheduledIntermediateControl[]): void {
  console.log(
    `\n  Total scheduled intermediate controls exported: ${controls.length}`
  );

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table scheduledIntermediateControls backend/exports/convex-scheduled-intermediate-controls-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Scheduled Intermediate Controls Export Script\n");
  console.log("=========================================================\n");

  try {
    console.log("[1/5] Checking Wrangler authentication...");
    checkWranglerAuth();

    console.log("\n[2/5] Querying production D1 database (PiniaState)...");
    const d1Controls = queryD1ScheduledIntermediateControls();

    console.log("\n[3/5] Transforming scheduled intermediate control data...");
    const convexControls = d1Controls.map(transformScheduledIntermediateControl);
    console.log(
      `✓ Transformed ${convexControls.length} scheduled intermediate controls`
    );

    console.log("\n[4/5] Validating data...");
    validateScheduledIntermediateControls(convexControls);

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
