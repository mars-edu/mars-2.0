/**
 * Journal Export - Convex Backend
 * Generates attendance journal Excel files
 */

import * as Excel from "exceljs/dist/exceljs.min.js";
import type * as ExcelJS from "exceljs";
import {
  ARIAL_FONT,
  ARIAL_BOLD_FONT,
  normalizeText,
  setCellValue,
  columnNumberToLetter,
} from "./_utils";

// ============================================================================
// Type Definitions
// ============================================================================

export interface JournalStudentRow {
  id: string;
  fullName: string;
  attendance?: (string | number | null)[];
  date?: string | null;
  hours?: number | string | null;
  topic?: string | null;
  finalGrade?: string | number | null;
}

export interface JournalExportPayload {
  groupName: string;
  courseLabel: string;
  specialtyLabel?: string;
  academicYearLabel?: string;
  disciplineTitle: string;
  teacherFullName?: string;
  finalControlForm?: string | null;
  students: JournalStudentRow[];
  lessonDates?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const ROW_GROUP = 2;
const ROW_COURSE = 3;
const ROW_SPECIALTY = 4;
const ROW_ACADEMIC_YEAR = 5;
const ROW_DISCIPLINE = 6;
const ROW_DATES = 9;
const ROW_DATA_START = 10;

const THIN_BORDER = {
  top: { style: "thin" as const },
  right: { style: "thin" as const },
  bottom: { style: "thin" as const },
  left: { style: "thin" as const },
};

// ============================================================================
// Column Layout Calculator
// ============================================================================

export interface JournalColumnLayout {
  colNumber: number;
  colStudentName: number;
  colAttendanceStart: number;
  colAttendanceEnd: number;
  colFinalControlForm: number;
  colFinalGrade: number;
  colDate: number;
  colHours: number;
  colTopic: number;
  colTeacherSig: number;
  colAccompanistSig: number;
  totalColumns: number;
}

export function calculateColumnLayout(dateColumnsCount: number): JournalColumnLayout {
  const colNumber = 1;
  const colStudentName = 2;
  const colAttendanceStart = 3;
  const colAttendanceEnd = colAttendanceStart + dateColumnsCount - 1;
  const colFinalControlForm = colAttendanceEnd + 1;
  const colFinalGrade = colFinalControlForm + 1;
  const colDate = colFinalGrade + 1;
  const colHours = colDate + 1;
  const colTopic = colHours + 1;
  const colTeacherSig = colTopic + 1;
  const colAccompanistSig = colTeacherSig + 1;

  return {
    colNumber,
    colStudentName,
    colAttendanceStart,
    colAttendanceEnd,
    colFinalControlForm,
    colFinalGrade,
    colDate,
    colHours,
    colTopic,
    colTeacherSig,
    colAccompanistSig,
    totalColumns: colAccompanistSig,
  };
}

// ============================================================================
// Template Generator
// ============================================================================

function generateJournalTemplate(dateColumnsCount: number = 10): { workbook: ExcelJS.Workbook; layout: JournalColumnLayout } {
  const workbook: ExcelJS.Workbook = new Excel.Workbook();

  workbook.creator = "MARS 2.0";
  workbook.created = new Date();
  workbook.modified = new Date();

  const layout = calculateColumnLayout(dateColumnsCount);

  const sheet = workbook.addWorksheet("Журнал", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
    },
    properties: {
      defaultRowHeight: 15,
    },
  });

  // Set column widths
  sheet.getColumn(layout.colNumber).width = 5;
  sheet.getColumn(layout.colStudentName).width = 25;

  for (let col = layout.colAttendanceStart; col <= layout.colAttendanceEnd; col++) {
    sheet.getColumn(col).width = 6;
  }

  sheet.getColumn(layout.colFinalControlForm).width = 15;
  sheet.getColumn(layout.colFinalGrade).width = 10;
  sheet.getColumn(layout.colDate).width = 12;
  sheet.getColumn(layout.colHours).width = 8;
  sheet.getColumn(layout.colTopic).width = 30;
  sheet.getColumn(layout.colTeacherSig).width = 15;
  sheet.getColumn(layout.colAccompanistSig).width = 15;

  // Set row heights
  sheet.getRow(6).height = 60;
  sheet.getRow(8).height = 90;

  // Row 1: Title
  const titleCell = sheet.getCell("A1");
  titleCell.value = "УЧЕТ ПОСЕЩАЕМОСТИ ЗАНЯТИЙ И УСПЕВАЕМОСТИ ОБУЧАЮЩИХСЯ";
  titleCell.font = ARIAL_BOLD_FONT;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells(`A1:${columnNumberToLetter(layout.totalColumns)}1`);

  // Row 2: Group info
  const groupCell = sheet.getCell("A2");
  groupCell.value = "Группа № ";
  groupCell.font = ARIAL_FONT;
  groupCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.mergeCells(`A2:${columnNumberToLetter(layout.colAttendanceEnd)}2`);

  // Row 3: Course
  const courseCell = sheet.getCell("A3");
  courseCell.value = "Курс (год): ";
  courseCell.font = ARIAL_FONT;
  courseCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.mergeCells(`A3:${columnNumberToLetter(layout.colAttendanceEnd)}3`);

  // Row 4: Specialty
  const specialtyCell = sheet.getCell("A4");
  specialtyCell.value = "Специальность (Профессия): ";
  specialtyCell.font = ARIAL_FONT;
  specialtyCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.mergeCells(`A4:${columnNumberToLetter(layout.colAttendanceEnd)}4`);

  // Row 5: Academic year
  const yearCell = sheet.getCell("A5");
  yearCell.value = "Учебный год: ";
  yearCell.font = ARIAL_FONT;
  yearCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.mergeCells(`A5:${columnNumberToLetter(layout.colAttendanceEnd)}5`);

  // Row 6: Discipline & Teacher
  const disciplineCell = sheet.getCell("A6");
  disciplineCell.value = "Дисциплина: ";
  disciplineCell.font = ARIAL_FONT;
  disciplineCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  disciplineCell.border = THIN_BORDER;
  sheet.mergeCells(`A6:${columnNumberToLetter(layout.colAttendanceEnd)}6`);

  const teacherCell = sheet.getCell(`${columnNumberToLetter(layout.colDate)}6`);
  teacherCell.value = "ПДП преподавателя: ";
  teacherCell.font = ARIAL_FONT;
  teacherCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  teacherCell.border = THIN_BORDER;
  sheet.mergeCells(
    `${columnNumberToLetter(layout.colDate)}6:${columnNumberToLetter(layout.totalColumns)}6`
  );

  // Row 7: Column header groups
  const studentHeaderCell = sheet.getCell("A7");
  studentHeaderCell.value = "Студенттер/Студенты";
  studentHeaderCell.font = ARIAL_BOLD_FONT;
  studentHeaderCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  studentHeaderCell.border = THIN_BORDER;
  sheet.mergeCells(`A7:${columnNumberToLetter(layout.colStudentName)}7`);

  const attendanceHeaderCell = sheet.getCell(`${columnNumberToLetter(layout.colAttendanceStart)}7`);
  attendanceHeaderCell.value = "Посещаемость и успеваемость";
  attendanceHeaderCell.font = ARIAL_BOLD_FONT;
  attendanceHeaderCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  attendanceHeaderCell.border = THIN_BORDER;
  sheet.mergeCells(
    `${columnNumberToLetter(layout.colAttendanceStart)}7:${columnNumberToLetter(layout.colFinalGrade)}7`
  );

  const journalHeaderCell = sheet.getCell(`${columnNumberToLetter(layout.colDate)}7`);
  journalHeaderCell.value = "Журнал";
  journalHeaderCell.font = ARIAL_BOLD_FONT;
  journalHeaderCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  journalHeaderCell.border = THIN_BORDER;
  sheet.mergeCells(
    `${columnNumberToLetter(layout.colDate)}7:${columnNumberToLetter(layout.totalColumns)}7`
  );

  // Row 8: Detailed column headers
  const headerNumber = sheet.getCell(`${columnNumberToLetter(layout.colNumber)}8`);
  headerNumber.value = "№ п/п";
  headerNumber.font = ARIAL_BOLD_FONT;
  headerNumber.border = THIN_BORDER;
  headerNumber.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  const headerName = sheet.getCell(`${columnNumberToLetter(layout.colStudentName)}8`);
  headerName.value = "Фамилия имя отчество /Тегі, аты, әкесінің аты";
  headerName.font = ARIAL_BOLD_FONT;
  headerName.border = THIN_BORDER;
  headerName.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  // Attendance date columns (with 90° rotation)
  for (let col = layout.colAttendanceStart; col <= layout.colAttendanceEnd; col++) {
    const cell = sheet.getCell(`${columnNumberToLetter(col)}8`);
    cell.value = "Дата";
    cell.font = ARIAL_BOLD_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
      textRotation: 90,
    };
  }

  // Final control form column
  const headerFinalControlForm = sheet.getCell(
    `${columnNumberToLetter(layout.colFinalControlForm)}8`
  );
  headerFinalControlForm.value = "Форма итогового контроля / Қорытынды бақылау нысаны";
  headerFinalControlForm.font = ARIAL_BOLD_FONT;
  headerFinalControlForm.border = THIN_BORDER;
  headerFinalControlForm.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  // Final grade column
  const headerFinalGrade = sheet.getCell(`${columnNumberToLetter(layout.colFinalGrade)}8`);
  headerFinalGrade.value = "Итог / Нәтиже";
  headerFinalGrade.font = ARIAL_BOLD_FONT;
  headerFinalGrade.border = THIN_BORDER;
  headerFinalGrade.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  // Journal columns
  const headerDate = sheet.getCell(`${columnNumberToLetter(layout.colDate)}8`);
  headerDate.value = "Дата занятия / Сабақтың күні";
  headerDate.font = ARIAL_BOLD_FONT;
  headerDate.border = THIN_BORDER;
  headerDate.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  const headerHours = sheet.getCell(`${columnNumberToLetter(layout.colHours)}8`);
  headerHours.value = "Кол-во часов / Сағат саны";
  headerHours.font = ARIAL_BOLD_FONT;
  headerHours.border = THIN_BORDER;
  headerHours.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  const headerTopic = sheet.getCell(`${columnNumberToLetter(layout.colTopic)}8`);
  headerTopic.value =
    "Наименование тем, критериев оценивания / Бағалау критерийлері, тақырыптар атауы";
  headerTopic.font = ARIAL_BOLD_FONT;
  headerTopic.border = THIN_BORDER;
  headerTopic.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  const headerTeacher = sheet.getCell(`${columnNumberToLetter(layout.colTeacherSig)}8`);
  headerTeacher.value = "ПДП преподавателя / Оқытушының қолы";
  headerTeacher.font = ARIAL_BOLD_FONT;
  headerTeacher.border = THIN_BORDER;
  headerTeacher.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  const headerAccompanist = sheet.getCell(`${columnNumberToLetter(layout.colAccompanistSig)}8`);
  headerAccompanist.value = "ПДП концертмейстера / Концертмейстердің қолы";
  headerAccompanist.font = ARIAL_BOLD_FONT;
  headerAccompanist.border = THIN_BORDER;
  headerAccompanist.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  return { workbook, layout };
}

// ============================================================================
// Main Export Function
// ============================================================================

export async function exportJournalToExcel(
  payload: JournalExportPayload
): Promise<Uint8Array> {
  const lessonDates = payload.lessonDates || [];
  const dateColumnsCount = Math.max(1, lessonDates.length);

  const { workbook, layout } = generateJournalTemplate(dateColumnsCount);
  const sheet = workbook.getWorksheet("Журнал");

  if (!sheet) {
    throw new Error("Failed to create journal worksheet");
  }

  // Update metadata
  if (payload.groupName) {
    const groupCell = sheet.getCell(`A${ROW_GROUP}`);
    groupCell.value = `Группа № ${normalizeText(payload.groupName)}`;
    groupCell.font = ARIAL_FONT;
    groupCell.alignment = { horizontal: "left", vertical: "middle" };
  }

  const courseCell = sheet.getCell(`A${ROW_COURSE}`);
  courseCell.value = `Курс (год): ${normalizeText(payload.courseLabel)}`;
  courseCell.font = ARIAL_FONT;
  courseCell.alignment = { horizontal: "left", vertical: "middle" };

  if (payload.specialtyLabel) {
    const specialtyCell = sheet.getCell(`A${ROW_SPECIALTY}`);
    specialtyCell.value = `Специальность (Профессия): ${normalizeText(payload.specialtyLabel)}`;
    specialtyCell.font = ARIAL_FONT;
    specialtyCell.alignment = { horizontal: "left", vertical: "middle" };
  }

  if (payload.academicYearLabel) {
    const yearCell = sheet.getCell(`A${ROW_ACADEMIC_YEAR}`);
    yearCell.value = `Учебный год: ${normalizeText(payload.academicYearLabel)}`;
    yearCell.font = ARIAL_FONT;
    yearCell.alignment = { horizontal: "left", vertical: "middle" };
  }

  const disciplineBlock = normalizeText(payload.disciplineTitle);
  const disciplineCell = sheet.getCell(`A${ROW_DISCIPLINE}`);
  disciplineCell.value = `Дисциплина: ${disciplineBlock}`;
  disciplineCell.font = ARIAL_FONT;
  disciplineCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  disciplineCell.border = THIN_BORDER;

  const teacherBlock = normalizeText(payload.teacherFullName || "");
  const teacherCell = sheet.getRow(ROW_DISCIPLINE).getCell(layout.colDate);
  teacherCell.value = teacherBlock
    ? `ПДП преподавателя: ${teacherBlock}`
    : "ПДП преподавателя: ";
  teacherCell.font = ARIAL_FONT;
  teacherCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  teacherCell.border = THIN_BORDER;

  // Row 9: lesson dates (row already exists empty in template, just set height)
  sheet.getRow(ROW_DATES).height = 15;

  // Pre-define reusable cell styles to avoid per-cell object allocation
  const STYLE_CENTERED = {
    font: ARIAL_FONT,
    alignment: { horizontal: "center" as const, vertical: "middle" as const },
    border: THIN_BORDER,
  };
  const STYLE_LEFT_WRAP = {
    font: ARIAL_FONT,
    alignment: { horizontal: "left" as const, vertical: "middle" as const, wrapText: true },
    border: THIN_BORDER,
  };
  const STYLE_CENTER_WRAP = {
    font: ARIAL_FONT,
    alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true },
    border: THIN_BORDER,
  };

  // Populate lesson dates
  lessonDates.forEach((date, index) => {
    const col = layout.colAttendanceStart + index;
    if (col <= layout.colAttendanceEnd) {
      setCellValue(sheet, ROW_DATES, col, date, STYLE_CENTER_WRAP);
    }
  });

  // Add borders to all date cells
  for (let col = layout.colAttendanceStart; col <= layout.colAttendanceEnd; col++) {
    const cell = sheet.getRow(ROW_DATES).getCell(col);
    if (!cell.value) {
      cell.border = THIN_BORDER;
    }
  }

  // Populate student data rows
  const dataStartRow = ROW_DATA_START;
  payload.students.forEach((student, index) => {
    const row = dataStartRow + index;

    // № п/п
    setCellValue(sheet, row, layout.colNumber, index + 1, STYLE_CENTERED);

    // Student full name
    setCellValue(sheet, row, layout.colStudentName, student.fullName, STYLE_LEFT_WRAP);

    // Attendance columns
    const attendance = student.attendance || [];
    for (let i = 0; i < dateColumnsCount; i++) {
      const col = layout.colAttendanceStart + i;
      const value = attendance[i] ?? "";
      setCellValue(sheet, row, col, value as string | number, STYLE_CENTERED);
    }

    // Final control form
    setCellValue(sheet, row, layout.colFinalControlForm, payload.finalControlForm ?? "", STYLE_CENTERED);

    // Final grade
    setCellValue(sheet, row, layout.colFinalGrade, student.finalGrade as string | number ?? "", STYLE_CENTERED);

    // Journal columns
    setCellValue(sheet, row, layout.colDate, student.date ?? "", STYLE_CENTERED);

    setCellValue(sheet, row, layout.colHours, student.hours as string | number ?? "", STYLE_CENTERED);

    setCellValue(sheet, row, layout.colTopic, student.topic ?? "", STYLE_LEFT_WRAP);

    // Teacher and accompanist signature columns (empty)
    setCellValue(sheet, row, layout.colTeacherSig, "", STYLE_CENTERED);

    setCellValue(sheet, row, layout.colAccompanistSig, "", STYLE_CENTERED);
  });

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
