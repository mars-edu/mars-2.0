/**
 * Simple Migration Script for Local Development
 * 
 * This script connects directly to the local D1 database and migrates marks data.
 * 
 * Prerequisites:
 * 1. Backend server must be running (wrangler dev)
 * 2. PiniaState table must have marks data
 * 
 * Usage from backend directory:
 *   bun run scripts/migrate-marks-local.ts
 */

import { PrismaClient } from "@prisma/client";

async function runMigration() {
  console.log("🚀 Starting local marks migration...\n");

  // Create Prisma client for local SQLite
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "file:./prisma/dev.db",
      },
    },
  });

  try {
    // Check if PiniaState exists
    const piniaState = await prisma.piniaState.findUnique({
      where: { storeId: "marks" },
    });

    if (!piniaState) {
      console.log("❌ No marks data found in PiniaState.");
      console.log("   Make sure you have marks data before running migration.\n");
      return;
    }

    console.log("✅ Found PiniaState marks data");
    console.log(`   Data size: ${piniaState.state.length} characters\n`);

    // Parse the state
    const state = JSON.parse(piniaState.state);
    const journalMarks = state.journalMarks || {};
    const journalIds = Object.keys(journalMarks);

    console.log(`📝 Found ${journalIds.length} journals\n`);

    if (journalIds.length === 0) {
      console.log("⚠️  No journals to migrate.");
      return;
    }

    let totalMarks = 0;
    let totalStudents = 0;

    // Process each journal
    for (const journalId of journalIds) {
      const journalData = journalMarks[journalId];
      console.log(`📖 Journal: ${journalId}`);

      // Create journal (with placeholder data - you may need to update this manually)
      await prisma.journal.upsert({
        where: { id: journalId },
        update: {},
        create: {
          id: journalId,
          disciplineId: "placeholder-discipline",
          academicYear: "2024-2025",
          semester: "1",
        },
      });

      // Process students
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
          create: { journalId, studentId },
        });

        totalStudents++;

        // Process marks
        for (let colIdx = 0; colIdx < marks.length; colIdx++) {
          const markCol = marks[colIdx];
          for (let rowIdx = 0; rowIdx < markCol.values.length; rowIdx++) {
            const value = markCol.values[rowIdx];
            if (value === null || value === "") continue;

            await prisma.mark.upsert({
              where: {
                journalId_studentId_columnIndex_rowIndex: {
                  journalId,
                  studentId,
                  columnIndex: colIdx,
                  rowIndex: rowIdx,
                },
              },
              update: { value },
              create: {
                journalId,
                studentId,
                columnIndex: colIdx,
                rowIndex: rowIdx,
                value,
                columnType: markCol.type || "date",
                columnDate: markCol.isoDate,
                columnLabel: markCol.label,
                controlType: markCol.controlType,
                controlId: markCol.controlId,
                sessionId: markCol.sessionId,
                scheduledControlId: markCol.scheduledControlId,
              },
            });

            totalMarks++;
          }
        }
      }

      console.log(`   ✅ ${journalData.studentMarks.length} students, ${totalMarks} marks`);
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✨ Migration complete!`);
    console.log(`   Journals: ${journalIds.length}`);
    console.log(`   Students: ${totalStudents}`);
    console.log(`   Marks: ${totalMarks}`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
