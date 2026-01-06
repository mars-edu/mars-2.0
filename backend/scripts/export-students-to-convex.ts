#!/usr/bin/env ts-node

/**
 * Export students from production Cloudflare D1 (PiniaState) to Convex-ready JSON
 *
 * NOTE: Students are stored in PiniaState table as JSON blob, not in a dedicated table
 *
 * Usage:
 *   cd backend
 *   npm run export:students
 *
 * Or directly:
 *   npx ts-node scripts/export-students-to-convex.ts
 *
 * Prerequisites:
 *   - Wrangler must be authenticated: npx wrangler login
 *
 * Output:
 *   - backend/exports/convex-students-export.json
 *
 * Import to Convex:
 *   cd ..
 *   npx convex import --table students backend/exports/convex-students-export.json
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
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
 * Student data stored in D1 PiniaState JSON blob
 */
interface D1StudentRow {
  id: string;
  firstName: string;
  surname: string;
  patronymic: string;
  specialty: string;
  language: string;
  gender: "male" | "female";
  base?: number;
  academicYearId?: string;
}

/**
 * PiniaState structure for students
 */
interface D1StudentPiniaState {
  students: D1StudentRow[];
}

/**
 * Convex student record (matches convex/schema.ts)
 */
interface ConvexStudent {
  firstName: string;
  surname: string;
  patronymic: string;
  specialty: string;
  language: string;
  gender: "male" | "female";
  base?: number;
  academicYearId?: string;
  createdAt: number; // milliseconds since epoch
  updatedAt: number; // milliseconds since epoch
}

type ValidLanguage = "ru" | "kk";
type ValidGender = "male" | "female";
type ValidBase = 9 | 11;

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  databaseName: "mars-db",
  accountId: "1baf07e2bf54af133428fea840266f45", // From wrangler.toml
  outputFile: join(__dirname, "..", "exports", "convex-students-export.json"),
  academicYearIdMapFile: join(__dirname, "..", "exports", "academic-year-id-map.json"),
  validLanguages: ["ru", "kk"] as const,
  validGenders: ["male", "female"] as const,
  validBases: [9, 11] as const,
};

// ============================================================================
// SQL Query
// ============================================================================

const STUDENTS_QUERY = `
SELECT state
FROM PiniaState
WHERE storeId = 'student'
`.trim();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load academic year ID mapping from file
 */
function loadAcademicYearIdMap(): Map<string, string> {
  try {
    const mapJson = readFileSync(CONFIG.academicYearIdMapFile, "utf-8");
    const mapObj = JSON.parse(mapJson) as Record<string, string>;
    const map = new Map<string, string>(Object.entries(mapObj));
    console.log(`✓ Loaded academic year ID mapping (${map.size} entries)`);
    return map;
  } catch (error) {
    console.warn("⚠ Warning: Could not load academic year ID mapping");
    console.warn("  Run: npm run export:academic-year-id-map");
    console.warn("  Students will keep their original academicYearId values");
    return new Map<string, string>();
  }
}

/**
 * Query D1 database and return student rows from PiniaState
 */
function queryD1Students(): D1StudentRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: CONFIG.databaseName,
    accountId: CONFIG.accountId,
    query: STUDENTS_QUERY,
  });

  if (response.results.length === 0) {
    throw new Error("No PiniaState record found for storeId='student'");
  }

  // Parse the JSON blob from state column
  const stateJson = response.results[0].state;
  if (!stateJson) {
    throw new Error("PiniaState 'state' column is empty");
  }

  const piniaState = parsePiniaState<D1StudentPiniaState>(stateJson);

  if (!piniaState.students || !Array.isArray(piniaState.students)) {
    throw new Error("Invalid PiniaState structure: expected students array");
  }

  const students = piniaState.students;
  console.log(`✓ Found ${students.length} students in PiniaState`);

  if (students.length === 0) {
    console.warn("⚠ Warning: No students found in PiniaState");
  }

  return students;
}

/**
 * Transform D1 student row to Convex format
 */
function transformStudent(d1Student: D1StudentRow, academicYearIdMap: Map<string, string>): ConvexStudent {
  const now = Date.now();

  // Map D1 academic year ID to Convex ID
  let academicYearId = d1Student.academicYearId;
  if (academicYearId && academicYearIdMap.has(academicYearId)) {
    academicYearId = academicYearIdMap.get(academicYearId);
  }

  return {
    firstName: d1Student.firstName,
    surname: d1Student.surname,
    patronymic: d1Student.patronymic,
    specialty: d1Student.specialty,
    language: d1Student.language,
    gender: d1Student.gender,
    base: d1Student.base,
    academicYearId: academicYearId,
    createdAt: now, // No source timestamp - use current time
    updatedAt: now, // No source timestamp - use current time
  };
}

/**
 * Validate transformed students for common issues
 */
function validateStudents(students: ConvexStudent[]): void {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  // Track statistics
  const stats = {
    invalidGender: 0,
    invalidLanguage: 0,
    invalidBase: 0,
    shortPatronymic: 0,
    missingSpecialty: 0,
  };

  for (const student of students) {
    const fullName = `${student.surname} ${student.firstName} ${student.patronymic}`;

    // Duplicate detection (by full name + specialty + academicYear)
    const key = `${student.surname}|${student.firstName}|${student.patronymic}|${student.specialty}|${student.academicYearId || ""}`;
    if (seen.has(key)) {
      duplicates.push(fullName);
    } else {
      seen.add(key);
    }

    // Gender validation
    if (!CONFIG.validGenders.includes(student.gender as any)) {
      console.warn(`  ⚠ Invalid gender '${student.gender}' for ${fullName}`);
      stats.invalidGender++;
    }

    // Language validation
    if (!CONFIG.validLanguages.includes(student.language as any)) {
      console.warn(`  ⚠ Invalid language '${student.language}' for ${fullName}`);
      stats.invalidLanguage++;
    }

    // Base validation (if present)
    if (student.base !== undefined && !CONFIG.validBases.includes(student.base as any)) {
      console.warn(`  ⚠ Invalid base '${student.base}' for ${fullName}`);
      stats.invalidBase++;
    }

    // Check for single-character patronymic
    if (student.patronymic.length === 1) {
      stats.shortPatronymic++;
    }

    // Check for empty specialty
    if (!student.specialty || student.specialty.trim() === "") {
      console.warn(`  ⚠ Missing specialty for ${fullName}`);
      stats.missingSpecialty++;
    }
  }

  // Report validation results
  if (duplicates.length > 0) {
    console.warn(`  ⚠ Found ${duplicates.length} potential duplicate(s)`);
  } else {
    console.log("✓ No duplicate students detected");
  }

  if (stats.shortPatronymic > 0) {
    console.warn(`  ⚠ ${stats.shortPatronymic} student(s) have single-character patronymic`);
  }

  if (stats.invalidGender > 0) {
    console.warn(`  ⚠ ${stats.invalidGender} student(s) have invalid gender values`);
  }

  if (stats.invalidLanguage > 0) {
    console.warn(`  ⚠ ${stats.invalidLanguage} student(s) have invalid language values`);
  }

  if (stats.invalidBase > 0) {
    console.warn(`  ⚠ ${stats.invalidBase} student(s) have invalid base values`);
  }

  if (stats.missingSpecialty > 0) {
    console.warn(`  ⚠ ${stats.missingSpecialty} student(s) have missing specialty`);
  }

  console.log("✓ All required fields validated");
}

/**
 * Write students array to JSON file
 */
function writeJsonFile(students: ConvexStudent[]): void {
  try {
    const fileSizeKB = writeJsonFileToDisk(CONFIG.outputFile, students);
    console.log(`✓ Wrote ${CONFIG.outputFile} (${fileSizeKB} KB)`);
  } catch (error: any) {
    console.error("✗ Failed to write file");
    throw error;
  }
}

/**
 * Print summary statistics
 */
function printSummary(students: ConvexStudent[]): void {
  // Count by gender
  const byGender = students.reduce(
    (acc, s) => {
      acc[s.gender] = (acc[s.gender] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Count by language
  const byLanguage = students.reduce(
    (acc, s) => {
      acc[s.language] = (acc[s.language] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Count by base
  const byBase = students.reduce(
    (acc, s) => {
      if (s.base !== undefined) {
        const key = String(s.base);
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Count by academic year
  const byYear = students.reduce(
    (acc, s) => {
      const year = s.academicYearId || "unknown";
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`\n  Total students exported: ${students.length}`);

  console.log(`\n  By Gender:`);
  console.log(`    Male: ${byGender.male || 0}`);
  console.log(`    Female: ${byGender.female || 0}`);

  console.log(`\n  By Language:`);
  console.log(`    Russian (ru): ${byLanguage.ru || 0}`);
  console.log(`    Kazakh (kk): ${byLanguage.kk || 0}`);

  console.log(`\n  By Base:`);
  console.log(`    9-year: ${byBase["9"] || 0}`);
  console.log(`    11-year: ${byBase["11"] || 0}`);
  console.log(`    Not specified: ${students.length - (byBase["9"] || 0) - (byBase["11"] || 0)}`);

  console.log(`\n  By Academic Year:`);
  Object.entries(byYear)
    .sort(([a], [b]) => {
      // Sort numerically if both are numbers, otherwise alphabetically
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    })
    .forEach(([year, count]) => {
      console.log(`    Year ${year}: ${count}`);
    });

  console.log("\n✓ Export complete!");
  console.log("\nImport to Convex with:");
  console.log(`  cd .. && npx convex import --table students backend/exports/convex-students-export.json\n`);
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("D1 to Convex Student Export Script\n");
  console.log("===================================\n");

  try {
    // Step 1: Check authentication
    console.log("[1/7] Checking Wrangler authentication...");
    checkWranglerAuth();

    // Step 2: Load academic year ID mapping
    console.log("\n[2/7] Loading academic year ID mapping...");
    const academicYearIdMap = loadAcademicYearIdMap();

    // Step 3: Query D1
    console.log("\n[3/7] Querying production D1 database (PiniaState)...");
    const d1Students = queryD1Students();

    // Step 4: Transform data
    console.log("\n[4/7] Transforming student data...");
    const convexStudents = d1Students.map(s => transformStudent(s, academicYearIdMap));
    console.log(`✓ Transformed ${convexStudents.length} students`);

    // Step 5: Validate
    console.log("\n[5/7] Validating data...");
    validateStudents(convexStudents);

    // Step 6: Write file
    console.log("\n[6/7] Writing to file...");
    writeJsonFile(convexStudents);

    // Step 7: Summary
    console.log("\n[7/7] Summary:");
    printSummary(convexStudents);

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
