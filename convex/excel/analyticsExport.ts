/**
 * Analytics Export - Convex Backend
 * Generates student performance analytics report Excel files
 * Migrated from xlsx-js-style to ExcelJS
 */

import * as ExcelJS from "exceljs";

// ============================================================================
// Type Definitions
// ============================================================================

export interface DisciplineInfo {
  id: string;
  title: string;
}

export interface FinalControlForm {
  id: string;
  shortName: string;
}

export interface StudentRow {
  index: number;
  fullName: string;
  semester: Record<string, string | number>;
  withoutFinal: Record<string, string | number>;
  finals: Record<string, Record<string, string | number>>;
  overallAverage?: string | number;
}

export interface SpecialtyGroup {
  specialtyName: string;
  disciplinesSemester: DisciplineInfo[];
  disciplinesWithoutFinal: DisciplineInfo[];
  disciplinesByForm: Record<string, DisciplineInfo[]>;
  rows: StudentRow[];
}

export interface CourseGroup {
  course: string;
  specialtyGroups: SpecialtyGroup[];
}

export interface AnalyticsExportPayload {
  courseGroups: CourseGroup[];
  finalForms: FinalControlForm[];
}

// ============================================================================
// Constants - Styles
// ============================================================================

const HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 11 },
  alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  },
  border: {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  },
};

const CELL_STYLE: Partial<ExcelJS.Style> = {
  alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  border: {
    top: { style: "thin", color: { argb: "FFE5E7EB" } },
    left: { style: "thin", color: { argb: "FFE5E7EB" } },
    right: { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
  },
};

const TITLE_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 13 },
  alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  },
  border: {
    top: { style: "thin", color: { argb: "FFD1D5DB" } },
    left: { style: "thin", color: { argb: "FFD1D5DB" } },
    right: { style: "thin", color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function applyStyle(cell: ExcelJS.Cell, style: Partial<ExcelJS.Style>): void {
  if (style.font) cell.font = style.font;
  if (style.alignment) cell.alignment = style.alignment;
  if (style.fill) cell.fill = style.fill as ExcelJS.Fill;
  if (style.border) cell.border = style.border;
}

// ============================================================================
// Sheet Builder
// ============================================================================

function buildCourseSheet(
  workbook: ExcelJS.Workbook,
  courseGroup: CourseGroup,
  finalForms: FinalControlForm[]
): ExcelJS.Worksheet | null {
  const sheet = workbook.addWorksheet(`Курс_${courseGroup.course}`.slice(0, 31));

  let currentRow = 1;

  // Course title row
  const titleCell = sheet.getCell(currentRow, 1);
  titleCell.value = `Курс ${courseGroup.course}`;
  applyStyle(titleCell, TITLE_STYLE);
  sheet.mergeCells(currentRow, 1, currentRow, 11);
  currentRow += 2;

  courseGroup.specialtyGroups.forEach((spec) => {
    // Specialty header
    const specCell = sheet.getCell(currentRow, 1);
    specCell.value = `Специальность: ${spec.specialtyName}`;
    applyStyle(specCell, HEADER_STYLE);
    sheet.mergeCells(currentRow, 1, currentRow, 11);
    currentRow += 1;

    const disciplinesSemester = spec.disciplinesSemester;
    const disciplinesWithoutFinal = spec.disciplinesWithoutFinal;

    // Build first header row (category labels)
    const firstHeaderRow = currentRow;
    let colIndex = 1;

    // Fixed columns: №, Ф.И.О.
    const numCell = sheet.getCell(firstHeaderRow, colIndex);
    numCell.value = "№";
    applyStyle(numCell, HEADER_STYLE);
    colIndex++;

    const nameCell = sheet.getCell(firstHeaderRow, colIndex);
    nameCell.value = "Ф.И.О.";
    applyStyle(nameCell, HEADER_STYLE);
    colIndex++;

    // Semester disciplines header
    if (disciplinesSemester.length > 0) {
      const semesterStart = colIndex;
      const semHeaderCell = sheet.getCell(firstHeaderRow, semesterStart);
      semHeaderCell.value = "Семестровые дисциплины";
      applyStyle(semHeaderCell, HEADER_STYLE);
      if (disciplinesSemester.length > 1) {
        sheet.mergeCells(
          firstHeaderRow,
          semesterStart,
          firstHeaderRow,
          semesterStart + disciplinesSemester.length - 1
        );
      }
      // Fill empty cells for merge
      for (let i = 1; i < disciplinesSemester.length; i++) {
        applyStyle(sheet.getCell(firstHeaderRow, semesterStart + i), HEADER_STYLE);
      }
      colIndex += disciplinesSemester.length;
    }

    // Without final control header
    if (disciplinesWithoutFinal.length > 0) {
      const withoutFinalStart = colIndex;
      const wfHeaderCell = sheet.getCell(firstHeaderRow, withoutFinalStart);
      wfHeaderCell.value = "Без итогового контроля";
      applyStyle(wfHeaderCell, HEADER_STYLE);
      if (disciplinesWithoutFinal.length > 1) {
        sheet.mergeCells(
          firstHeaderRow,
          withoutFinalStart,
          firstHeaderRow,
          withoutFinalStart + disciplinesWithoutFinal.length - 1
        );
      }
      for (let i = 1; i < disciplinesWithoutFinal.length; i++) {
        applyStyle(sheet.getCell(firstHeaderRow, withoutFinalStart + i), HEADER_STYLE);
      }
      colIndex += disciplinesWithoutFinal.length;
    }

    // Final forms headers
    finalForms.forEach((form) => {
      const ds = spec.disciplinesByForm[form.id] ?? [];
      if (ds.length === 0) return;

      const formStart = colIndex;
      const formHeaderCell = sheet.getCell(firstHeaderRow, formStart);
      formHeaderCell.value = form.shortName;
      applyStyle(formHeaderCell, HEADER_STYLE);
      if (ds.length > 1) {
        sheet.mergeCells(firstHeaderRow, formStart, firstHeaderRow, formStart + ds.length - 1);
      }
      for (let i = 1; i < ds.length; i++) {
        applyStyle(sheet.getCell(firstHeaderRow, formStart + i), HEADER_STYLE);
      }
      colIndex += ds.length;
    });

    // Average column header
    const avgStart = colIndex;
    const avgHeaderCell = sheet.getCell(firstHeaderRow, avgStart);
    avgHeaderCell.value = "Ср";
    applyStyle(avgHeaderCell, HEADER_STYLE);
    const totalCols = colIndex;

    currentRow++;

    // Build second header row (discipline names)
    const secondHeaderRow = currentRow;
    colIndex = 1;

    // Empty cells for № and Ф.И.О. (will be merged with first row)
    const emptyNum = sheet.getCell(secondHeaderRow, colIndex);
    emptyNum.value = "";
    applyStyle(emptyNum, HEADER_STYLE);
    colIndex++;

    const emptyName = sheet.getCell(secondHeaderRow, colIndex);
    emptyName.value = "";
    applyStyle(emptyName, HEADER_STYLE);
    colIndex++;

    // Semester discipline names
    disciplinesSemester.forEach((d) => {
      const cell = sheet.getCell(secondHeaderRow, colIndex);
      cell.value = d.title;
      applyStyle(cell, HEADER_STYLE);
      colIndex++;
    });

    // Without final discipline names
    disciplinesWithoutFinal.forEach((d) => {
      const cell = sheet.getCell(secondHeaderRow, colIndex);
      cell.value = d.title;
      applyStyle(cell, HEADER_STYLE);
      colIndex++;
    });

    // Final form discipline names
    finalForms.forEach((form) => {
      const ds = spec.disciplinesByForm[form.id] ?? [];
      ds.forEach((d) => {
        const cell = sheet.getCell(secondHeaderRow, colIndex);
        cell.value = d.title;
        applyStyle(cell, HEADER_STYLE);
        colIndex++;
      });
    });

    // Empty cell for average (will be merged)
    const emptyAvg = sheet.getCell(secondHeaderRow, colIndex);
    emptyAvg.value = "";
    applyStyle(emptyAvg, HEADER_STYLE);

    // Merge vertical cells for №, Ф.И.О., and Ср
    sheet.mergeCells(firstHeaderRow, 1, secondHeaderRow, 1); // №
    sheet.mergeCells(firstHeaderRow, 2, secondHeaderRow, 2); // Ф.И.О.
    sheet.mergeCells(firstHeaderRow, avgStart, secondHeaderRow, avgStart); // Ср

    currentRow++;

    // Data rows
    spec.rows.forEach((r) => {
      colIndex = 1;

      // Index
      const indexCell = sheet.getCell(currentRow, colIndex);
      indexCell.value = r.index;
      applyStyle(indexCell, CELL_STYLE);
      colIndex++;

      // Full name (left aligned)
      const fullNameCell = sheet.getCell(currentRow, colIndex);
      fullNameCell.value = r.fullName;
      applyStyle(fullNameCell, CELL_STYLE);
      fullNameCell.alignment = { ...CELL_STYLE.alignment, horizontal: "left" };
      colIndex++;

      // Semester grades
      disciplinesSemester.forEach((d) => {
        const cell = sheet.getCell(currentRow, colIndex);
        cell.value = r.semester[d.id] ?? "—";
        applyStyle(cell, CELL_STYLE);
        colIndex++;
      });

      // Without final grades
      disciplinesWithoutFinal.forEach((d) => {
        const cell = sheet.getCell(currentRow, colIndex);
        cell.value = r.withoutFinal[d.id] ?? "—";
        applyStyle(cell, CELL_STYLE);
        colIndex++;
      });

      // Final form grades
      finalForms.forEach((form) => {
        const ds = spec.disciplinesByForm[form.id] ?? [];
        ds.forEach((d) => {
          const cell = sheet.getCell(currentRow, colIndex);
          cell.value = r.finals[form.id]?.[d.id] ?? "—";
          applyStyle(cell, CELL_STYLE);
          colIndex++;
        });
      });

      // Overall average
      const avgCell = sheet.getCell(currentRow, colIndex);
      avgCell.value = r.overallAverage ?? "—";
      applyStyle(avgCell, CELL_STYLE);

      currentRow++;
    });

    currentRow++; // Empty row between specialties
  });

  // Set column widths
  sheet.getColumn(1).width = 5; // №
  sheet.getColumn(2).width = 40; // Ф.И.О.
  for (let i = 3; i <= 50; i++) {
    sheet.getColumn(i).width = 12;
  }

  // Set row heights
  sheet.eachRow((row) => {
    row.height = 18;
  });

  return sheet;
}

// ============================================================================
// Main Export Function
// ============================================================================

export async function exportAnalyticsToExcel(
  payload: AnalyticsExportPayload
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "MARS 2.0";
  workbook.created = new Date();
  workbook.modified = new Date();

  payload.courseGroups.forEach((courseGroup) => {
    buildCourseSheet(workbook, courseGroup, payload.finalForms);
  });

  // If no sheets were created, add a placeholder
  if (workbook.worksheets.length === 0) {
    const sheet = workbook.addWorksheet("Нет данных");
    sheet.getCell("A1").value = "Нет данных для отображения";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
