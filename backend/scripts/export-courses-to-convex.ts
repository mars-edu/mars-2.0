#!/usr/bin/env ts-node

/**
 * Export courses from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Courses are stored in PiniaState table as JSON blob
 *
 * IMPORTANT: Academic year semesters must be exported and imported to Convex FIRST, since courses
 * reference semester IDs. This script will map D1 semester IDs to Convex academicYearSemester IDs.
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *   - Academic year semesters must be imported to Convex first:
 *     1. Export and import academic years if not already done
 *     2. Export and import semester definitions if not already done
 *     3. cd backend
 *     4. npm run export:academic-year-semesters
 *     5. cd ..
 *     6. npx convex import --table academicYearSemesters backend/exports/convex-academic-year-semesters-export.json
 *
 * Usage:
 *   cd backend
 *   npm run export:courses
 *
 * Or directly:
 *   npx ts-node scripts/export-courses-to-convex.ts
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
import { buildSemesterIdMap } from "./lib/semesterMap.ts";

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

function transformCourse(
  d1Course: D1CourseRow,
  semesterIdMap: Map<string, string>
): ConvexCourse {
  const number = normalizeString(d1Course.number);
  const name = normalizeString(d1Course.admissionYear) || normalizeString(d1Course.name);

  // Map D1 semester IDs to Convex semester IDs
  const d1Semesters = normalizeStringArray(d1Course.semesters);
  const semesters = d1Semesters
    ?.map((d1SemesterId) => semesterIdMap.get(d1SemesterId))
    .filter((id): id is string => id !== undefined);

  const createdAt = toEpochMillis(d1Course.createdAt) ?? Date.now();
  const updatedAt = toEpochMillis(d1Course.updatedAt) ?? createdAt;

  return {
    number,
    name: name ? name : undefined,
    semesters: semesters && semesters.length > 0 ? semesters : undefined,
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
    console.log("[1/6] Checking Wrangler authentication...");
    checkWranglerAuth();

    console.log("\n[2/6] Loading semester ID mappings...");
    const semesterIdMap = buildSemesterIdMap(CONFIG);
    if (semesterIdMap.size === 0) {
      console.warn("⚠ No semester mappings available. Semester references will be lost.");
      console.warn("  Please import academicYearSemesters first with:");
      console.warn("  npx convex import --table academicYearSemesters backend/exports/convex-academic-year-semesters-export.json");
    }

    console.log("\n[3/6] Querying production D1 database (PiniaState)...");
    const d1Courses = queryD1Courses();

    console.log("\n[4/6] Transforming course data...");
    const convexCourses = d1Courses.map((course) =>
      transformCourse(course, semesterIdMap)
    );
    console.log(`✓ Transformed ${convexCourses.length} courses`);

    console.log("\n[5/6] Validating data...");
    validateCourses(convexCourses);

    console.log("\n[6/6] Writing to file...");
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
