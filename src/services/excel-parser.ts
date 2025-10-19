import * as XLSX from "xlsx-js-style";
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

export function parseEducationalSchedule(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
        });

        let headerRowIndex = -1;
        let headers: string[] = [];

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i] as any[];
          if (
            row &&
            Array.isArray(row) &&
            row.length > 0 &&
            row.some((cell: any) => cell !== null)
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

        const dataRows = [];
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i] as any[];
          if (
            row &&
            Array.isArray(row) &&
            row.length > 0 &&
            row.some((cell: any) => cell !== null)
          ) {
            dataRows.push(row);
          }
        }

        const lessons: ParsedLesson[] = [];

        for (const row of dataRows) {
          if (!Array.isArray(row) || !row[0] || isNaN(parseInt(row[0])))
            continue;

          const lesson: ParsedLesson = {
            lessonNumber: parseInt(row[0]),
            subject: cleanString(row[1]),
            hours: parseHours(row[2]),
            lessonType: cleanString(row[3]),
            homework: cleanString(row[4]),
            notes: cleanString(row[5]),
          };

          lessons.push(lesson);
        }

        const result: ParseResult = {
          metadata: {
            fileName: file.name,
            sheetName: sheetName,
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

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        let headerRow = 0;
        for (let r = 1; r <= 100; r++) {
          const cellAddress = XLSX.utils.encode_cell({ r: r, c: 0 });
          if (worksheet[cellAddress] && worksheet[cellAddress].v) {
            headerRow = r;
            break;
          }
        }

        const headers = [];
        for (let c = 0; c < 10; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: c });
          if (worksheet[cellAddress]) {
            headers.push(worksheet[cellAddress].v.toString().trim());
          } else {
            break;
          }
        }

        const lessons: ParsedLesson[] = [];
        for (let r = headerRow + 1; r <= 100; r++) {
          const lessonNumberCell = XLSX.utils.encode_cell({ r: r, c: 0 });
          if (!worksheet[lessonNumberCell]) break;

          const lessonNumber = parseInt(worksheet[lessonNumberCell].v);
          if (isNaN(lessonNumber)) continue;

          const lesson: any = { lessonNumber };

          for (let c = 1; c < headers.length; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r: r, c: c });
            if (worksheet[cellAddress]) {
              const value = worksheet[cellAddress].v;
              lesson[headers[c]] =
                typeof value === "number" ? value : value.toString().trim();
            } else {
              lesson[headers[c]] = "";
            }
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
            sheetName: workbook.SheetNames[0],
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
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error("Sheet not found in workbook");
    }

    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      raw: false,
      defval: "",
    });

    if (rows.length < 8) {
      throw new Error("Template too short or corrupted");
    }

    const metadata = extractMetadataFromRows(rows as string[][]);

    const headerRowIndex = detectJournalHeader(rows as string[][]);
    if (headerRowIndex === -1) {
      throw new Error("Не удалось найти заголовок таблицы (строку с № п/п)");
    }

    const headerRow = rows[headerRowIndex] as string[];
    const datesRow = rows[headerRowIndex + 1] as string[];

    const studentNameCol = 1;
    const attendanceStartCol = 2;

    const dateCol = headerRow.findIndex((cell) =>
      cell?.toLowerCase()?.includes("дата проведения")
    );
    const hoursCol = dateCol + 1;
    const topicCol = dateCol + 2;

    if (dateCol === -1) {
      throw new Error("Не удалось определить колонку с датой проведения занятия");
    }

    const attendanceEndCol = dateCol - 1;
    metadata.lessonDates = guessLessonDates(datesRow, attendanceStartCol, attendanceEndCol);

    const students = parseJournalStudents(
      rows as string[][],
      headerRowIndex,
      attendanceStartCol,
      attendanceEndCol,
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
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellStyles: true,
    cellNF: true,
  });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Detect header row: first row with any non-empty cell
  let headerRow = -1;
  for (let r = 0; r < 50; r++) {
    for (let c = 0; c < 20; c++) {
      // Check up to T column
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      if (worksheet[cellAddress] && worksheet[cellAddress].v) {
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
  for (let c = 0; c < 20; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c });
    if (worksheet[cellAddress] && worksheet[cellAddress].v) {
      startCol = Math.min(startCol, c);
      endCol = Math.max(endCol, c);
    }
  }
  if (startCol === 999) throw new Error("No headers found in template");

  // Apply header font styles
  for (let c = startCol; c <= endCol; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow, c });
    let cell = worksheet[addr];
    if (!cell) {
      cell = worksheet[addr] = { t: "z", v: null, s: {} };
    } else if (!cell.s) {
      cell.s = {};
    }
    cell.s.font = {
      ...(cell.s.font || {}),
      name: "Times New Roman",
      sz: 10,
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

  // Get or initialize range
  const currentRef = worksheet["!ref"];
  const range = currentRef
    ? XLSX.utils.decode_range(currentRef)
    : { s: { r: headerRow, c: startCol }, e: { r: headerRow, c: endCol } };

  // Find style templates for each column
  const styleTemplate: { [col: number]: any } = {};
  for (let c = startCol; c <= endCol; c++) {
    for (let r = dataStartRow; r < dataStartRow + 10; r++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      // @ts-ignore
      if (worksheet[addr] && (worksheet[addr] as any).s) {
        // @ts-ignore
        styleTemplate[c] = { ...(worksheet[addr] as any).s };
        break;
      }
    }
  }

  // Clear existing data in data rows (set v to null, keep styles)
  for (let r = dataStartRow; r <= range.e.r; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (worksheet[addr]) {
        worksheet[addr].v = null;
        worksheet[addr].t = "z";
      }
    }
  }

  // Write new data rows
  dataRows.forEach((rowData, index) => {
    const row = dataStartRow + index;
    rowData.forEach((value, idx) => {
      const col = startCol + idx;
      if (col > endCol) return; // Skip if beyond template columns

      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cellType =
        typeof value === "number" ? "n" : value === null ? "z" : "s";

      let cell;
      if (worksheet[cellAddress]) {
        // Update existing cell
        cell = worksheet[cellAddress];
        cell.v = value;
        cell.t = cellType;
      } else {
        // Create new cell
        const newCell: any = { t: cellType, v: value };
        if (styleTemplate[col]) {
          newCell.s = { ...styleTemplate[col] };
        }
        worksheet[cellAddress] = newCell;
        cell = newCell;
      }

      // Apply font
      cell.s.font = {
        ...(cell.s.font || {}),
        name: "Helv/Kazakh",
        sz: 9,
        bold: false,
      };

      // Apply wrap text and border if non-empty
      if (value != null) {
        cell.s.alignment = { ...(cell.s.alignment || {}), wrapText: true };
        cell.s.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      }
    });
  });

  // Apply header font styles after data to ensure they persist
  for (let c = startCol; c <= endCol; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow, c });
    let cell = worksheet[addr];
    if (!cell) {
      cell = worksheet[addr] = { t: "z", v: null, s: {} };
    } else if (!cell.s) {
      cell.s = {};
    }
    cell.s.font = {
      ...(cell.s.font || {}),
      name: "Times New Roman",
      sz: 10,
      bold: true,
    };
  }

  // Calculate new end row
  const newEndRow = dataStartRow + dataRows.length - 1;

  // Remove cells beyond new end row
  for (let r = newEndRow + 1; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      delete worksheet[addr];
    }
  }

  // Update range
  range.s.r = Math.min(range.s.r, headerRow);
  range.e.r = Math.max(range.e.r, newEndRow);
  range.s.c = Math.min(range.s.c, startCol);
  range.e.c = Math.max(
    range.e.c,
    startCol + Math.max(detectedCols, dataCols) - 1
  );
  worksheet["!ref"] = XLSX.utils.encode_range(range);

  const newBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Uint8Array(newBuffer);
}
