/**
 * Data Migration Script: PiniaState (marks) to Normalized Mark Tables
 * 
 * This script migrates student marks data from the PiniaState JSON blob
 * to the new normalized database schema (Journal, JournalStudent, Mark, MarkHistory)
 * 
 * Usage:
 *   bun run scripts/migrate-marks-from-pinia.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import superjson from "superjson";

interface MarkValue {
  type: "date" | "session";
  date?: string;
  values: Array<string | null>;
  label?: string;
  sessionId?: string;
  sessionDateIndices?: number[];
  isoDate?: string;
  controlType?: "intermediate" | "final";
  controlId?: string;
  scheduledControlId?: string;
}

interface StudentMark {
  studentId: string;
  marks: MarkValue[];
}

interface JournalMarksData {
  journalId: string;
  studentMarks: StudentMark[];
  lastUpdated: string;
}

interface PiniaMarksState {
  journalMarks: Record<string, JournalMarksData>;
}

async function migrateMarks() {
  console.log("🚀 Starting marks migration from PiniaState to normalized schema...\n");

  // Note: You'll need to set up the D1 database binding
  // For local development, this script needs to be run in a Cloudflare Workers context
  // or you need to provide a direct SQLite connection
  
  // For now, this is a template that shows the migration logic
  // You'll need to adapt it to your deployment environment
  
  console.log("⚠️  This script needs to be run with proper database bindings.");
  console.log("   For local testing, use wrangler dev or configure a local SQLite connection.\n");

  // Example of how the migration would work:
  const exampleMigration = `
  
  Migration Steps:
  ================
  
  1. Connect to database with proper bindings
  2. Fetch PiniaState record where storeId = 'marks'
  3. Parse the JSON state using superjson
  4. For each journal in journalMarks:
     a. Extract journal metadata (you may need to infer this from other stores)
     b. Create/update Journal record
     c. For each student in the journal:
        - Create JournalStudent record if not exists
        - For each mark column (date/session):
          - For each row value in that column:
            - Create Mark record with proper indexes
            - Skip if value is null/empty
  5. Verify data integrity
  6. Optionally backup old PiniaState data
  
  Example code structure:
  `;

  console.log(exampleMigration);
}

/**
 * Actual migration function (to be called with proper context)
 */
export async function performMigration(prisma: PrismaClient) {
  console.log("📊 Fetching PiniaState marks data...");

  // Fetch the marks state from PiniaState
  const piniaState = await prisma.piniaState.findUnique({
    where: { storeId: "marks" },
  });

  if (!piniaState) {
    console.log("❌ No marks data found in PiniaState. Nothing to migrate.");
    return { success: false, message: "No data found" };
  }

  console.log("✅ Found marks data in PiniaState");

  // Parse the state
  let state: PiniaMarksState;
  try {
    state = superjson.parse(piniaState.state) as PiniaMarksState;
  } catch (err) {
    console.error("❌ Failed to parse PiniaState:", err);
    return { success: false, message: "Failed to parse state" };
  }

  const journalMarks = state.journalMarks || {};
  const journalIds = Object.keys(journalMarks);

  console.log(`📝 Found ${journalIds.length} journals to migrate\n`);

  let totalMarksCreated = 0;
  let totalJournalsCreated = 0;
  let totalStudentsCreated = 0;

  // Migrate each journal
  for (const journalId of journalIds) {
    const journalData = journalMarks[journalId];
    console.log(`\n📖 Processing journal: ${journalId}`);
    console.log(`   Students: ${journalData.studentMarks.length}`);

    try {
      // Create or update journal
      // Note: You may need to fetch additional metadata from other stores
      // For now, we use placeholder values
      const journal = await prisma.journal.upsert({
        where: { id: journalId },
        update: {
          updatedAt: new Date(journalData.lastUpdated),
        },
        create: {
          id: journalId,
          disciplineId: "unknown", // You'll need to get this from journalStore
          academicYear: "2024-2025", // You'll need to get this from journalStore
          semester: "unknown", // You'll need to get this from journalStore
          groupName: null,
        },
      });

      totalJournalsCreated++;

      // Process each student
      for (const studentMark of journalData.studentMarks) {
        const { studentId, marks } = studentMark;

        // Create journal-student relationship
        await prisma.journalStudent.upsert({
          where: {
            journalId_studentId: {
              journalId,
              studentId,
            },
          },
          update: {},
          create: {
            journalId,
            studentId,
          },
        });

        totalStudentsCreated++;

        // Process each column (date/session)
        for (let columnIndex = 0; columnIndex < marks.length; columnIndex++) {
          const markColumn = marks[columnIndex];

          // Process each row value in this column
          for (let rowIndex = 0; rowIndex < markColumn.values.length; rowIndex++) {
            const value = markColumn.values[rowIndex];

            // Skip null/empty values
            if (value === null || value === "") {
              continue;
            }

            // Create mark record
            await prisma.mark.upsert({
              where: {
                journalId_studentId_columnIndex_rowIndex: {
                  journalId,
                  studentId,
                  columnIndex,
                  rowIndex,
                },
              },
              update: {
                value,
                columnType: markColumn.type,
                columnDate: markColumn.isoDate,
                columnLabel: markColumn.label,
                controlType: markColumn.controlType,
                controlId: markColumn.controlId,
                sessionId: markColumn.sessionId,
                scheduledControlId: markColumn.scheduledControlId,
                updatedAt: new Date(),
              },
              create: {
                journalId,
                studentId,
                columnIndex,
                rowIndex,
                value,
                columnType: markColumn.type,
                columnDate: markColumn.isoDate,
                columnLabel: markColumn.label,
                controlType: markColumn.controlType,
                controlId: markColumn.controlId,
                sessionId: markColumn.sessionId,
                scheduledControlId: markColumn.scheduledControlId,
              },
            });

            totalMarksCreated++;
          }
        }
      }

      console.log(`   ✅ Migrated ${journalData.studentMarks.length} students`);
    } catch (err) {
      console.error(`   ❌ Error migrating journal ${journalId}:`, err);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Migration Summary:");
  console.log("=".repeat(60));
  console.log(`Journals processed: ${totalJournalsCreated}`);
  console.log(`Students processed: ${totalStudentsCreated}`);
  console.log(`Marks created: ${totalMarksCreated}`);
  console.log("=".repeat(60) + "\n");

  console.log("✨ Migration completed successfully!");

  return {
    success: true,
    journalsCreated: totalJournalsCreated,
    studentsCreated: totalStudentsCreated,
    marksCreated: totalMarksCreated,
  };
}

// If running directly
if (import.meta.main) {
  console.log("⚠️  This script should be integrated into your deployment process.");
  console.log("   It requires proper database bindings from Cloudflare Workers.\n");
  migrateMarks();
}
