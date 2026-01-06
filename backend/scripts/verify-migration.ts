#!/usr/bin/env ts-node

/**
 * Verify migration of academic years and students in Convex
 *
 * Usage:
 *   cd backend
 *   npx ts-node scripts/verify-migration.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("✗ CONVEX_URL or VITE_CONVEX_URL environment variable not set");
  process.exit(1);
}

interface AcademicYear {
  _id: string;
  legacyId?: string;
  name: string;
  startYear: number;
  isActive: boolean;
}

interface Student {
  _id: string;
  firstName: string;
  surname: string;
  patronymic: string;
  academicYearId?: string;
  specialty: string;
}

async function main() {
  console.log("Verifying Migration to Convex\n");
  console.log("=============================\n");

  try {
    console.log("Connecting to Convex...");
    const client = new ConvexHttpClient(CONVEX_URL);
    console.log(`✓ Connected to ${CONVEX_URL}\n`);

    // Fetch academic years
    console.log("Fetching academic years...");
    const academicYears = await client.query(api.academicYears.queries.list, {}) as AcademicYear[];
    console.log(`✓ Found ${academicYears.length} academic years`);

    const activeYear = academicYears.find(y => y.isActive);
    console.log(`✓ Active year: ${activeYear?.name} (${activeYear?._id})`);

    const withLegacyId = academicYears.filter(y => y.legacyId).length;
    console.log(`✓ ${withLegacyId} years have legacyId for mapping\n`);

    // Fetch students
    console.log("Fetching students...");
    const students = await client.query(api.students.queries.list, {}) as Student[];
    console.log(`✓ Found ${students.length} students`);

    // Analyze student distribution by academic year
    const studentsByYear = new Map<string, number>();
    const studentsWithoutYear = students.filter(s => !s.academicYearId).length;

    students.forEach(s => {
      if (s.academicYearId) {
        studentsByYear.set(s.academicYearId, (studentsByYear.get(s.academicYearId) || 0) + 1);
      }
    });

    console.log(`\nStudent Distribution by Academic Year:`);
    for (const year of academicYears) {
      const count = studentsByYear.get(year._id) || 0;
      console.log(`  ${year.name}: ${count} students`);
    }

    if (studentsWithoutYear > 0) {
      console.warn(`\n⚠ Warning: ${studentsWithoutYear} students have no academicYearId`);
    }

    // Verify academic year references are valid
    console.log(`\nVerifying academic year references...`);
    const validYearIds = new Set(academicYears.map(y => y._id));
    const invalidRefs = students.filter(s => s.academicYearId && !validYearIds.has(s.academicYearId));

    if (invalidRefs.length > 0) {
      console.error(`✗ ERROR: ${invalidRefs.length} students have invalid academicYearId references:`);
      invalidRefs.slice(0, 5).forEach(s => {
        console.error(`  - ${s.surname} ${s.firstName}: ${s.academicYearId}`);
      });
    } else {
      console.log(`✓ All student academic year references are valid`);
    }

    console.log(`\n✓ Migration verification complete!\n`);

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Verification failed:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
