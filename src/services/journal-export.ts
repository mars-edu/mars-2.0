import * as ExcelJS from 'exceljs';
import { generateJournalTemplate, calculateColumnLayout } from './journal-template-generator';
import { getEventDays } from "@/utils/eventDate";
import type { CalendarEvent } from "@/stores/calendarStore";

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
  templateUrl?: string; // Kept for backward compatibility, but not used
  groupName: string;
  courseLabel: string;
  specialtyLabel?: string;
  academicYearLabel?: string;
  disciplineTitle: string;
  teacherFullName?: string;
  finalControlForm?: string | null; // e.g., "Экзамен", "Зачет", etc.
  students: JournalStudentRow[];
  calendarEvent?: CalendarEvent | null;
  lessonDates?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const ROW_GROUP = 2;         // Row 2 (1-indexed)
const ROW_COURSE = 3;        // Row 3
const ROW_SPECIALTY = 4;     // Row 4
const ROW_ACADEMIC_YEAR = 5; // Row 5
const ROW_DISCIPLINE = 6;    // Row 6
const ROW_DATES = 9;         // Row 9 (lesson dates)
const ROW_DATA_START = 10;   // Row 10 (first student row)

const THIN_BORDER = {
  top: { style: 'thin' as const },
  right: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  left: { style: 'thin' as const },
};

const ARIAL_FONT = { name: 'Arial', size: 11 };

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeText(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function formatLessonDates(
  payload: JournalExportPayload
): string[] {
  if (payload.lessonDates && payload.lessonDates.length > 0) {
    return payload.lessonDates;
  }
  if (!payload.calendarEvent) return [];
  const days = getEventDays(payload.calendarEvent);
  return days.map(({ day }) => day.format("DD.MM.YY"));
}

/**
 * Set cell value with styling
 */
function setCellValue(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: string | number | null | undefined,
  options: {
    font?: Partial<ExcelJS.Font>;
    alignment?: Partial<ExcelJS.Alignment>;
    border?: Partial<ExcelJS.Borders>;
  } = {}
): void {
  const cell = sheet.getRow(row).getCell(col);

  if (value === null || value === undefined || value === '') {
    cell.value = null;
  } else {
    cell.value = value;
  }

  if (options.font) {
    cell.font = { ...ARIAL_FONT, ...options.font };
  }

  if (options.alignment) {
    cell.alignment = options.alignment;
  }

  if (options.border) {
    cell.border = options.border;
  }
}

// ============================================================================
// Main Export Function
// ============================================================================

export async function exportJournalToExcel(
  payload: JournalExportPayload
): Promise<Uint8Array> {
  // Format lesson dates
  const lessonDates = formatLessonDates(payload);
  const dateColumnsCount = Math.max(1, lessonDates.length); // At least 1 column

  // Generate template from scratch using ExcelJS with dynamic columns
  const workbook = generateJournalTemplate(dateColumnsCount);
  const sheet = workbook.getWorksheet('Журнал');

  if (!sheet) {
    throw new Error('Failed to create journal worksheet');
  }

  // Calculate column layout
  const layout = calculateColumnLayout(dateColumnsCount);

  // Update metadata in header rows
  if (payload.groupName) {
    const groupCell = sheet.getCell(`A${ROW_GROUP}`);
    groupCell.value = `Группа № ${normalizeText(payload.groupName)}`;
    groupCell.font = ARIAL_FONT;
    groupCell.alignment = { horizontal: 'left', vertical: 'middle' };
  }

  const courseCell = sheet.getCell(`A${ROW_COURSE}`);
  courseCell.value = `Курс (год): ${normalizeText(payload.courseLabel)}`;
  courseCell.font = ARIAL_FONT;
  courseCell.alignment = { horizontal: 'left', vertical: 'middle' };

  if (payload.specialtyLabel) {
    const specialtyCell = sheet.getCell(`A${ROW_SPECIALTY}`);
    specialtyCell.value = `Специальность (Профессия): ${normalizeText(payload.specialtyLabel)}`;
    specialtyCell.font = ARIAL_FONT;
    specialtyCell.alignment = { horizontal: 'left', vertical: 'middle' };
  }

  if (payload.academicYearLabel) {
    const yearCell = sheet.getCell(`A${ROW_ACADEMIC_YEAR}`);
    yearCell.value = `Учебный год: ${normalizeText(payload.academicYearLabel)}`;
    yearCell.font = ARIAL_FONT;
    yearCell.alignment = { horizontal: 'left', vertical: 'middle' };
  }

  const disciplineBlock = normalizeText(payload.disciplineTitle);
  const disciplineCell = sheet.getCell(`A${ROW_DISCIPLINE}`);
  disciplineCell.value = `Дисциплина: ${disciplineBlock}`;
  disciplineCell.font = ARIAL_FONT;
  disciplineCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  disciplineCell.border = THIN_BORDER;

  const teacherBlock = normalizeText(payload.teacherFullName || "");
  const teacherCell = sheet.getRow(ROW_DISCIPLINE).getCell(layout.colDate);
  teacherCell.value = teacherBlock
    ? `ПДП преподавателя: ${teacherBlock}`
    : 'ПДП преподавателя: ';
  teacherCell.font = ARIAL_FONT;
  teacherCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  teacherCell.border = THIN_BORDER;

  // Insert row 9 for lesson dates
  sheet.spliceRows(ROW_DATES, 0, []);
  sheet.getRow(ROW_DATES).height = 15;

  // Populate lesson dates in row 9
  lessonDates.forEach((date, index) => {
    const col = layout.colAttendanceStart + index;
    if (col <= layout.colAttendanceEnd) {
      setCellValue(sheet, ROW_DATES, col, date, {
        font: ARIAL_FONT,
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: THIN_BORDER,
      });
    }
  });

  // Add borders to all date cells (even empty ones)
  for (let col = layout.colAttendanceStart; col <= layout.colAttendanceEnd; col++) {
    const cell = sheet.getRow(ROW_DATES).getCell(col);
    if (!cell.value) {
      cell.border = THIN_BORDER;
    }
  }

  // Populate student data rows (only actual students, no empty rows)
  const dataStartRow = ROW_DATA_START;
  payload.students.forEach((student, index) => {
    const row = dataStartRow + index;

    // № п/п (student number)
    setCellValue(sheet, row, layout.colNumber, index + 1, {
      font: ARIAL_FONT,
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: THIN_BORDER,
    });

    // Student full name
    setCellValue(sheet, row, layout.colStudentName, student.fullName, {
      font: ARIAL_FONT,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
      border: THIN_BORDER,
    });

    // Attendance columns
    const attendance = student.attendance || [];
    for (let i = 0; i < dateColumnsCount; i++) {
      const col = layout.colAttendanceStart + i;
      const value = attendance[i] ?? '';
      setCellValue(sheet, row, col, value, {
        font: ARIAL_FONT,
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: THIN_BORDER,
      });
    }

    // Final control form column (same for all students)
    setCellValue(sheet, row, layout.colFinalControlForm, payload.finalControlForm ?? '', {
      font: ARIAL_FONT,
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: THIN_BORDER,
    });

    // Final grade column
    setCellValue(sheet, row, layout.colFinalGrade, student.finalGrade ?? '', {
      font: ARIAL_FONT,
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: THIN_BORDER,
    });

    // Journal columns (date, hours, topic, signatures)
    setCellValue(sheet, row, layout.colDate, student.date ?? '', {
      font: ARIAL_FONT,
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: THIN_BORDER,
    });

    setCellValue(sheet, row, layout.colHours, student.hours ?? '', {
      font: ARIAL_FONT,
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: THIN_BORDER,
    });

    setCellValue(sheet, row, layout.colTopic, student.topic ?? '', {
      font: ARIAL_FONT,
      alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
      border: THIN_BORDER,
    });

    // Teacher and accompanist signature columns (empty)
    setCellValue(sheet, row, layout.colTeacherSig, '', {
      font: ARIAL_FONT,
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: THIN_BORDER,
    });

    setCellValue(sheet, row, layout.colAccompanistSig, '', {
      font: ARIAL_FONT,
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: THIN_BORDER,
    });
  });

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
