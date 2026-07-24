/**
 * Excel Export and Import Actions
 *
 * Convex actions for generating and parsing Excel files on the backend.
 *
 * Runs Excel parsing/generation on the backend to keep ExcelJS out of the frontend bundle.
 */

"use node";

import { action } from "../functions";
import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";

import {
  exportJournalToExcel,
} from "./lib/journalExport";
import type {
  JournalExportPayload,
  JournalStudentRow,
} from "../../src/lib/excel/journalExport.types";

import {
  exportTeacherWorkloadToExcel,
} from "./lib/workloadExport";
import type {
  TeacherWorkloadExportPayload,
  WorkloadEntry,
  WorkloadSummaryEntry,
  MonthlyDistributionEntry,
  MonthWorkloadData,
} from "../../src/lib/excel/workloadExport.types";

import {
  exportAnalyticsToExcel,
} from "./lib/analyticsExport";
import type {
  AnalyticsExportPayload,
  CourseGroup,
  FinalControlForm,
} from "../../src/lib/excel/analyticsExport.types";

import {
  exportKtpToExcelFromTemplate,
  importJournalFromBuffer,
  parseEducationalScheduleFromBuffer,
} from "./lib/imports";
import type {
  JournalImportSummary,
  ParseResult,
} from "../../src/lib/excel/imports.types";

// ============================================================================
// Journal Export Action
// ============================================================================

export const exportJournal = action({
  args: {
    groupName: v.string(),
    courseLabel: v.string(),
    specialtyLabel: v.optional(v.string()),
    academicYearLabel: v.optional(v.string()),
    disciplineTitle: v.string(),
    teacherFullName: v.optional(v.string()),
    finalControlForm: v.optional(v.union(v.string(), v.null())),
    students: v.array(
      v.object({
        id: v.string(),
        fullName: v.string(),
        attendance: v.optional(
          v.array(v.union(v.string(), v.number(), v.null()))
        ),
        date: v.optional(v.union(v.string(), v.null())),
        hours: v.optional(v.union(v.number(), v.string(), v.null())),
        topic: v.optional(v.union(v.string(), v.null())),
        finalGrade: v.optional(v.union(v.string(), v.number(), v.null())),
      })
    ),
    lessonDates: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    const payload: JournalExportPayload = {
      groupName: args.groupName,
      courseLabel: args.courseLabel,
      specialtyLabel: args.specialtyLabel,
      academicYearLabel: args.academicYearLabel,
      disciplineTitle: args.disciplineTitle,
      teacherFullName: args.teacherFullName,
      finalControlForm: args.finalControlForm,
      students: args.students as JournalStudentRow[],
      lessonDates: args.lessonDates,
    };

    const buffer = await exportJournalToExcel(payload);
    const storageId = await ctx.storage.store(
      new Blob([new Uint8Array(buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    );
    return storageId;
  },
});

// ============================================================================
// Teacher Workload Export Action
// ============================================================================

export const exportTeacherWorkload = action({
  args: {
    institutionName: v.string(),
    teacherFullName: v.string(),
    academicYear: v.string(),
    month: v.string(),
    entries: v.array(
      v.object({
        rowNumber: v.number(),
        moduleIndex: v.string(),
        subjectName: v.string(),
        groupName: v.string(),
        dailyHours: v.array(v.union(v.number(), v.null())),
        monthTotal: v.number(),
        plannedHours: v.number(),
        actualHours: v.number(),
        cumulativeHours: v.number(),
        remainingHours: v.number(),
      })
    ),
    summaryEntries: v.array(
      v.object({
        groupName: v.string(),
        moduleIndex: v.string(),
        subjectName: v.string(),
        plannedHours: v.number(),
        actualHours: v.number(),
        facultativePlanned: v.optional(v.number()),
        facultativeActual: v.optional(v.number()),
        consultationsPlanned: v.optional(v.number()),
        consultationsActual: v.optional(v.number()),
        examsPlanned: v.optional(v.number()),
        examsActual: v.optional(v.number()),
        totalHours: v.number(),
      })
    ),
    monthlyDistribution: v.array(
      v.object({
        groupName: v.string(),
        monthlyHours: v.record(v.string(), v.number()),
        total: v.number(),
      })
    ),
    months: v.optional(
      v.array(
        v.object({
          key: v.string(),
          name: v.string(),
          year: v.number(),
          month: v.number(),
        })
      )
    ),
    allMonthsWorkload: v.optional(
      v.array(
        v.object({
          monthInfo: v.object({
            key: v.string(),
            name: v.string(),
            year: v.number(),
            month: v.number(),
          }),
          entries: v.array(
            v.object({
              rowNumber: v.number(),
              moduleIndex: v.string(),
              subjectName: v.string(),
              groupName: v.string(),
              dailyHours: v.array(v.union(v.number(), v.null())),
              monthTotal: v.number(),
              plannedHours: v.number(),
              actualHours: v.number(),
              cumulativeHours: v.number(),
              remainingHours: v.number(),
            })
          ),
          totalHours: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    const monthlyDistribution: MonthlyDistributionEntry[] = args.monthlyDistribution.map(
      (entry) => ({
        groupName: entry.groupName,
        september: entry.monthlyHours.september ?? 0,
        october: entry.monthlyHours.october ?? 0,
        november: entry.monthlyHours.november ?? 0,
        december: entry.monthlyHours.december ?? 0,
        january: entry.monthlyHours.january ?? 0,
        february: entry.monthlyHours.february ?? 0,
        march: entry.monthlyHours.march ?? 0,
        april: entry.monthlyHours.april ?? 0,
        may: entry.monthlyHours.may ?? 0,
        june: entry.monthlyHours.june ?? 0,
        total: entry.total,
      })
    );

    const payload: TeacherWorkloadExportPayload = {
      institutionName: args.institutionName,
      teacherFullName: args.teacherFullName,
      academicYear: args.academicYear,
      month: args.month,
      entries: args.entries as WorkloadEntry[],
      summaryEntries: args.summaryEntries as WorkloadSummaryEntry[],
      monthlyDistribution,
      months: args.months,
      allMonthsWorkload: args.allMonthsWorkload as MonthWorkloadData[] | undefined,
    };

    const buffer = await exportTeacherWorkloadToExcel(payload);
    const storageId = await ctx.storage.store(
      new Blob([new Uint8Array(buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    );
    return storageId;
  },
});

// ============================================================================
// Analytics Export Action
// ============================================================================

export const exportAnalytics = action({
  args: {
    courseGroups: v.array(
      v.object({
        course: v.string(),
        specialtyGroups: v.array(
          v.object({
            specialtyName: v.string(),
            disciplinesSemester: v.array(
              v.object({
                id: v.string(),
                title: v.string(),
              })
            ),
            disciplinesWithoutFinal: v.array(
              v.object({
                id: v.string(),
                title: v.string(),
              })
            ),
            disciplinesByForm: v.record(
              v.string(),
              v.array(
                v.object({
                  id: v.string(),
                  title: v.string(),
                })
              )
            ),
            rows: v.array(
              v.object({
                index: v.number(),
                fullName: v.string(),
                semester: v.record(v.string(), v.union(v.string(), v.number())),
                withoutFinal: v.record(
                  v.string(),
                  v.union(v.string(), v.number())
                ),
                finals: v.record(
                  v.string(),
                  v.record(v.string(), v.union(v.string(), v.number()))
                ),
                overallAverage: v.optional(v.union(v.string(), v.number())),
              })
            ),
          })
        ),
      })
    ),
    finalForms: v.array(
      v.object({
        id: v.string(),
        shortName: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    const payload: AnalyticsExportPayload = {
      courseGroups: args.courseGroups as CourseGroup[],
      finalForms: args.finalForms as FinalControlForm[],
    };

    const buffer = await exportAnalyticsToExcel(payload);
    const storageId = await ctx.storage.store(
      new Blob([new Uint8Array(buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    );
    return storageId;
  },
});

// ============================================================================
// Journal Import Action
// ============================================================================

export const importJournal = action({
  args: {
    fileBuffer: v.array(v.number()),
  },
  handler: async (ctx, args): Promise<JournalImportSummary> => {
    void ctx;
    const buffer = new Uint8Array(args.fileBuffer).buffer;
    return await importJournalFromBuffer(buffer);
  },
});

// ============================================================================
// Educational Schedule Parse Action
// ============================================================================

export const parseEducationalSchedule = action({
  args: {
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args): Promise<ParseResult> => {
    const fileBlob = await ctx.storage.get(args.fileStorageId);
    if (!fileBlob) {
      throw new Error("File not found in storage");
    }
    const buffer = await fileBlob.arrayBuffer();
    return await parseEducationalScheduleFromBuffer(buffer, args.fileName);
  },
});

// ============================================================================
// KTP Export Action
// ============================================================================

export const exportKtpToExcel = action({
  args: {
    dataRows: v.array(v.array(v.union(v.string(), v.number(), v.null()))),
    templateStorageId: v.id("_storage"),
    learningOutcome: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ storageId: Id<"_storage">; filename: string }> => {
    // Get the template file from storage
    const templateBlob = await ctx.storage.get(args.templateStorageId);
    if (!templateBlob) {
      throw new Error("Template file not found in storage");
    }
    const templateBuf = await templateBlob.arrayBuffer();

    const buffer = await exportKtpToExcelFromTemplate(args.dataRows, templateBuf);
    const storageId = await ctx.storage.store(
      new Blob([new Uint8Array(buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    );

    // Generate filename based on learning outcome
    const filename = args.learningOutcome
      ? `РУП_${args.learningOutcome}.xlsx`
      : "РУП.xlsx";

    return { storageId, filename };
  },
});

// ============================================================================
// Bulk Journal Export to Zip Action
// ============================================================================

export const exportJournalsZip = action({
  args: {
    journals: v.array(
      v.object({
        filename: v.string(),
        groupName: v.string(),
        courseLabel: v.string(),
        specialtyLabel: v.optional(v.string()),
        academicYearLabel: v.optional(v.string()),
        disciplineTitle: v.string(),
        teacherFullName: v.optional(v.string()),
        finalControlForm: v.optional(v.union(v.string(), v.null())),
        students: v.array(
          v.object({
            id: v.string(),
            fullName: v.string(),
            attendance: v.optional(
              v.array(v.union(v.string(), v.number(), v.null()))
            ),
            date: v.optional(v.union(v.string(), v.null())),
            hours: v.optional(v.union(v.number(), v.string(), v.null())),
            topic: v.optional(v.union(v.string(), v.null())),
            finalGrade: v.optional(v.union(v.string(), v.number(), v.null())),
          })
        ),
        lessonDates: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    // Import JSZip dynamically
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Generate Excel files for each journal in parallel and add to zip
    const results = await Promise.all(
      args.journals.map(async (journalData) => {
        const payload: JournalExportPayload = {
          groupName: journalData.groupName,
          courseLabel: journalData.courseLabel,
          specialtyLabel: journalData.specialtyLabel,
          academicYearLabel: journalData.academicYearLabel,
          disciplineTitle: journalData.disciplineTitle,
          teacherFullName: journalData.teacherFullName,
          finalControlForm: journalData.finalControlForm,
          students: journalData.students as JournalStudentRow[],
          lessonDates: journalData.lessonDates,
        };

        const buffer = await exportJournalToExcel(payload);
        return { filename: journalData.filename, buffer };
      })
    );

    for (const { filename, buffer } of results) {
      zip.file(filename, buffer);
    }

    // Generate the zip file
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    // Store in Convex storage
    const storageId = await ctx.storage.store(
      new Blob([zipBuffer], {
        type: 'application/zip'
      })
    );

    return storageId;
  },
});

// ============================================================================
// Server-Side Bulk Journal Export (fetches marks from DB, no data ping-pong)
// ============================================================================

export const exportJournalsZipServerSide = action({
  args: {
    journals: v.array(
      v.object({
        calendarEventId: v.string(),
        filename: v.string(),
        groupName: v.string(),
        courseLabel: v.string(),
        specialtyLabel: v.optional(v.string()),
        academicYearLabel: v.optional(v.string()),
        disciplineTitle: v.string(),
        teacherFullName: v.optional(v.string()),
        finalControlForm: v.optional(v.union(v.string(), v.null())),
        // Students: only IDs and names — marks are fetched server-side
        students: v.array(
          v.object({
            id: v.string(),
            fullName: v.string(),
          })
        ),
        // Mark column structure (template from first student)
        markColumns: v.optional(v.array(
          v.object({
            type: v.string(),
            label: v.string(),
            isoDate: v.optional(v.union(v.string(), v.null())),
            controlType: v.optional(v.union(v.string(), v.null())),
          })
        )),
      })
    ),
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    const { internal } = await import("../_generated/api");
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Generate Excel files for each journal in parallel
    const results = await Promise.all(
      args.journals.map(async (journalData) => {
        // 1. Resolve backend journal ID from calendarEventId
        const journal = await ctx.runQuery(
          internal.excel.serverExportQueries.getJournalByCalendarEvent,
          { calendarEventId: journalData.calendarEventId }
        );

        if (!journal) {
          return null; // Skip journals without backend data
        }

        // 2. Fetch marks directly from DB (no frontend round-trip)
        const marksData = await ctx.runQuery(
          internal.excel.serverExportQueries.getMarksForExport,
          { journalId: journal._id }
        );

        // 3. Build student rows with attendance from server-side marks
        const markColumns = journalData.markColumns || [];
        const lessonDates = markColumns.map((col) => col.label);

        const studentRows: JournalStudentRow[] = journalData.students.map((student) => {
          const studentMarksMap = marksData.studentMarks[student.id];

          // Build attendance array matching column order
          const attendance: (string | number | null)[] = markColumns.map((_, colIndex) => {
            if (!studentMarksMap || !studentMarksMap[colIndex]) return "";
            const colMarks = studentMarksMap[colIndex];
            // Combine row values (multiple rows per column for date marks)
            const rowValues = Object.values(colMarks)
              .filter((v) => v !== null && v !== "")
              .map((v) => String(v).trim());
            return rowValues.length > 0 ? rowValues.join(" / ") : "";
          });

          // Extract final grade from session marks with controlType "final"
          let finalGrade: string | undefined;
          for (let colIndex = 0; colIndex < markColumns.length; colIndex++) {
            const col = markColumns[colIndex];
            if (col.type === "session" && col.controlType === "final") {
              const colMarks = studentMarksMap?.[colIndex];
              if (colMarks) {
                const val = colMarks[0]; // First row
                if (val !== null && val !== undefined && val !== "") {
                  finalGrade = String(val);
                }
              }
              break;
            }
          }

          return {
            id: student.id,
            fullName: student.fullName,
            attendance,
            finalGrade,
          };
        });

        const payload: JournalExportPayload = {
          groupName: journalData.groupName,
          courseLabel: journalData.courseLabel,
          specialtyLabel: journalData.specialtyLabel,
          academicYearLabel: journalData.academicYearLabel,
          disciplineTitle: journalData.disciplineTitle,
          teacherFullName: journalData.teacherFullName,
          finalControlForm: journalData.finalControlForm,
          students: studentRows,
          lessonDates,
        };

        const buffer = await exportJournalToExcel(payload);
        return { filename: journalData.filename, buffer };
      })
    );

    // Add all successfully generated files to zip
    for (const result of results) {
      if (result) {
        zip.file(result.filename, result.buffer);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    const storageId = await ctx.storage.store(
      new Blob([zipBuffer], { type: "application/zip" })
    );

    return storageId;
  },
});

