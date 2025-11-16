import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc.js";
import { TRPCError } from "@trpc/server";

/**
 * Input validation schemas for marks operations
 */

// Single mark value schema
const markValueSchema = z.object({
  journalId: z.string(),
  studentId: z.string(),
  columnIndex: z.number().int().min(0),
  rowIndex: z.number().int().min(0),
  value: z.string().nullable(),
  columnType: z.enum(["date", "session"]),
  columnDate: z.string().optional(),
  columnLabel: z.string().optional(),
  controlType: z.enum(["intermediate", "final"]).optional(),
  controlId: z.string().optional(),
  sessionId: z.string().optional(),
  scheduledControlId: z.string().optional(),
});

// Batch update schema
const batchMarkUpdateSchema = z.object({
  journalId: z.string(),
  marks: z.array(markValueSchema),
});

// Journal initialization schema
const initializeJournalSchema = z.object({
  journalId: z.string(),
  disciplineId: z.string(),
  groupName: z.string().optional(),
  academicYear: z.string(),
  semester: z.string(),
  students: z.array(z.string()),
});

/**
 * Marks tRPC router
 * Handles all operations related to student marks/grades
 */
export const marksRouter = router({
  /**
   * Get all marks for a specific journal
   */
  getJournalMarks: protectedProcedure
    .input(
      z.object({
        journalId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { journalId } = input;

      // Get all marks for this journal
      const marks = await ctx.prisma.mark.findMany({
        where: { journalId },
        orderBy: [
          { studentId: "asc" },
          { columnIndex: "asc" },
          { rowIndex: "asc" },
        ],
      });

      // Get journal info
      const journal = await ctx.prisma.journal.findUnique({
        where: { id: journalId },
        include: {
          students: true,
        },
      });

      if (!journal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Journal ${journalId} not found`,
        });
      }

      // Transform marks to frontend structure
      const studentMarks: Record<
        string,
        Record<number, Record<number, string | null>>
      > = {};

      marks.forEach((mark) => {
        if (!studentMarks[mark.studentId]) {
          studentMarks[mark.studentId] = {};
        }
        if (!studentMarks[mark.studentId][mark.columnIndex]) {
          studentMarks[mark.studentId][mark.columnIndex] = {};
        }
        studentMarks[mark.studentId][mark.columnIndex][mark.rowIndex] =
          mark.value;
      });

      return {
        journalId,
        marks,
        studentMarks,
        journal,
      };
    }),

  /**
   * Initialize a journal with students
   * Creates journal and student records if they don't exist
   */
  initializeJournal: protectedProcedure
    .input(initializeJournalSchema)
    .mutation(async ({ ctx, input }) => {
      const { journalId, disciplineId, groupName, academicYear, semester, students } = input;

      // Upsert journal
      const journal = await ctx.prisma.journal.upsert({
        where: { id: journalId },
        update: {
          disciplineId,
          groupName,
          academicYear,
          semester,
          updatedAt: new Date(),
        },
        create: {
          id: journalId,
          disciplineId,
          groupName,
          academicYear,
          semester,
        },
      });

      // Upsert journal students
      for (const studentId of students) {
        await ctx.prisma.journalStudent.upsert({
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
      }

      return {
        success: true,
        journal,
      };
    }),

  /**
   * Update a single mark
   */
  updateMark: protectedProcedure
    .input(markValueSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        journalId,
        studentId,
        columnIndex,
        rowIndex,
        value,
        columnType,
        columnDate,
        columnLabel,
        controlType,
        controlId,
        sessionId,
        scheduledControlId,
      } = input;

      const userId = ctx.userId!;

      // Get existing mark if it exists
      const existingMark = await ctx.prisma.mark.findUnique({
        where: {
          journalId_studentId_columnIndex_rowIndex: {
            journalId,
            studentId,
            columnIndex,
            rowIndex,
          },
        },
      });

      let mark;

      if (existingMark) {
        // Create history record
        await ctx.prisma.markHistory.create({
          data: {
            journalId,
            studentId,
            columnIndex,
            rowIndex,
            oldValue: existingMark.value,
            newValue: value,
            columnLabel,
            columnDate,
            createdBy: userId,
          },
        });

        // Update existing mark
        mark = await ctx.prisma.mark.update({
          where: {
            journalId_studentId_columnIndex_rowIndex: {
              journalId,
              studentId,
              columnIndex,
              rowIndex,
            },
          },
          data: {
            value,
            columnType,
            columnDate,
            columnLabel,
            controlType,
            controlId,
            sessionId,
            scheduledControlId,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new mark
        mark = await ctx.prisma.mark.create({
          data: {
            journalId,
            studentId,
            columnIndex,
            rowIndex,
            value,
            columnType,
            columnDate,
            columnLabel,
            controlType,
            controlId,
            sessionId,
            scheduledControlId,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // Create history record for new mark
        if (value !== null) {
          await ctx.prisma.markHistory.create({
            data: {
              journalId,
              studentId,
              columnIndex,
              rowIndex,
              oldValue: null,
              newValue: value,
              columnLabel,
              columnDate,
              createdBy: userId,
            },
          });
        }
      }

      return {
        success: true,
        mark,
      };
    }),

  /**
   * Batch update multiple marks
   * More efficient than individual updates
   */
  batchUpdateMarks: protectedProcedure
    .input(batchMarkUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { journalId, marks } = input;
      const userId = ctx.userId!;

      // Use transaction for atomicity
      const results = await ctx.prisma.$transaction(async (tx) => {
        const updatedMarks = [];

        for (const markData of marks) {
          const {
            studentId,
            columnIndex,
            rowIndex,
            value,
            columnType,
            columnDate,
            columnLabel,
            controlType,
            controlId,
            sessionId,
            scheduledControlId,
          } = markData;

          // Get existing mark
          const existingMark = await tx.mark.findUnique({
            where: {
              journalId_studentId_columnIndex_rowIndex: {
                journalId,
                studentId,
                columnIndex,
                rowIndex,
              },
            },
          });

          let mark;

          if (existingMark) {
            // Only update if value changed
            if (existingMark.value !== value) {
              // Create history record
              await tx.markHistory.create({
                data: {
                  journalId,
                  studentId,
                  columnIndex,
                  rowIndex,
                  oldValue: existingMark.value,
                  newValue: value,
                  columnLabel,
                  columnDate,
                  createdBy: userId,
                },
              });

              // Update mark
              mark = await tx.mark.update({
                where: {
                  journalId_studentId_columnIndex_rowIndex: {
                    journalId,
                    studentId,
                    columnIndex,
                    rowIndex,
                  },
                },
                data: {
                  value,
                  columnType,
                  columnDate,
                  columnLabel,
                  controlType,
                  controlId,
                  sessionId,
                  scheduledControlId,
                  updatedBy: userId,
                  updatedAt: new Date(),
                },
              });

              updatedMarks.push(mark);
            }
          } else {
            // Create new mark
            mark = await tx.mark.create({
              data: {
                journalId,
                studentId,
                columnIndex,
                rowIndex,
                value,
                columnType,
                columnDate,
                columnLabel,
                controlType,
                controlId,
                sessionId,
                scheduledControlId,
                createdBy: userId,
                updatedBy: userId,
              },
            });

            // Create history record
            if (value !== null) {
              await tx.markHistory.create({
                data: {
                  journalId,
                  studentId,
                  columnIndex,
                  rowIndex,
                  oldValue: null,
                  newValue: value,
                  columnLabel,
                  columnDate,
                  createdBy: userId,
                },
              });
            }

            updatedMarks.push(mark);
          }
        }

        return updatedMarks;
      });

      return {
        success: true,
        updatedCount: results.length,
        marks: results,
      };
    }),

  /**
   * Get mark history for a journal or specific student
   */
  getMarkHistory: protectedProcedure
    .input(
      z.object({
        journalId: z.string(),
        studentId: z.string().optional(),
        limit: z.number().int().min(1).max(1000).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { journalId, studentId, limit } = input;

      const history = await ctx.prisma.markHistory.findMany({
        where: {
          journalId,
          ...(studentId ? { studentId } : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      return {
        journalId,
        studentId,
        history,
      };
    }),

  /**
   * Delete a mark
   */
  deleteMark: protectedProcedure
    .input(
      z.object({
        journalId: z.string(),
        studentId: z.string(),
        columnIndex: z.number().int().min(0),
        rowIndex: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { journalId, studentId, columnIndex, rowIndex } = input;
      const userId = ctx.userId!;

      const existingMark = await ctx.prisma.mark.findUnique({
        where: {
          journalId_studentId_columnIndex_rowIndex: {
            journalId,
            studentId,
            columnIndex,
            rowIndex,
          },
        },
      });

      if (!existingMark) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Mark not found",
        });
      }

      // Create history record
      await ctx.prisma.markHistory.create({
        data: {
          journalId,
          studentId,
          columnIndex,
          rowIndex,
          oldValue: existingMark.value,
          newValue: null,
          columnLabel: existingMark.columnLabel,
          columnDate: existingMark.columnDate,
          createdBy: userId,
        },
      });

      // Delete the mark
      await ctx.prisma.mark.delete({
        where: {
          journalId_studentId_columnIndex_rowIndex: {
            journalId,
            studentId,
            columnIndex,
            rowIndex,
          },
        },
      });

      return {
        success: true,
      };
    }),

  /**
   * Migrate marks from PiniaState to D1 database
   * This is a one-time migration for local development
   */
  migrateFromPiniaState: protectedProcedure
    .input(
      z.object({
        force: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("[Marks Migration] Starting migration from PiniaState...");
        
        // Check if migration has already been done by looking for a special marker
        const migrationMarker = await ctx.prisma.piniaState.findUnique({
          where: { storeId: "marks_migration_completed" },
        });

        if (migrationMarker && !input.force) {
          console.log("[Marks Migration] Migration already completed previously");
          return {
            success: true,
            message: "Migration was already completed previously. Use force=true to re-run.",
            migrated: 0,
            alreadyCompleted: true,
          };
        }

        if (input.force && migrationMarker) {
          console.log("[Marks Migration] Force flag set, deleting migration marker");
          await ctx.prisma.piniaState.delete({
            where: { storeId: "marks_migration_completed" },
          });
        }

        // Get marks from PiniaState
        const piniaState = await ctx.prisma.piniaState.findUnique({
          where: { storeId: "marks" },
        });

        if (!piniaState) {
          return {
            success: false,
            message: "No marks data found in PiniaState",
            migrated: 0,
          };
        }

        const state = JSON.parse(piniaState.state);
        console.log("[Marks Migration] PiniaState state keys:", Object.keys(state));
        
        const journalMarks = state.json?.journalMarks || state.journalMarks;
        
        if (!journalMarks || typeof journalMarks !== 'object') {
          console.error("[Marks Migration] Invalid marks data structure. Expected object or array, got:", typeof journalMarks);
          return {
            success: false,
            message: "Invalid marks data structure in PiniaState",
            migrated: 0,
          };
        }

        let migratedCount = 0;
        let journalsProcessed = 0;

        // Convert to entries array - handles both Map serialization and plain objects
        const entries = Array.isArray(journalMarks) 
          ? journalMarks 
          : Object.entries(journalMarks);

        console.log(`[Marks Migration] Found ${entries.length} journals to process`);

        // Process each journal
        for (const [journalId, journalData] of entries) {
          console.log(`[Marks Migration] Processing journal: ${journalId}`);
          journalsProcessed++;

          console.log(`[Marks Migration] Journal ${journalId} keys:`, Object.keys(journalData || {}));
          const { studentMarks } = journalData;
          console.log(`[Marks Migration] Journal ${journalId} studentMarks type:`, typeof studentMarks);
          console.log(`[Marks Migration] Journal ${journalId} studentMarks isArray:`, Array.isArray(studentMarks));
          
          if (!studentMarks || !Array.isArray(studentMarks)) {
            console.log(`[Marks Migration] Skipping journal ${journalId} - invalid studentMarks`);
            continue;
          }
          
          console.log(`[Marks Migration] Journal ${journalId} has ${studentMarks.length} students`);

          // Ensure journal exists first - create it from the journalData
          try {
            await ctx.prisma.journal.upsert({
              where: { id: journalId },
              update: {},
              create: {
                id: journalId,
                disciplineId: journalData.disciplineId || journalId,
                groupName: journalData.groupName,
                academicYear: journalData.academicYear || "2024-2025",
                semester: journalData.semester || "1",
              },
            });
            console.log(`[Marks Migration] Journal ${journalId} created/updated`);
          } catch (err) {
            console.error(`[Marks Migration] Error creating journal ${journalId}:`, err);
            continue;
          }

          // Process each student
          for (const studentMark of studentMarks) {
            const { studentId, marks } = studentMark;
            if (!marks || !Array.isArray(marks)) continue;

            // Ensure student relationship exists
            try {
              await ctx.prisma.journalStudent.upsert({
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
            } catch (err) {
              console.error(`[Marks Migration] Error creating journal-student relationship:`, err);
              continue;
            }

            // Process each column (mark)
            for (let columnIndex = 0; columnIndex < marks.length; columnIndex++) {
              const mark = marks[columnIndex];
              if (!mark.values || !Array.isArray(mark.values)) continue;

              // Process each row value
              for (let rowIndex = 0; rowIndex < mark.values.length; rowIndex++) {
                const value = mark.values[rowIndex];
                
                // Only migrate non-null, non-empty values
                if (value === null || value === undefined || value === "") continue;

                try {
                  // Check if mark already exists with a value
                  const existingMark = await ctx.prisma.mark.findUnique({
                    where: {
                      journalId_studentId_columnIndex_rowIndex: {
                        journalId,
                        studentId,
                        columnIndex,
                        rowIndex,
                      },
                    },
                  });

                  // Only update if the existing mark is null/empty or doesn't exist
                  if (!existingMark || existingMark.value === null || existingMark.value === "") {
                    await ctx.prisma.mark.upsert({
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
                        columnType: mark.type || "date",
                        columnDate: mark.isoDate,
                        columnLabel: mark.label,
                        sessionId: mark.sessionId,
                        updatedAt: new Date(),
                      },
                      create: {
                        journalId,
                        studentId,
                        columnIndex,
                        rowIndex,
                        value,
                        columnType: mark.type || "date",
                        columnDate: mark.isoDate,
                        columnLabel: mark.label,
                        sessionId: mark.sessionId,
                      },
                    });

                    migratedCount++;
                  }
                } catch (err) {
                  console.error(`[Marks Migration] Error migrating mark for journal ${journalId}, student ${studentId}, col ${columnIndex}, row ${rowIndex}:`, err);
                  // Continue with next mark
                }
              }
            }
          }
        }

        // Mark migration as completed
        await ctx.prisma.piniaState.create({
          data: {
            storeId: "marks_migration_completed",
            state: JSON.stringify({
              completedAt: new Date().toISOString(),
              migratedCount,
              journalsProcessed,
            }),
          },
        });

        console.log(`[Marks Migration] Completed! Migrated ${migratedCount} marks from ${journalsProcessed} journals`);

        return {
          success: true,
          message: `Successfully migrated ${migratedCount} marks from ${journalsProcessed} journals`,
          migrated: migratedCount,
          journals: journalsProcessed,
        };
      } catch (err) {
        console.error("[Marks Migration] Error:", err);
        return {
          success: false,
          message: err instanceof Error ? err.message : "Unknown error",
          migrated: 0,
        };
      }
    }),
});
