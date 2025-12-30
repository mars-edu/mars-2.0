#!/usr/bin/env ts-node

/**
 * Export semesters from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Semesters are stored in PiniaState table as JSON blob. This script
 * merges "semester" and "academicYearSemester" stores when both exist.
 *
 * Usage:
 *   cd backend
 *   npm run export:semesters
 *
 * Or directly:
 *   npx ts-node scripts/export-semesters-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-semesters-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table semesters backend/exports/convex-semesters-export.json
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

interface D1SemesterRow {
  id?: string;
  shortName?: string | null;
  fullName?: string | null;
  name?: string | null;
  academicYearId?: string | null;
  number?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1SemesterPiniaState {
  semesters: D1SemesterRow[];
}

interface D1AcademicYearSemesterRow {
  id?: string;
  academicYearId?: string | null;
  semesterNumber?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1AcademicYearSemesterPiniaState {
  academicYearSemesters: D1AcademicYearSemesterRow[];
}

interface ConvexSemester {
  name: string;
  shortName?: string;
  fullName?: string;
  number?: number;
  academicYearId: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(__dirname, "..", "exports", "convex-semesters-export.json"),
};

const SEMESTERS_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'semester'
`.trim();

const ACADEMIC_YEAR_SEMESTERS_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'academicYearSemester'
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

function queryD1Semesters(): D1SemesterRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: SEMESTERS_QUERY,
  });

  if (response.results.length === 0) {
    console.warn("⚠ No PiniaState record found for storeId='semester'");
    return [];
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    console.warn("⚠ PiniaState 'state' column is empty for semester");
    return [];
  }

  const state = parsePiniaState<D1SemesterPiniaState>(stateJson);
  const semesters = state?.semesters;

  if (!semesters || !Array.isArray(semesters)) {
    console.warn("⚠ Invalid PiniaState structure: expected semesters array");
    return [];
  }

  console.log(`✓ Found ${semesters.length} semesters in PiniaState`);
  return semesters;
}

function queryD1AcademicYearSemesters(): D1AcademicYearSemesterRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: ACADEMIC_YEAR_SEMESTERS_QUERY,
  });

  if (response.results.length === 0) {
    console.warn(
      "⚠ No PiniaState record found for storeId='academicYearSemester'"
    );
    return [];
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    console.warn(
      "⚠ PiniaState 'state' column is empty for academicYearSemester"
    );
    return [];
  }

  const state =
    parsePiniaState<D1AcademicYearSemesterPiniaState>(stateJson);
  const semesters = state?.academicYearSemesters;

  if (!semesters || !Array.isArray(semesters)) {
    console.warn(
      "⚠ Invalid PiniaState structure: expected academicYearSemesters array"
    );
    return [];
  }

  console.log(
    `✓ Found ${semesters.length} academic year semesters in PiniaState`
  );
  return semesters;
}

function mergeSemesters(
  semesters: D1SemesterRow[],
  academicYearSemesters: D1AcademicYearSemesterRow[],
  academicYearIdMap: Map<string, string>,
  defaultAcademicYearId: string | null
): ConvexSemester[] {
  const merged = new Map<string, D1SemesterRow>();
  let fallbackCounter = 0;
  const nextFallbackId = () => `missing-${++fallbackCounter}`;

  for (const sem of semesters) {
    const key = normalizeString(sem.id) || nextFallbackId();
    merged.set(key, { ...sem, id: key });
  }

  for (const aySem of academicYearSemesters) {
    const key = normalizeString(aySem.id);
    if (key && merged.has(key)) {
      const existing = merged.get(key)!;
      merged.set(key, {
        ...existing,
        academicYearId: aySem.academicYearId ?? existing.academicYearId,
        number:
          normalizeNumber(aySem.semesterNumber) ??
          normalizeNumber(existing.number),
        startDate: aySem.startDate ?? existing.startDate,
        endDate: aySem.endDate ?? existing.endDate,
        createdAt: existing.createdAt ?? aySem.createdAt,
        updatedAt: existing.updatedAt ?? aySem.updatedAt,
      });
    } else {
      const fallbackKey = key || nextFallbackId();
      merged.set(fallbackKey, {
        id: fallbackKey,
        academicYearId: aySem.academicYearId ?? undefined,
        number: normalizeNumber(aySem.semesterNumber) ?? undefined,
        startDate: aySem.startDate ?? undefined,
        endDate: aySem.endDate ?? undefined,
        createdAt: aySem.createdAt ?? undefined,
        updatedAt: aySem.updatedAt ?? undefined,
      });
    }
  }

  return Array.from(merged.values()).map((sem, index) => {
    const number = normalizeNumber(sem.number);
    const shortName =
      normalizeString(sem.shortName) || normalizeString(sem.name);
    const fullName = normalizeString(sem.fullName);
    const legacyAcademicYearId = normalizeString(sem.academicYearId);
    const academicYearId =
      academicYearIdMap.get(legacyAcademicYearId) ||
      defaultAcademicYearId ||
      "";
    const name =
      shortName ||
      (number ? `Semester ${number}` : `Semester ${index + 1}`);

    const createdAt = toEpochMillis(sem.createdAt) ?? Date.now();
    const updatedAt = toEpochMillis(sem.updatedAt) ?? createdAt;

    return {
      name,
      shortName: shortName || undefined,
      fullName: fullName || undefined,
      number: number ?? undefined,
      academicYearId,
      startDate: normalizeString(sem.startDate) || undefined,
      endDate: normalizeString(sem.endDate) || undefined,
      isActive: typeof sem.isActive === "boolean" ? sem.isActive : undefined,
      createdAt,
      updatedAt,
    };
  });
}

function validateSemesters(semesters: ConvexSemester[]): void {
  const stats = {
    missingName: 0,
    missingAcademicYear: 0,
  };

  for (const sem of semesters) {
    if (!sem.name) stats.missingName++;
    if (!sem.academicYearId) stats.missingAcademicYear++;
  }

  if (stats.missingName > 0) {
    console.warn(`  ⚠ ${stats.missingName} semester(s) missing name`);
  }

  if (stats.missingAcademicYear > 0) {
    console.warn(
      `  ⚠ ${stats.missingAcademicYear} semester(s) missing academicYearId`
    );
  }

  console.log("✓ All required fields validated");
}

function writeJsonFile(semesters: ConvexSemester[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, semesters);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

function printSummary(semesters: ConvexSemester[]): void {
  const withDates = semesters.filter((s) => s.startDate && s.endDate).length;
  const withNumbers = semesters.filter((s) => s.number !== undefined).length;

  console.log(`\n  Total semesters exported: ${semesters.length}`);
  console.log(`  With dates: ${withDates}`);
  console.log(`  With number: ${withNumbers}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table semesters backend/exports/convex-semesters-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Semesters Export Script\n");
  console.log("====================================\n");

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
    const d1Semesters = queryD1Semesters();
    const d1AcademicYearSemesters = queryD1AcademicYearSemesters();

    console.log("\n[4/6] Transforming semester data...");
    const convexSemesters = mergeSemesters(
      d1Semesters,
      d1AcademicYearSemesters,
      idMap,
      defaultConvexAcademicYearId
    );
    console.log(`✓ Transformed ${convexSemesters.length} semesters`);

    console.log("\n[5/6] Validating data...");
    validateSemesters(convexSemesters);

    console.log("\n[6/6] Writing to file...");
    writeJsonFile(convexSemesters);
    printSummary(convexSemesters);

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Export failed:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
