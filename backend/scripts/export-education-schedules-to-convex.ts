#!/usr/bin/env ts-node

/**
 * Export education schedules from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Education schedules are stored in PiniaState table as JSON blob
 *
 * Usage:
 *   cd backend
 *   npm run export:education-schedules
 *
 * Or directly:
 *   npx ts-node scripts/export-education-schedules-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-education-schedules-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table educationSchedules backend/exports/convex-education-schedules-export.json
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

interface D1EducationScheduleRow {
  id?: string;
  lessonNumber?: number | string | null;
  order?: number | string | null;
  name?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  academicYearId?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1EducationSchedulePiniaState {
  schedules: D1EducationScheduleRow[];
}

interface ConvexEducationSchedule {
  name: string;
  startTime: string;
  endTime: string;
  order: number;
  academicYearId: string;
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
    "convex-education-schedules-export.json"
  ),
};

const EDUCATION_SCHEDULES_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'educationSchedule'
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

function queryD1EducationSchedules(): D1EducationScheduleRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: EDUCATION_SCHEDULES_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error(
      "No PiniaState record found for storeId='educationSchedule'"
    );
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const state = parsePiniaState<D1EducationSchedulePiniaState>(stateJson);
  const schedules = state?.schedules;

  if (!schedules || !Array.isArray(schedules)) {
    throw new Error("Invalid PiniaState structure: expected schedules array");
  }

  console.log(`✓ Found ${schedules.length} education schedules in PiniaState`);

  if (schedules.length === 0) {
    console.warn("⚠ Warning: No education schedules found in PiniaState");
  }

  return schedules;
}

function transformSchedule(
  d1Schedule: D1EducationScheduleRow,
  index: number,
  academicYearIdMap: Map<string, string>,
  defaultAcademicYearId: string | null
): ConvexEducationSchedule {
  const order =
    normalizeNumber(d1Schedule.lessonNumber) ??
    normalizeNumber(d1Schedule.order) ??
    index + 1;

  const startTime = normalizeString(d1Schedule.startTime);
  const endTime = normalizeString(d1Schedule.endTime);
  const legacyAcademicYearId = normalizeString(d1Schedule.academicYearId);
  const academicYearId =
    academicYearIdMap.get(legacyAcademicYearId) ||
    defaultAcademicYearId ||
    "";

  const name =
    normalizeString(d1Schedule.name) ||
    (order ? `Lesson ${order}` : "Lesson");

  const createdAt = toEpochMillis(d1Schedule.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Schedule.updatedAt) ?? createdAt;

  return {
    name,
    startTime,
    endTime,
    order,
    academicYearId,
    createdAt,
    updatedAt,
  };
}

function validateSchedules(schedules: ConvexEducationSchedule[]): void {
  const stats = {
    missingStart: 0,
    missingEnd: 0,
    missingOrder: 0,
    missingAcademicYear: 0,
  };

  for (const schedule of schedules) {
    if (!schedule.startTime) stats.missingStart++;
    if (!schedule.endTime) stats.missingEnd++;
    if (!schedule.order) stats.missingOrder++;
    if (!schedule.academicYearId) stats.missingAcademicYear++;
  }

  if (stats.missingStart > 0) {
    console.warn(`  ⚠ ${stats.missingStart} schedule(s) missing startTime`);
  }

  if (stats.missingEnd > 0) {
    console.warn(`  ⚠ ${stats.missingEnd} schedule(s) missing endTime`);
  }

  if (stats.missingOrder > 0) {
    console.warn(`  ⚠ ${stats.missingOrder} schedule(s) missing order`);
  }

  if (stats.missingAcademicYear > 0) {
    console.warn(
      `  ⚠ ${stats.missingAcademicYear} schedule(s) missing academicYearId`
    );
  }

  console.log("✓ All required fields validated");
}

function writeJsonFile(schedules: ConvexEducationSchedule[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, schedules);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

function printSummary(schedules: ConvexEducationSchedule[]): void {
  const byYear = new Map<string, number>();
  for (const schedule of schedules) {
    const key = schedule.academicYearId || "unknown";
    byYear.set(key, (byYear.get(key) || 0) + 1);
  }

  console.log(`\n  Total schedules exported: ${schedules.length}`);
  console.log(
    `  Academic years: ${Array.from(byYear.keys()).length} unique`
  );

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table educationSchedules backend/exports/convex-education-schedules-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Education Schedule Export Script\n");
  console.log("============================================\n");

  try {
    console.log("[1/6] Checking Wrangler authentication...");
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
    const d1Schedules = queryD1EducationSchedules();

    console.log("\n[4/6] Transforming education schedule data...");
    const convexSchedules = d1Schedules.map((schedule, index) =>
      transformSchedule(
        schedule,
        index,
        idMap,
        defaultConvexAcademicYearId
      )
    );
    console.log(`✓ Transformed ${convexSchedules.length} schedules`);

    console.log("\n[5/6] Validating data...");
    validateSchedules(convexSchedules);

    console.log("\n[6/6] Writing to file...");
    writeJsonFile(convexSchedules);
    printSummary(convexSchedules);

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Export failed:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
