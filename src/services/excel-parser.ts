import * as ExcelJS from 'exceljs';
import type {
  JournalImportSummary,
  JournalImportResult,
  JournalImportMetadata,
  JournalImportStudent,
  JournalImportValidationIssue,
} from "@/types/journal-import";

export interface ParsedLesson {
  lessonNumber: number;
  subject: string;
  hours: number | string;
  lessonType: string;
  homework: string;
  notes: string;
}

export interface ParseResult {
  metadata: {
    fileName: string;
    sheetName: string;
    totalLessons: number;
    headerRow: number;
    headers: string[];
    parsedAt: string;
  };
  lessons: ParsedLesson[];
}

function cleanString(value: any): string {
  if (value === null || value === undefined) return "";
  return value.toString().trim();
}

function parseHours(value: any): number | string {
  if (value === null || value === undefined) return 0;

  const str = value.toString().trim();
  const num = parseFloat(str.replace(",", "."));
  return isNaN(num) ? str : num;
}

/**
 * Convert ExcelJS worksheet to array of arrays
 */
function worksheetToArray(sheet: ExcelJS.Worksheet): any[][] {
  const result: any[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const rowData: any[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowData[colNumber - 1] = cell.value;
    });
    result[rowNumber - 1] = rowData;
  });
  return result;
}

/**
 * Get cell value as string
 */
function getCellValueAsString(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return '';

  // Handle rich text
  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    return cell.value.richText.map((rt: any) => rt.text).join('');
  }

  // Handle formulas
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return String(cell.value.result ?? '');
  }

  return String(cell.value);
}

/**
 * Detect which column contains lesson numbers (numeric values starting from 1)
 * Returns the column index (0-based for arrays)
 */
function detectLessonNumberColumn(rawData: any[][], headerRowIndex: number): number {
  // Check first 10 columns to find which one has numeric lesson numbers
  for (let col = 0; col < 10; col++) {
    let numericCount = 0;
    let sequentialCount = 0;
    const values: number[] = [];

    // Check up to 10 rows after header
    for (let i = 1; i <= Math.min(10, rawData.length - headerRowIndex - 1); i++) {
      const rowIndex = headerRowIndex + i;
      if (rowIndex >= rawData.length) break;

      const row = rawData[rowIndex];
      if (!row || !Array.isArray(row) || col >= row.length) continue;

      const cellValue = row[col];
      if (cellValue === null || cellValue === undefined) continue;

      const parsed = parseInt(String(cellValue).trim());
      if (!isNaN(parsed) && parsed > 0) {
        numericCount++;
        values.push(parsed);
      }
    }

    // Check if values are sequential (1, 2, 3, ...)
    if (values.length >= 2) {
      values.sort((a, b) => a - b);
      let isSequential = true;
      for (let i = 1; i < values.length; i++) {
        if (values[i] - values[i - 1] === 1) {
          sequentialCount++;
        }
      }

      // If we have at least 2 numeric values and they're mostly sequential, this is likely the lesson number column
      if (numericCount >= 2 && (sequentialCount >= numericCount - 2 || values[0] === 1)) {
        return col;
      }
    }
  }

  // Default to column 0 if no pattern found
  return 0;
}

export function parseEducationalSchedule(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.worksheets[0];
        if (!sheet) {
          throw new Error('No worksheet found in the Excel file');
        }

        const rawData = worksheetToArray(sheet);

        let headerRowIndex = -1;
        let headers: string[] = [];

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (
            row &&
            Array.isArray(row) &&
            row.length > 0 &&
            row.some((cell: any) => cell !== null && cell !== undefined)
          ) {
            headerRowIndex = i;
            headers = row.map((header: any) =>
              header ? header.toString().trim() : ""
            );
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error("No headers found in the Excel file");
        }

        // Detect which column contains lesson numbers
        const lessonNumberCol = detectLessonNumberColumn(rawData, headerRowIndex);
        console.log(`Detected lesson number column: ${lessonNumberCol} (Column ${String.fromCharCode(65 + lessonNumberCol)})`);

        const dataRows = [];
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (
            row &&
            Array.isArray(row) &&
            row.length > 0 &&
            row.some((cell: any) => cell !== null && cell !== undefined)
          ) {
            dataRows.push(row);
          }
        }

        const lessons: ParsedLesson[] = [];

        for (const row of dataRows) {
          // Use detected column offset
          const lessonNumberValue = row[lessonNumberCol];
          if (!Array.isArray(row) || !lessonNumberValue || isNaN(parseInt(String(lessonNumberValue))))
            continue;

          const lesson: ParsedLesson = {
            lessonNumber: parseInt(String(lessonNumberValue)),
            subject: cleanString(row[lessonNumberCol + 1]),
            hours: parseHours(row[lessonNumberCol + 2]),
            lessonType: cleanString(row[lessonNumberCol + 3]),
            homework: cleanString(row[lessonNumberCol + 4]),
            notes: cleanString(row[lessonNumberCol + 5]),
          };

          lessons.push(lesson);
        }

        const result: ParseResult = {
          metadata: {
            fileName: file.name,
            sheetName: sheet.name,
            totalLessons: lessons.length,
            headerRow: headerRowIndex,
            headers: headers,
            parsedAt: new Date().toISOString(),
          },
          lessons: lessons,
        };

        resolve(result);
      } catch (error) {
        console.error("Error parsing educational schedule:", error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function parseEducationalScheduleEnhanced(
  file: File
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const sheet = workbook.worksheets[0];
        if (!sheet) {
          throw new Error('No worksheet found');
        }

        // Find header row by checking first 10 columns
        let headerRow = 0;
        for (let r = 1; r <= 100; r++) {
          for (let c = 1; c <= 10; c++) {
            const cell = sheet.getRow(r).getCell(c);
            if (cell.value) {
              headerRow = r;
              break;
            }
          }
          if (headerRow > 0) break;
        }

        if (headerRow === 0) {
          throw new Error('No header row found');
        }

        // Detect lesson number column by checking multiple columns
        let lessonNumberCol = 1;
        for (let c = 1; c <= 10; c++) {
          let numericCount = 0;
          const values: number[] = [];

          for (let r = headerRow + 1; r <= Math.min(headerRow + 10, 100); r++) {
            const cell = sheet.getRow(r).getCell(c);
            if (cell.value !== null && cell.value !== undefined) {
              const parsed = parseInt(getCellValueAsString(cell));
              if (!isNaN(parsed) && parsed > 0) {
                numericCount++;
                values.push(parsed);
              }
            }
          }

          // If we found numeric sequential values starting from 1, this is the lesson number column
          if (values.length >= 2) {
            values.sort((a, b) => a - b);
            if (values[0] === 1 && numericCount >= 2) {
              lessonNumberCol = c;
              break;
            }
          }
        }

        console.log(`Enhanced parser: Detected lesson number column: ${lessonNumberCol}`);

        const headers: string[] = [];
        for (let c = lessonNumberCol; c <= 10; c++) {
          const cell = sheet.getRow(headerRow).getCell(c);
          if (cell.value) {
            headers.push(getCellValueAsString(cell));
          } else {
            break;
          }
        }

        const lessons: ParsedLesson[] = [];
        for (let r = headerRow + 1; r <= 100; r++) {
          const lessonNumberCell = sheet.getRow(r).getCell(lessonNumberCol);
          if (!lessonNumberCell.value) break;

          const lessonNumber = parseInt(getCellValueAsString(lessonNumberCell));
          if (isNaN(lessonNumber)) continue;

          const lesson: any = { lessonNumber };

          for (let c = lessonNumberCol + 1; c <= lessonNumberCol + headers.length; c++) {
            const cell = sheet.getRow(r).getCell(c);
            const value = cell.value;
            lesson[headers[c - lessonNumberCol]] =
              typeof value === "number" ? value : getCellValueAsString(cell);
          }

          const parsedLesson: ParsedLesson = {
            lessonNumber: lesson.lessonNumber,
            subject: lesson[headers[1]] || "",
            hours: lesson[headers[2]] || 0,
            lessonType: lesson[headers[3]] || "",
            homework: lesson[headers[4]] || "",
            notes: lesson[headers[5]] || "",
          };

          lessons.push(parsedLesson);
        }

        const result: ParseResult = {
          metadata: {
            fileName: file.name,
            sheetName: sheet.name,
            totalLessons: lessons.length,
            headerRow: headerRow,
            headers: headers,
            parsedAt: new Date().toISOString(),
          },
          lessons: lessons,
        };

        resolve(result);
      } catch (error) {
        console.error("Error in enhanced parser:", error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

function extractMetadataFromRows(rows: string[][]): JournalImportMetadata {
  const groupLine = rows[1]?.[0] ?? "";
  const courseLine = rows[2]?.[0] ?? "";
  const specialtyLine = rows[3]?.[0] ?? "";
  const yearLine = rows[4]?.[0] ?? "";
  const disciplineLine = rows[5]?.[0] ?? "";
  const teacherLine = rows[5]?.[24] ?? "";

  const clean = (text: string, prefix: string) =>
    text.replace(prefix, "").trim();

  const groupName = clean(groupLine, "Группа №").trim();
  const courseLabel = clean(courseLine, "Курс (год):").trim();
  const specialtyLabel = clean(specialtyLine, "Специальность (Профессия):").trim();
  const academicYearLabel = clean(yearLine, "Учебный год:").trim();
  const disciplineTitle = disciplineLine
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const teacherFullName = clean(
    teacherLine.replace("Фамилия имя отчество преподавателя", ""),
    ""
  );

  return {
    groupName,
    courseLabel,
    specialtyLabel,
    academicYearLabel,
    disciplineTitle,
    teacherFullName,
    lessonDates: [],
  };
}

function guessLessonDates(headerRow: string[], startIndex: number, endIndex: number) {
  const dates: string[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const value = headerRow[i];
    if (!value) continue;
    dates.push(value.trim());
  }
  return dates;
}

function detectJournalHeader(rows: string[][]) {
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    if (row.some((cell) => cell?.includes("№ п/п"))) {
      headerRowIndex = i;
      break;
    }
  }
  return headerRowIndex;
}

function parseJournalStudents(
  rows: string[][],
  headerRowIndex: number,
  attendanceStartCol: number,
  attendanceEndCol: number,
  finalControlFormCol: number,
  finalGradeCol: number,
  dateCol: number
) {
  const students: JournalImportStudent[] = [];

  for (let i = headerRowIndex + 2; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const orderCell = row[0];
    const nameCell = row[1];
    if (!orderCell && !nameCell) {
      // reached empty row, stop parsing further
      break;
    }

    const order = parseInt(orderCell, 10);
    if (Number.isNaN(order)) {
      continue;
    }

    const attendance: (string | number | null)[] = [];
    for (let c = attendanceStartCol; c <= attendanceEndCol; c++) {
      attendance.push(row[c] ?? "");
    }

    const student: JournalImportStudent = {
      order,
      fullName: nameCell?.trim() ?? "",
      attendance,
      finalControlForm: finalControlFormCol !== -1 ? (row[finalControlFormCol]?.trim() ?? null) : null,
      finalGrade: finalGradeCol !== -1 ? (row[finalGradeCol]?.trim() ?? null) : null,
      lessonDate: row[dateCol]?.trim() ?? undefined,
      hours: row[dateCol + 1]?.trim() ?? undefined,
      topic: row[dateCol + 2]?.trim() ?? undefined,
      teacherSignature: row[dateCol + 3]?.trim() ?? undefined,
      accompanistSignature: row[dateCol + 4]?.trim() ?? undefined,
    };

    students.push(student);
  }

  return students;
}

export async function importJournalFromExcel(file: File): Promise<JournalImportSummary> {
  const issues: JournalImportValidationIssue[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new Error("Sheet not found in workbook");
    }

    // Convert worksheet to array format
    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const rowData: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowData[colNumber - 1] = getCellValueAsString(cell);
      });
      rows[rowNumber - 1] = rowData;
    });

    if (rows.length < 8) {
      throw new Error("Template too short or corrupted");
    }

    const metadata = extractMetadataFromRows(rows);

    const headerRowIndex = detectJournalHeader(rows);
    if (headerRowIndex === -1) {
      throw new Error("Не удалось найти заголовок таблицы (строку с № п/п)");
    }

    const headerRow = rows[headerRowIndex];
    const datesRow = rows[headerRowIndex + 1];

    const studentNameCol = 1;
    const attendanceStartCol = 2;

    const dateCol = headerRow.findIndex((cell) =>
      cell?.toLowerCase()?.includes("дата проведения") ||
      cell?.toLowerCase()?.includes("дата занятия")
    );
    const hoursCol = dateCol + 1;
    const topicCol = dateCol + 2;

    if (dateCol === -1) {
      throw new Error("Не удалось определить колонку с датой проведения занятия");
    }

    // Detect if finalControlForm and finalGrade columns exist
    const finalControlFormCol = headerRow.findIndex((cell) =>
      cell?.toLowerCase()?.includes("форма итогового контроля") ||
      cell?.toLowerCase()?.includes("қорытынды бақылау нысаны")
    );

    const finalGradeCol = headerRow.findIndex((cell) =>
      cell?.toLowerCase()?.includes("итог") && cell?.toLowerCase()?.includes("нәтиже")
    );

    // Calculate attendance end column based on whether new columns exist
    let attendanceEndCol: number;
    if (finalControlFormCol !== -1 && finalGradeCol !== -1) {
      // New format: attendance ends 3 columns before dateCol
      attendanceEndCol = dateCol - 3;
    } else {
      // Old format: attendance ends 1 column before dateCol
      attendanceEndCol = dateCol - 1;
    }
    metadata.lessonDates = guessLessonDates(datesRow, attendanceStartCol, attendanceEndCol);

    const students = parseJournalStudents(
      rows,
      headerRowIndex,
      attendanceStartCol,
      attendanceEndCol,
      finalControlFormCol,
      finalGradeCol,
      dateCol
    );

    if (students.length === 0) {
      issues.push({
        type: "warning",
        message: "В шаблоне не найдено студентов. Проверьте содержимое файла.",
      });
    }

    const result: JournalImportResult = {
      metadata,
      students,
    };

    return { result, issues };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось обработать файл журнала";
    issues.push({ type: "error", message });
    return {
      result: null,
      issues,
    };
  }
}

export async function exportKtpToExcel(
  dataRows: (string | number | null)[][],
  templateUrl: string
): Promise<Uint8Array> {
  const response = await fetch(templateUrl);
  if (!response.ok) throw new Error("Failed to load template");
  const buffer = await response.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('No worksheet found in template');
  }

  // Detect header row: first row with any non-empty cell
  let headerRow = -1;
  for (let r = 1; r <= 50; r++) {
    for (let c = 1; c <= 20; c++) {
      const cell = sheet.getRow(r).getCell(c);
      if (cell.value) {
        headerRow = r;
        break;
      }
    }
    if (headerRow !== -1) break;
  }
  if (headerRow === -1) throw new Error("No header row found in template");

  // Detect start and end columns in header row
  let startCol = 999;
  let endCol = -1;
  for (let c = 1; c <= 20; c++) {
    const cell = sheet.getRow(headerRow).getCell(c);
    if (cell.value) {
      startCol = Math.min(startCol, c);
      endCol = Math.max(endCol, c);
    }
  }
  if (startCol === 999) throw new Error("No headers found in template");

  // Apply header font styles
  for (let c = startCol; c <= endCol; c++) {
    const cell = sheet.getRow(headerRow).getCell(c);
    cell.font = {
      name: "Times New Roman",
      size: 10,
      bold: true,
    };
  }

  const detectedCols = endCol - startCol + 1;
  const dataCols = dataRows[0]?.length || 0;
  if (detectedCols !== dataCols) {
    console.warn(
      `Template has ${detectedCols} columns, but data has ${dataCols}`
    );
  }

  const dataStartRow = headerRow + 1;

  // Find style templates for each column
  const styleTemplate: { [col: number]: Partial<ExcelJS.Style> } = {};
  for (let c = startCol; c <= endCol; c++) {
    for (let r = dataStartRow; r < dataStartRow + 10; r++) {
      const cell = sheet.getRow(r).getCell(c);
      if (cell.style) {
        styleTemplate[c] = { ...cell.style };
        break;
      }
    }
  }

  // Get current row count
  let currentRowCount = 0;
  sheet.eachRow((row, rowNumber) => {
    currentRowCount = Math.max(currentRowCount, rowNumber);
  });

  // Clear existing data in data rows (set value to null, keep styles)
  for (let r = dataStartRow; r <= currentRowCount; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = sheet.getRow(r).getCell(c);
      cell.value = null;
    }
  }

  // Write new data rows
  dataRows.forEach((rowData, index) => {
    const row = dataStartRow + index;
    const excelRow = sheet.getRow(row);

    rowData.forEach((value, idx) => {
      const col = startCol + idx;
      if (col > endCol) return; // Skip if beyond template columns

      const cell = excelRow.getCell(col);
      cell.value = value;

      // Apply style template if available
      if (styleTemplate[col]) {
        cell.style = { ...styleTemplate[col] };
      }

      // Apply font
      cell.font = {
        name: "Helv/Kazakh",
        size: 9,
        bold: false,
      };

      // Apply wrap text and border if non-empty
      if (value != null) {
        cell.alignment = { wrapText: true };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });

    excelRow.commit();
  });

  // Apply header font styles after data to ensure they persist
  for (let c = startCol; c <= endCol; c++) {
    const cell = sheet.getRow(headerRow).getCell(c);
    cell.font = {
      name: "Times New Roman",
      size: 10,
      bold: true,
    };
  }

  // Write to buffer
  const newBuffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(newBuffer);
}
