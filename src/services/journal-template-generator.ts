/**
 * Journal Template Generator
 * Creates attendance journal template programmatically using ExcelJS
 * Generates dynamic structure based on actual data needs
 */

import * as ExcelJS from 'exceljs';

// ============================================================================
// Constants - Styling
// ============================================================================

const THIN_BORDER = {
  top: { style: 'thin' as const },
  right: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  left: { style: 'thin' as const },
};

const ARIAL_FONT = { name: 'Arial', size: 11 };
const ARIAL_BOLD_FONT = { name: 'Arial', size: 11, bold: true };

// ============================================================================
// Column Calculator
// ============================================================================

export interface JournalColumnLayout {
  colNumber: number;           // A - № п/п
  colStudentName: number;      // B - Фамилия имя отчество
  colAttendanceStart: number;  // C - First attendance column
  colAttendanceEnd: number;    // Variable - Last attendance column
  colFinalControlForm: number; // Форма итогового контроля
  colFinalGrade: number;       // Итог
  colDate: number;             // Дата занятия
  colHours: number;            // Кол-во часов
  colTopic: number;            // Наименование тем
  colTeacherSig: number;       // ПДП преподавателя
  colAccompanistSig: number;   // ПДП концертмейстера
  totalColumns: number;        // Total number of columns
}

/**
 * Calculate column layout based on number of date columns
 */
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

/**
 * Convert column number to Excel letter (1=A, 2=B, ..., 27=AA, 28=AB, etc.)
 */
function columnNumberToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

// ============================================================================
// Main Template Generator
// ============================================================================

/**
 * Generate journal workbook template with dynamic columns
 */
export function generateJournalTemplate(dateColumnsCount: number = 10): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'MARS 2.0';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Calculate column layout
  const layout = calculateColumnLayout(dateColumnsCount);

  // Create the journal sheet
  const sheet = workbook.addWorksheet('Журнал', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
    },
    properties: {
      defaultRowHeight: 15,
    },
  });

  // Set column widths
  sheet.getColumn(layout.colNumber).width = 5; // № п/п
  sheet.getColumn(layout.colStudentName).width = 25; // Student name - wider for readability

  // Attendance columns
  for (let col = layout.colAttendanceStart; col <= layout.colAttendanceEnd; col++) {
    sheet.getColumn(col).width = 6; // Compact for dates
  }

  // Final control and grade columns
  sheet.getColumn(layout.colFinalControlForm).width = 15; // Final control form
  sheet.getColumn(layout.colFinalGrade).width = 10; // Final grade

  // Journal columns
  sheet.getColumn(layout.colDate).width = 12; // Date
  sheet.getColumn(layout.colHours).width = 8; // Hours
  sheet.getColumn(layout.colTopic).width = 30; // Topic - wider for text
  sheet.getColumn(layout.colTeacherSig).width = 15; // Teacher signature
  sheet.getColumn(layout.colAccompanistSig).width = 15; // Accompanist signature

  // Set specific row heights
  sheet.getRow(6).height = 60; // Discipline & Teacher row
  sheet.getRow(8).height = 90; // Rotated headers row

  // Row 1: Title
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'УЧЕТ ПОСЕЩАЕМОСТИ ЗАНЯТИЙ И УСПЕВАЕМОСТИ ОБУЧАЮЩИХСЯ';
  titleCell.font = ARIAL_BOLD_FONT;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.mergeCells(`A1:${columnNumberToLetter(layout.totalColumns)}1`);

  // Row 2: Group info (placeholder - will be filled by export service)
  const groupCell = sheet.getCell('A2');
  groupCell.value = 'Группа № ';
  groupCell.font = ARIAL_FONT;
  groupCell.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.mergeCells(`A2:${columnNumberToLetter(layout.colAttendanceEnd)}2`);

  // Row 3: Course (placeholder)
  const courseCell = sheet.getCell('A3');
  courseCell.value = 'Курс (год): ';
  courseCell.font = ARIAL_FONT;
  courseCell.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.mergeCells(`A3:${columnNumberToLetter(layout.colAttendanceEnd)}3`);

  // Row 4: Specialty (placeholder)
  const specialtyCell = sheet.getCell('A4');
  specialtyCell.value = 'Специальность (Профессия): ';
  specialtyCell.font = ARIAL_FONT;
  specialtyCell.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.mergeCells(`A4:${columnNumberToLetter(layout.colAttendanceEnd)}4`);

  // Row 5: Academic year (placeholder)
  const yearCell = sheet.getCell('A5');
  yearCell.value = 'Учебный год: ';
  yearCell.font = ARIAL_FONT;
  yearCell.alignment = { horizontal: 'left', vertical: 'middle' };
  sheet.mergeCells(`A5:${columnNumberToLetter(layout.colAttendanceEnd)}5`);

  // Row 6: Discipline & Teacher info (placeholder)
  const disciplineCell = sheet.getCell('A6');
  disciplineCell.value = 'Дисциплина: ';
  disciplineCell.font = ARIAL_FONT;
  disciplineCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  disciplineCell.border = THIN_BORDER;
  sheet.mergeCells(`A6:${columnNumberToLetter(layout.colAttendanceEnd)}6`);

  const teacherCell = sheet.getCell(`${columnNumberToLetter(layout.colDate)}6`);
  teacherCell.value = 'ПДП преподавателя: ';
  teacherCell.font = ARIAL_FONT;
  teacherCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  teacherCell.border = THIN_BORDER;
  sheet.mergeCells(`${columnNumberToLetter(layout.colDate)}6:${columnNumberToLetter(layout.totalColumns)}6`);

  // Row 7: Column header groups (merged sections)
  const studentHeaderCell = sheet.getCell('A7');
  studentHeaderCell.value = 'Студенттер/Студенты';
  studentHeaderCell.font = ARIAL_BOLD_FONT;
  studentHeaderCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  studentHeaderCell.border = THIN_BORDER;
  sheet.mergeCells(`A7:${columnNumberToLetter(layout.colStudentName)}7`);

  const attendanceHeaderCell = sheet.getCell(`${columnNumberToLetter(layout.colAttendanceStart)}7`);
  attendanceHeaderCell.value = 'Посещаемость и успеваемость';
  attendanceHeaderCell.font = ARIAL_BOLD_FONT;
  attendanceHeaderCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  attendanceHeaderCell.border = THIN_BORDER;
  sheet.mergeCells(`${columnNumberToLetter(layout.colAttendanceStart)}7:${columnNumberToLetter(layout.colFinalGrade)}7`);

  const journalHeaderCell = sheet.getCell(`${columnNumberToLetter(layout.colDate)}7`);
  journalHeaderCell.value = 'Журнал';
  journalHeaderCell.font = ARIAL_BOLD_FONT;
  journalHeaderCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  journalHeaderCell.border = THIN_BORDER;
  sheet.mergeCells(`${columnNumberToLetter(layout.colDate)}7:${columnNumberToLetter(layout.totalColumns)}7`);

  // Row 8: Detailed column headers
  // Column A: № п/п
  const headerNumber = sheet.getCell(`${columnNumberToLetter(layout.colNumber)}8`);
  headerNumber.value = '№ п/п';
  headerNumber.font = ARIAL_BOLD_FONT;
  headerNumber.border = THIN_BORDER;
  headerNumber.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // Column B: Student name
  const headerName = sheet.getCell(`${columnNumberToLetter(layout.colStudentName)}8`);
  headerName.value = 'Фамилия имя отчество /Тегі, аты, әкесінің аты';
  headerName.font = ARIAL_BOLD_FONT;
  headerName.border = THIN_BORDER;
  headerName.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // Attendance date columns (with 90° rotation)
  for (let col = layout.colAttendanceStart; col <= layout.colAttendanceEnd; col++) {
    const cell = sheet.getCell(`${columnNumberToLetter(col)}8`);
    cell.value = 'Дата';
    cell.font = ARIAL_BOLD_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
      textRotation: 90,
    };
  }

  // Final control form column
  const headerFinalControlForm = sheet.getCell(`${columnNumberToLetter(layout.colFinalControlForm)}8`);
  headerFinalControlForm.value = 'Форма итогового контроля / Қорытынды бақылау нысаны';
  headerFinalControlForm.font = ARIAL_BOLD_FONT;
  headerFinalControlForm.border = THIN_BORDER;
  headerFinalControlForm.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // Final grade column
  const headerFinalGrade = sheet.getCell(`${columnNumberToLetter(layout.colFinalGrade)}8`);
  headerFinalGrade.value = 'Итог / Нәтиже';
  headerFinalGrade.font = ARIAL_BOLD_FONT;
  headerFinalGrade.border = THIN_BORDER;
  headerFinalGrade.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // Journal columns
  const headerDate = sheet.getCell(`${columnNumberToLetter(layout.colDate)}8`);
  headerDate.value = 'Дата занятия / Сабақтың күні';
  headerDate.font = ARIAL_BOLD_FONT;
  headerDate.border = THIN_BORDER;
  headerDate.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const headerHours = sheet.getCell(`${columnNumberToLetter(layout.colHours)}8`);
  headerHours.value = 'Кол-во часов / Сағат саны';
  headerHours.font = ARIAL_BOLD_FONT;
  headerHours.border = THIN_BORDER;
  headerHours.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const headerTopic = sheet.getCell(`${columnNumberToLetter(layout.colTopic)}8`);
  headerTopic.value = 'Наименование тем, критериев оценивания / Бағалау критерийлері, тақырыптар атауы';
  headerTopic.font = ARIAL_BOLD_FONT;
  headerTopic.border = THIN_BORDER;
  headerTopic.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const headerTeacher = sheet.getCell(`${columnNumberToLetter(layout.colTeacherSig)}8`);
  headerTeacher.value = 'ПДП преподавателя / Оқытушының қолы';
  headerTeacher.font = ARIAL_BOLD_FONT;
  headerTeacher.border = THIN_BORDER;
  headerTeacher.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  const headerAccompanist = sheet.getCell(`${columnNumberToLetter(layout.colAccompanistSig)}8`);
  headerAccompanist.value = 'ПДП концертмейстера / Концертмейстердің қолы';
  headerAccompanist.font = ARIAL_BOLD_FONT;
  headerAccompanist.border = THIN_BORDER;
  headerAccompanist.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  return workbook;
}

/**
 * Apply borders to a range of cells
 */
export function applyBordersToRange(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): void {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cell = sheet.getRow(row).getCell(col);
      cell.border = THIN_BORDER;
    }
  }
}
