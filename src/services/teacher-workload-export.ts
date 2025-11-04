/**
 * Teacher Workload Export - ExcelJS Version
 * Migrated from xlsx-js-style to ExcelJS
 */

import * as ExcelJS from 'exceljs';
import { generateWorkbookTemplate } from './excel-template-generator';
import {
  type ColumnTemplateMap,
  collectColumnTemplates,
  setCell,
  updateCellWithText,
  detectDataStartRow,
  getColumnRange,
  applyWorkloadGridStyles,
  getCell,
  applyDataCellStyle,
  applyHeaderCellStyle,
  applyTotalCellStyle,
} from './excel-utils';

// ============================================================================
// Type Definitions (kept same as original)
// ============================================================================

export interface WorkloadEntry {
  rowNumber: number;
  moduleIndex: string;
  subjectName: string;
  groupName: string;
  dailyHours: (number | null)[];
  monthTotal: number;
  plannedHours: number;
  actualHours: number;
  cumulativeHours: number;
  remainingHours: number;
}

export interface WorkloadSummaryEntry {
  groupName: string;
  moduleIndex: string;
  subjectName: string;
  plannedHours: number;
  actualHours: number;
  facultativePlanned?: number;
  facultativeActual?: number;
  consultationsPlanned?: number;
  consultationsActual?: number;
  examsPlanned?: number;
  examsActual?: number;
  totalHours: number;
}

export interface MonthlyDistributionEntry {
  groupName: string;
  september: number;
  october: number;
  november: number;
  december: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  total: number;
}

export interface TeacherWorkloadExportPayload {
  institutionName: string;
  teacherFullName: string;
  academicYear: string;
  month: string;
  entries: WorkloadEntry[];
  summaryEntries: WorkloadSummaryEntry[];
  monthlyDistribution: MonthlyDistributionEntry[];
}

// ============================================================================
// Main Export Function
// ============================================================================

export async function exportTeacherWorkloadToExcel(
  payload: TeacherWorkloadExportPayload
): Promise<Uint8Array> {
  // Generate template programmatically (no file loading needed)
  const workbook = generateWorkbookTemplate();

  // Get the three form sheets
  const form1Sheet = workbook.getWorksheet(1);
  const form2Sheet = workbook.getWorksheet(2);
  const form3Sheet = workbook.getWorksheet(3);

  if (!form1Sheet || !form2Sheet || !form3Sheet) {
    throw new Error('Template sheets are missing');
  }

  // Update text placeholders (search in more rows for Kilash name)
  updateCellWithText(form1Sheet, 'Килаш', payload.teacherFullName, 30);
  updateCellWithText(form1Sheet, '2024-2025', payload.academicYear, 30);
  updateCellWithText(form1Sheet, 'сентябрь', payload.month, 30);

  updateCellWithText(form2Sheet, 'Килаш', payload.teacherFullName, 60);
  updateCellWithText(form2Sheet, '2024-2025', payload.academicYear, 30);

  updateCellWithText(form3Sheet, 'Килаш', payload.teacherFullName, 30);
  updateCellWithText(form3Sheet, '2024-2025', payload.academicYear, 30);

  // ========== FORM 1: Daily Workload ==========
  await populateForm1(form1Sheet, payload);

  // ========== FORM 2: Summary by Subject/Group ==========
  await populateForm2(form2Sheet, payload);

  // ========== FORM 3: Monthly Distribution ==========
  await populateForm3(form3Sheet, payload);

  // Write workbook to buffer using ExcelJS (preserves all styling)
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

// ============================================================================
// Form 1 Population
// ============================================================================

async function populateForm1(
  worksheet: ExcelJS.Worksheet,
  payload: TeacherWorkloadExportPayload
): Promise<void> {
  // Find header row (row 8 in template, contains "№ п/п")
  const form1HeaderRow = detectDataStartRow(worksheet, ['№ п/п'], 20);
  // Data starts 2 rows after header (row 10 in template)
  // Form 1 has: Row 8 = header, Row 9 = day numbers, Row 10 = data
  const form1DataRow = form1HeaderRow + 2; // +2 to skip header row (8) and day numbers row (9), data starts at row 10

  const form1ColRange = getColumnRange(worksheet);

  // Collect column templates from the day numbers row (row 9)
  const form1Templates = collectColumnTemplates(
    worksheet,
    form1HeaderRow, // This is the day numbers row (row after header)
    form1ColRange.start,
    form1ColRange.end
  );

  // Only clear rows that will have data (don't create unnecessary empty rows)
  // Clear only up to the number of entries we have
  const clearEnd = form1DataRow + Math.max(payload.entries.length, 1); // At least 1 row

  for (let r = form1DataRow; r < clearEnd; r++) {
    for (let c = form1ColRange.start; c <= form1ColRange.end; c++) {
      setCell(worksheet, r, c, null, form1Templates);
    }
  }

  // Column offset: Template has data in column B (index 1), not column A (index 0)
  const COL_OFFSET = 1;

  // Header styles are already applied during template generation
  // No need to reapply them here

  // Populate data rows
  payload.entries.forEach((entry, index) => {
    const row = form1DataRow + index;

    // Column B: Row Number
    const rowNumCell = getCell(worksheet, row, COL_OFFSET + 0);
    rowNumCell.value = entry.rowNumber;
    applyDataCellStyle(rowNumCell, { numFmt: '0' });

    // Column C: Module Index
    const moduleCell = getCell(worksheet, row, COL_OFFSET + 1);
    moduleCell.value = entry.moduleIndex;
    applyDataCellStyle(moduleCell);

    // Column D: Subject Name
    const subjectCell = getCell(worksheet, row, COL_OFFSET + 2);
    subjectCell.value = entry.subjectName;
    applyDataCellStyle(subjectCell, { horizontal: 'left' });

    // Column E: Group Name
    const groupCell = getCell(worksheet, row, COL_OFFSET + 3);
    groupCell.value = entry.groupName;
    applyDataCellStyle(groupCell);

    // Daily hours columns start at column F (index 5 = COL_OFFSET + 4)
    entry.dailyHours.forEach((hours, dayIndex) => {
      const col = COL_OFFSET + 4 + dayIndex;
      const cell = getCell(worksheet, row, col);
      cell.value = hours;
      applyDataCellStyle(cell, { numFmt: '0.0' });
    });

    // Summary columns (6 columns after month total)
    const monthTotalCol = COL_OFFSET + 4 + entry.dailyHours.length;

    // Column AK: Month Total
    const totalCell = getCell(worksheet, row, monthTotalCol);
    totalCell.value = entry.monthTotal;
    applyTotalCellStyle(totalCell, false);

    // Column AL: Group Name (duplicate from column E)
    const summaryGroupCell = getCell(worksheet, row, monthTotalCol + 1);
    summaryGroupCell.value = entry.groupName;
    applyDataCellStyle(summaryGroupCell);

    // Column AM: Subject Name (duplicate from column D)
    const summarySubjectCell = getCell(worksheet, row, monthTotalCol + 2);
    summarySubjectCell.value = entry.subjectName;
    applyDataCellStyle(summarySubjectCell, { horizontal: 'left' });

    // Column AN: Planned Hours
    const plannedCell = getCell(worksheet, row, monthTotalCol + 3);
    plannedCell.value = entry.plannedHours;
    applyDataCellStyle(plannedCell, { numFmt: '0.0' });

    // Column AO: Actual Hours (monthly)
    const actualCell = getCell(worksheet, row, monthTotalCol + 4);
    actualCell.value = entry.actualHours;
    applyDataCellStyle(actualCell, { numFmt: '0.0' });

    // Column AP: Cumulative Hours
    const cumulativeCell = getCell(worksheet, row, monthTotalCol + 5);
    cumulativeCell.value = entry.cumulativeHours;
    applyDataCellStyle(cumulativeCell, { numFmt: '0.0' });

    // Column AQ: Remaining Hours (last column - medium right border)
    const remainingCell = getCell(worksheet, row, monthTotalCol + 6);
    remainingCell.value = entry.remainingHours;
    applyDataCellStyle(remainingCell, { numFmt: '0.0' });
    remainingCell.border = {
      ...remainingCell.border,
      right: { style: 'medium', color: { argb: 'FF000000' } },
    };
  });

  // Styles already applied individually to each cell
}

// ============================================================================
// Form 2 Population
// ============================================================================

async function populateForm2(
  worksheet: ExcelJS.Worksheet,
  payload: TeacherWorkloadExportPayload
): Promise<void> {
  // Form 2 has: Rows 3-5 = multi-row header, Row 6 = column numbers (1,2,3...), Row 7 = data
  // We need to find row 6 which contains the column numbers
  // Looking for a row that has sequential numbers like "1", "2", "3"
  let form2HeaderRow = 6; // Default to row 6 (1-based)

  // Try to find the row with column numbers
  for (let r = 1; r <= 10; r++) {
    const rowObj = worksheet.getRow(r);
    let hasSequentialNumbers = false;
    let foundOne = false;
    let foundTwo = false;

    rowObj.eachCell((cell) => {
      const val = cell.value;
      if (val === 1 || val === '1') foundOne = true;
      if (val === 2 || val === '2') foundTwo = true;
    });

    if (foundOne && foundTwo) {
      form2HeaderRow = r;
      hasSequentialNumbers = true;
      break;
    }
  }

  const form2DataRow = form2HeaderRow + 1; // Data starts right after the column numbers row (next row)
  const form2ColRange = getColumnRange(worksheet);

  const form2Templates = collectColumnTemplates(
    worksheet,
    form2HeaderRow, // Collect templates from the column numbers row itself
    form2ColRange.start,
    form2ColRange.end
  );

  // Only clear rows that will have data (don't create unnecessary empty rows)
  const clearEnd = form2DataRow + Math.max(payload.summaryEntries.length, 1);

  for (let r = form2DataRow; r < clearEnd; r++) {
    for (let c = form2ColRange.start; c <= form2ColRange.end; c++) {
      setCell(worksheet, r, c, null, form2Templates);
    }
  }

  // Column offset: Template has data in column B (index 1)
  const COL_OFFSET = 1;

  // Header styles are already applied during template generation
  // No need to reapply them here

  // Populate data rows
  payload.summaryEntries.forEach((entry, index) => {
    const row = form2DataRow + index;

    // Combine moduleIndex and subjectName for display (e.g., "ООД 10 Всемирная история")
    const combinedSubjectName = entry.moduleIndex
      ? `${entry.moduleIndex} ${entry.subjectName}`
      : entry.subjectName;

    // Column B: Group Name
    const groupCell = getCell(worksheet, row, COL_OFFSET + 0);
    groupCell.value = entry.groupName;
    applyDataCellStyle(groupCell);

    // Column C: Subject Name (with Module Index)
    const subjectCell = getCell(worksheet, row, COL_OFFSET + 1);
    subjectCell.value = combinedSubjectName;
    applyDataCellStyle(subjectCell, { horizontal: 'left' });

    // Column D: Planned Hours
    const plannedCell = getCell(worksheet, row, COL_OFFSET + 2);
    plannedCell.value = entry.plannedHours;
    applyDataCellStyle(plannedCell, { numFmt: '0.0' });

    // Column E: Actual Hours
    const actualCell = getCell(worksheet, row, COL_OFFSET + 3);
    actualCell.value = entry.actualHours;
    applyDataCellStyle(actualCell, { numFmt: '0.0' });

    // Column F: Facultative Planned
    const facPlanCell = getCell(worksheet, row, COL_OFFSET + 4);
    facPlanCell.value = entry.facultativePlanned || null;
    applyDataCellStyle(facPlanCell, { numFmt: '0.0' });

    // Column G: Facultative Actual
    const facActualCell = getCell(worksheet, row, COL_OFFSET + 5);
    facActualCell.value = entry.facultativeActual || null;
    applyDataCellStyle(facActualCell, { numFmt: '0.0' });

    // Column H: Consultations Planned
    const consPlanCell = getCell(worksheet, row, COL_OFFSET + 6);
    consPlanCell.value = entry.consultationsPlanned || null;
    applyDataCellStyle(consPlanCell, { numFmt: '0.0' });

    // Column I: Consultations Actual
    const consActualCell = getCell(worksheet, row, COL_OFFSET + 7);
    consActualCell.value = entry.consultationsActual || null;
    applyDataCellStyle(consActualCell, { numFmt: '0.0' });

    // Column J: Exams Planned
    const examsPlanCell = getCell(worksheet, row, COL_OFFSET + 8);
    examsPlanCell.value = entry.examsPlanned || null;
    applyDataCellStyle(examsPlanCell, { numFmt: '0.0' });

    // Column K: Exams Actual
    const examsActualCell = getCell(worksheet, row, COL_OFFSET + 9);
    examsActualCell.value = entry.examsActual || null;
    applyDataCellStyle(examsActualCell, { numFmt: '0.0' });

    // Column L: Total Hours (last column)
    const totalCell = getCell(worksheet, row, COL_OFFSET + 10);
    totalCell.value = entry.totalHours;
    applyTotalCellStyle(totalCell, true);
  });

  // Styles already applied individually to each cell
}

// ============================================================================
// Form 3 Population
// ============================================================================

async function populateForm3(
  worksheet: ExcelJS.Worksheet,
  payload: TeacherWorkloadExportPayload
): Promise<void> {
  // Form 3: Header at row 15 (detected), data starts at row 16
  // Find header by looking for "сентябрь" or "Итого" or "Топтар"
  const form3HeaderRow = detectDataStartRow(worksheet, ['қыркүйек', 'сентябрь', 'Итого', 'Топтар'], 30);
  const form3DataRow = form3HeaderRow + 1; // Data starts right after header (row 16)

  const form3ColRange = getColumnRange(worksheet);

  const form3Templates = collectColumnTemplates(
    worksheet,
    form3HeaderRow, // Collect templates from header row itself
    form3ColRange.start,
    form3ColRange.end
  );

  // Only clear rows that will have data (don't create unnecessary empty rows)
  const clearEnd = form3DataRow + Math.max(payload.monthlyDistribution.length, 1);

  for (let r = form3DataRow; r < clearEnd; r++) {
    for (let c = form3ColRange.start; c <= form3ColRange.end; c++) {
      setCell(worksheet, r, c, null, form3Templates);
    }
  }

  // Column offset: Template has data in column B (index 1)
  const COL_OFFSET = 1;

  // Header styles are already applied during template generation
  // No need to reapply them here

  // Populate data rows
  payload.monthlyDistribution.forEach((entry, index) => {
    const row = form3DataRow + index;

    // Column B: Group Name
    const groupCell = getCell(worksheet, row, COL_OFFSET + 0);
    groupCell.value = entry.groupName;
    applyDataCellStyle(groupCell);

    // Columns C-L: September through June
    const monthValues = [
      entry.september,
      entry.october,
      entry.november,
      entry.december,
      entry.january,
      entry.february,
      entry.march,
      entry.april,
      entry.may,
      entry.june,
    ];

    monthValues.forEach((value, idx) => {
      const cell = getCell(worksheet, row, COL_OFFSET + 1 + idx);
      cell.value = value;
      applyDataCellStyle(cell, { numFmt: '0.0' });
    });

    // Column M: Total (last column)
    const totalCell = getCell(worksheet, row, COL_OFFSET + 11);
    totalCell.value = entry.total;
    applyTotalCellStyle(totalCell, true);
  });

  // Styles already applied individually to each cell
}
