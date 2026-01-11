/**
 * Excel Export and Import Actions
 *
 * Convex actions for generating and parsing Excel files on the backend.
 *
 * Uses the ExcelJS "dist" bundle to avoid Convex local bundling issues:
 * https://github.com/exceljs/exceljs/issues/348
 */

"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

import {
  exportJournalToExcel,
  type JournalExportPayload,
  type JournalStudentRow,
} from "../../src/lib/excel/journalExport";

import {
  exportTeacherWorkloadToExcel,
  type TeacherWorkloadExportPayload,
  type WorkloadEntry,
  type WorkloadSummaryEntry,
  type MonthlyDistributionEntry,
} from "../../src/lib/excel/workloadExport";

import {
  exportAnalyticsToExcel,
  type AnalyticsExportPayload,
  type CourseGroup,
  type FinalControlForm,
} from "../../src/lib/excel/analyticsExport";

import {
  exportKtpToExcelFromTemplate,
  importJournalFromBuffer,
  parseEducationalScheduleFromBuffer,
  type JournalImportSummary,
  type ParseResult,
} from "../../src/lib/excel/imports";

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
  handler: async (ctx, args): Promise<string> => {
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
        september: v.number(),
        october: v.number(),
        november: v.number(),
        december: v.number(),
        january: v.number(),
        february: v.number(),
        march: v.number(),
        april: v.number(),
        may: v.number(),
        june: v.number(),
        total: v.number(),
      })
    ),
  },
  handler: async (ctx, args): Promise<string> => {
    const payload: TeacherWorkloadExportPayload = {
      institutionName: args.institutionName,
      teacherFullName: args.teacherFullName,
      academicYear: args.academicYear,
      month: args.month,
      entries: args.entries as WorkloadEntry[],
      summaryEntries: args.summaryEntries as WorkloadSummaryEntry[],
      monthlyDistribution: args.monthlyDistribution as MonthlyDistributionEntry[],
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
  handler: async (ctx, args): Promise<string> => {
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
  handler: async (ctx, args): Promise<{ storageId: string; filename: string }> => {
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
  handler: async (ctx, args): Promise<string> => {
    // Import JSZip dynamically
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Generate Excel files for each journal and add to zip
    for (const journalData of args.journals) {
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
      zip.file(journalData.filename, buffer);
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

