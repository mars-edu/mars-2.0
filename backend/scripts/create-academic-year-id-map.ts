#!/usr/bin/env ts-node

/**
 * Create academic year ID mapping from D1 legacy IDs to Convex IDs
 *
 * This script queries Convex for all academic years with their legacyId field
 * and creates a JSON mapping file that can be used by other migration scripts.
 *
 * Usage:
 *   cd backend
 *   npx ts-node scripts/create-academic-year-id-map.ts
 *
 * Output:
 *   - backend/exports/academic-year-id-map.json
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("✗ CONVEX_URL or VITE_CONVEX_URL environment variable not set");
  console.error("  Run this from the project root where .env.local exists");
  process.exit(1);
}

interface AcademicYear {
  _id: string;
  legacyId?: string;
  name: string;
  startYear: number;
  endYear: number;
}

async function main() {
  console.log("Creating Academic Year ID Mapping\n");
  console.log("==================================\n");

  try {
    console.log("[1/3] Connecting to Convex...");
    const client = new ConvexHttpClient(CONVEX_URL);
    console.log(`✓ Connected to ${CONVEX_URL}`);

    console.log("\n[2/3] Fetching academic years from Convex...");
    const academicYears = await client.query(api.academicYears.queries.list, {}) as AcademicYear[];
    console.log(`✓ Found ${academicYears.length} academic years`);

    console.log("\n[3/3] Creating ID mapping...");
    const idMap: Record<string, string> = {};

    for (const year of academicYears) {
      if (year.legacyId) {
        idMap[year.legacyId] = year._id;
        console.log(`  ${year.legacyId} -> ${year._id} (${year.name})`);
      }
    }

    const outputFile = join(__dirname, "..", "exports", "academic-year-id-map.json");
    writeFileSync(outputFile, JSON.stringify(idMap, null, 2), "utf-8");

    const fileSizeKB = (Buffer.byteLength(JSON.stringify(idMap)) / 1024).toFixed(2);
    console.log(`\n✓ Wrote ${outputFile} (${fileSizeKB} KB)`);
    console.log(`✓ Created mapping for ${Object.keys(idMap).length} academic years`);

    console.log("\n✓ ID mapping complete!");
    console.log("\nYou can now use this mapping in other migration scripts.\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n✗ Failed to create ID mapping:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
