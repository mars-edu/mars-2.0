#!/usr/bin/env ts-node

/**
 * Export courses from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Courses are stored in PiniaState table as JSON blob
 *
 * Usage:
 *   cd backend
 *   npm run export:courses
 *
 * Or directly:
 *   npx ts-node scripts/export-courses-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-courses-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table courses backend/exports/convex-courses-export.json
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

interface D1CourseRow {
  id?: string;
  number?: string | null;
  admissionYear?: string | null;
  name?: string | null;
  semesters?: string[] | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

interface D1CoursePiniaState {
  courses: D1CourseRow[];
}

interface ConvexCourse {
  number: string;
  name?: string;
  semesters?: string[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(__dirname, "..", "exports", "convex-courses-export.json"),
};

const COURSES_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'course'
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

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const result = value
    .map((item) => normalizeString(item))
    .filter((item) => item.length > 0);
  return result.length > 0 ? result : undefined;
}

function queryD1Courses(): D1CourseRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: COURSES_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error("No PiniaState record found for storeId='course'");
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const state = parsePiniaState<D1CoursePiniaState>(stateJson);
  const courses = state?.courses;

  if (!courses || !Array.isArray(courses)) {
    throw new Error("Invalid PiniaState structure: expected courses array");
  }

  console.log(`✓ Found ${courses.length} courses in PiniaState`);

  if (courses.length === 0) {
    console.warn("⚠ Warning: No courses found in PiniaState");
  }

  return courses;
}

function transformCourse(d1Course: D1CourseRow): ConvexCourse {
  const number = normalizeString(d1Course.number);
  const name = normalizeString(d1Course.admissionYear) || normalizeString(d1Course.name);
  const semesters = normalizeStringArray(d1Course.semesters);

  const createdAt = toEpochMillis(d1Course.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Course.updatedAt) ?? createdAt;

  return {
    number,
    name: name ? name : undefined,
    semesters,
    createdAt,
    updatedAt,
  };
}

function validateCourses(courses: ConvexCourse[]): void {
  const numberSet = new Set<string>();
  const stats = {
    missingNumber: 0,
    duplicateNumber: 0,
  };

  for (const course of courses) {
    if (!course.number) {
      stats.missingNumber++;
    } else if (numberSet.has(course.number)) {
      stats.duplicateNumber++;
    } else {
      numberSet.add(course.number);
    }
  }

  if (stats.duplicateNumber > 0) {
    console.warn(`  ⚠ Found ${stats.duplicateNumber} duplicate course number(s)`);
  } else {
    console.log("✓ No duplicate course numbers detected");
  }

  if (stats.missingNumber > 0) {
    console.warn(`  ⚠ ${stats.missingNumber} course(s) missing number`);
  }

  console.log("✓ All required fields validated");
}

function writeJsonFile(courses: ConvexCourse[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, courses);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

function printSummary(courses: ConvexCourse[]): void {
  const withSemesters = courses.filter((c) => (c.semesters || []).length > 0)
    .length;

  console.log(`\n  Total courses exported: ${courses.length}`);
  console.log(`  With semesters: ${withSemesters}`);

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(
    "  cd .. && npx convex import --table courses backend/exports/convex-courses-export.json\n"
  );
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Courses Export Script\n");
  console.log("==================================\n");

  try {
    console.log("[1/5] Checking Wrangler authentication...");
    checkWranglerAuth();

    console.log("\n[2/5] Querying production D1 database (PiniaState)...");
    const d1Courses = queryD1Courses();

    console.log("\n[3/5] Transforming course data...");
    const convexCourses = d1Courses.map(transformCourse);
    console.log(`✓ Transformed ${convexCourses.length} courses`);

    console.log("\n[4/5] Validating data...");
    validateCourses(convexCourses);

    console.log("\n[5/5] Writing to file...");
    writeJsonFile(convexCourses);
    printSummary(convexCourses);

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Export failed:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
