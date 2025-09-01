import * as XLSX from "xlsx";

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
