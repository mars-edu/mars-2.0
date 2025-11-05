import * as XLSX from "xlsx-js-style";
import type { CellObject } from "xlsx-js-style";
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
  templateUrl: string;
  groupName: string;
  courseLabel: string;
  specialtyLabel?: string;
  academicYearLabel?: string;
  disciplineTitle: string;
  teacherFullName?: string;
  students: JournalStudentRow[];
  calendarEvent?: CalendarEvent | null;
  lessonDates?: string[];
}

const TEMPLATE_CACHE = new Map<string, ArrayBuffer>();

async function loadTemplate(url: string): Promise<ArrayBuffer> {
  if (TEMPLATE_CACHE.has(url)) {
    const buffer = TEMPLATE_CACHE.get(url);
    if (buffer) {
      return buffer.slice(0);
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load journal template: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  TEMPLATE_CACHE.set(url, buffer);
  return buffer.slice(0);
}

type Worksheet = XLSX.WorkSheet;

type HeaderInfo = {
  row: number;
  firstCol: number;
  lastCol: number;
  studentNameCol: number;
  attendanceStartCol: number;
  dateCol: number;
  finalGradeCol: number;
  noFinalControlCol: number;
};

function detectHeader(worksheet: Worksheet): HeaderInfo {
  const ref = worksheet["!ref"];
  if (!ref) throw new Error("Template range not defined");
  const range = XLSX.utils.decode_range(ref);

  let headerRow = -1;
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r, c: range.s.c })];
    const value = typeof cell?.v === "string" ? cell.v.trim() : cell?.v;
    if (typeof value === "string" && value.includes("№ п/п")) {
      headerRow = r;
      break;
    }
  }
  if (headerRow === -1) throw new Error("Header row not found in template");

  let firstCol = range.e.c;
  let lastCol = range.s.c;
  let studentNameCol = range.s.c + 1;
  let attendanceStartCol = range.s.c + 2;
  let dateCol = range.s.c + 2;
  let finalGradeCol = range.e.c - 2;
  let noFinalControlCol = range.e.c - 1;

  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: headerRow, c })];
    const value = typeof cell?.v === "string" ? cell.v.trim() : cell?.v;
    if (value === undefined || value === null || value === "") continue;
    firstCol = Math.min(firstCol, c);
    lastCol = Math.max(lastCol, c);
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes("фамилия")) {
        studentNameCol = c;
      } else if (lowerValue.includes("месяц") || lowerValue.includes("число") || lowerValue.includes("посещ")) {
        attendanceStartCol = c;
      } else if (lowerValue.includes("дата проведения")) {
        dateCol = c;
      } else if (lowerValue.includes("итоговая")) {
        finalGradeCol = c;
      } else if (lowerValue.includes("без итогового")) {
        noFinalControlCol = c;
      }
    }
  }

  // If attendanceStartCol wasn't explicitly detected, calculate it from studentNameCol
  if (attendanceStartCol === range.s.c + 2 && studentNameCol !== range.s.c + 1) {
    attendanceStartCol = studentNameCol + 1;
  }

  return {
    row: headerRow,
    firstCol,
    lastCol,
    studentNameCol,
    attendanceStartCol,
    dateCol,
    finalGradeCol,
    noFinalControlCol,
  };
}

type ColumnTemplateMap = Record<number, CellObject | undefined>;

function cloneTemplateCell(cell: CellObject | undefined): CellObject | undefined {
  if (!cell) return undefined;
  return JSON.parse(JSON.stringify(cell)) as CellObject;
}

function sanitizeTemplateCell(cell: CellObject): CellObject {
  const clone = cloneTemplateCell(cell)!;
  clone.v = null as any;
  if ("w" in clone) {
    delete (clone as any).w;
  }
  if ((clone as any).text) {
    delete (clone as any).text;
  }
  if (clone.t === undefined) {
    clone.t = "z";
  }

  if (!clone.s) {
    clone.s = {};
  }

  if (!clone.s.font) {
    clone.s.font = {
      name: "Calibri",
      sz: 11,
      color: { rgb: "000000" },
    };
  }

  if (!clone.s.alignment) {
    clone.s.alignment = {
      vertical: "center",
      horizontal: "center",
      wrapText: true,
    };
  }

  return clone;
}

function collectColumnTemplates(
  worksheet: Worksheet,
  dataStartRow: number,
  startCol: number,
  endCol: number,
  headerRow: number
): ColumnTemplateMap {
  const templates: ColumnTemplateMap = {};

  for (let c = startCol; c <= endCol; c++) {
    let templateCell: CellObject | undefined;

    for (let r = dataStartRow; r < dataStartRow + 30; r++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[addr] as CellObject | undefined;
      if (cell) {
        templateCell = cell;
        break;
      }
    }

    if (!templateCell) {
      const addr = XLSX.utils.encode_cell({ r: headerRow + 1, c });
      const cell = worksheet[addr] as CellObject | undefined;
      if (cell) {
        templateCell = cell;
      }
    }

    if (!templateCell) {
      const addr = XLSX.utils.encode_cell({ r: headerRow, c });
      const cell = worksheet[addr] as CellObject | undefined;
      if (cell) {
        templateCell = cell;
      }
    }

    templates[c] = templateCell ? sanitizeTemplateCell(templateCell) : undefined;
  }

  return templates;
}

function updateCellWithText(
  worksheet: Worksheet,
  searchSubstr: string,
  replacement: string
) {
  const ref = worksheet["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 15); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[addr];
      if (!cell || typeof cell.v !== "string") continue;
      if (cell.v.includes(searchSubstr)) {
        cell.v = replacement;
        cell.t = "s";
        return;
      }
    }
  }
}

function ensureCell(
  worksheet: Worksheet,
  row: number,
  col: number,
  templates: ColumnTemplateMap
): CellObject {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const template = templates[col];
  let cell = worksheet[addr] as CellObject | undefined;
  const isNewCell = !cell;

  if (!cell) {
    const base = cloneTemplateCell(template) ?? ({ t: "z" } as CellObject);
    base.v = null as any;
    cell = base;
    worksheet[addr] = cell;
  }

  if (template?.s && (isNewCell || !cell.s)) {
    cell.s = JSON.parse(JSON.stringify(template.s));
  }

  if (template?.z) {
    cell.z = template.z;
  }

  return cell;
}

function setCell(
  worksheet: Worksheet,
  row: number,
  col: number,
  value: string | number | Date | null | undefined,
  templates: ColumnTemplateMap
) {
  const cell = ensureCell(worksheet, row, col, templates);
  const template = templates[col];

  if (value === null || value === undefined || value === "") {
    const emptyValue = "";
    cell.v = emptyValue as any;
    cell.t = template?.t && template.t !== "z" ? template.t : "s";
    if (template?.z) {
      cell.z = template.z;
    }
    return;
  }

  if (value instanceof Date) {
    cell.v = value;
    cell.t = template?.t === "n" ? "n" : template?.t === "d" ? "d" : "d";
  } else if (typeof value === "number") {
    cell.v = value;
    cell.t = "n";
  } else {
    cell.v = value;
    cell.t = template?.t && template.t !== "z" ? template.t : "s";
  }
}

type BorderWeight = "thin" | "medium";

const BORDER_COLOR = { rgb: "000000" };

function applyBorders(
  cell: CellObject,
  edges: Partial<Record<"top" | "right" | "bottom" | "left", BorderWeight>>
) {
  if (!cell.s) cell.s = {};
  const existing = cell.s.border ? { ...cell.s.border } : {};
  (Object.keys(edges) as Array<keyof typeof edges>).forEach((edge) => {
    const weight = edges[edge];
    if (!weight) return;
    existing[edge] = { style: weight, color: BORDER_COLOR } as any;
  });
  cell.s.border = existing;
}

function applyJournalGridStyles(
  worksheet: Worksheet,
  header: HeaderInfo,
  templates: ColumnTemplateMap,
  dataRowCount: number
) {
  const headerRow = header.row;
  const datesRow = header.row + 1;
  const dataStartRow = header.row + 2;
  const firstDataRow = dataStartRow;
  const lastDataRow = dataRowCount > 0 ? dataStartRow + dataRowCount - 1 : dataStartRow - 1;
  const teacherInfoRow = header.row - 1;

  const boundaryColumns = new Set<number>([
    header.firstCol,
    header.studentNameCol,
    header.dateCol,
    header.finalGradeCol,
    header.noFinalControlCol,
    header.lastCol + 1,
  ]);

  const getLeftWeight = (col: number): BorderWeight =>
    boundaryColumns.has(col) ? "medium" : "thin";

  const getRightWeight = (col: number): BorderWeight =>
    boundaryColumns.has(col + 1) ? "medium" : "thin";

  const ensure = (row: number, col: number) => ensureCell(worksheet, row, col, templates);

  if (teacherInfoRow >= 0) {
    for (let c = header.firstCol; c <= header.lastCol; c++) {
      const cell = ensure(teacherInfoRow, c);
      applyBorders(cell, {
        top: "medium",
        bottom: "medium",
        left: getLeftWeight(c),
        right: getRightWeight(c),
      });
    }
  }

  for (let c = header.firstCol; c <= header.lastCol; c++) {
    const cell = ensure(headerRow, c);
    applyBorders(cell, {
      top: "medium",
      bottom: "medium",
      left: getLeftWeight(c),
      right: getRightWeight(c),
    });
    if (c === header.studentNameCol) {
      cell.s.alignment = {
        ...(cell.s.alignment || {}),
        horizontal: "left",
        vertical: "center",
        wrapText: true,
      };
    }
  }

  for (let c = header.firstCol; c <= header.lastCol; c++) {
    const cell = ensure(datesRow, c);
    applyBorders(cell, {
      top: "medium",
      bottom: "medium",
      left: getLeftWeight(c),
      right: getRightWeight(c),
    });
    if (c >= header.attendanceStartCol && c <= header.dateCol - 1) {
      cell.s.alignment = {
        ...(cell.s.alignment || {}),
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      };
    }
  }

  if (dataRowCount <= 0) return;

  for (let r = firstDataRow; r <= lastDataRow; r++) {
    for (let c = header.firstCol; c <= header.lastCol; c++) {
      const cell = ensure(r, c);
      const top = r === firstDataRow ? "medium" : "thin";
      const bottom = r === lastDataRow ? "medium" : "thin";
      const left = getLeftWeight(c);
      const right = getRightWeight(c);
      applyBorders(cell, { top, bottom, left, right });

      if (c === header.studentNameCol) {
        cell.s.alignment = {
          ...(cell.s.alignment || {}),
          horizontal: "left",
          vertical: "center",
          wrapText: true,
        };
      } else if (c === header.firstCol || c >= header.attendanceStartCol) {
        cell.s.alignment = {
          ...(cell.s.alignment || {}),
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        };
      }
    }
  }
}

function formatLessonDates(
  payload: JournalExportPayload,
  attendanceColumnCount: number
): string[] {
  if (payload.lessonDates && payload.lessonDates.length > 0) {
    return payload.lessonDates.slice(0, attendanceColumnCount);
  }
  if (!payload.calendarEvent) return [];
  const days = getEventDays(payload.calendarEvent);
  return days
    .map(({ day }) => day.format("DD.MM.YY"))
    .slice(0, attendanceColumnCount);
}

function normalizeText(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

export async function exportJournalToExcel(
  payload: JournalExportPayload
): Promise<Uint8Array> {
  if (!payload.templateUrl) {
    throw new Error("Template URL is required");
  }

  const templateBuffer = await loadTemplate(payload.templateUrl);
  const workbook = XLSX.read(templateBuffer, {
    type: "array",
    cellStyles: true,
    cellDates: true,
    cellNF: true,
  });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new Error("Template sheet is missing");

  const header = detectHeader(worksheet);
  const dataStartRow = header.row + 2;
  const columnTemplates = collectColumnTemplates(
    worksheet,
    dataStartRow,
    header.firstCol,
    header.lastCol,
    header.row
  );

  const attendanceStartCol = header.attendanceStartCol;
  const attendanceEndCol = header.dateCol - 1;
  const attendanceColumnCount = Math.max(
    0,
    attendanceEndCol - attendanceStartCol + 1
  );

  const lessonDates = formatLessonDates(payload, attendanceColumnCount);

  if (payload.groupName) {
    updateCellWithText(
      worksheet,
      "Группа",
      `Группа № ${normalizeText(payload.groupName)}`
    );
  }

  updateCellWithText(
    worksheet,
    "Курс (год):",
    `Курс (год): ${normalizeText(payload.courseLabel)}`
  );

  if (payload.specialtyLabel) {
    updateCellWithText(
      worksheet,
      "Специальность",
      `Специальность (Профессия): ${normalizeText(payload.specialtyLabel)}`
    );
  }

  if (payload.academicYearLabel) {
    updateCellWithText(
      worksheet,
      "Учебный год",
      `Учебный год: ${normalizeText(payload.academicYearLabel)}`
    );
  }

  const teacherBlock = normalizeText(payload.teacherFullName || "");
  const disciplineBlock = normalizeText(payload.disciplineTitle);
  updateCellWithText(
    worksheet,
    "Наименование дисциплин",
    `Наименование дисциплин / Индекс модуля\n${disciplineBlock}` +
      (teacherBlock
        ? `\nФамилия имя отчество преподавателя \n${teacherBlock}`
        : "")
  );

  const teacherSignatureRow = header.row - 1;
  if (teacherSignatureRow >= 0) {
    const teacherSignatureValue = teacherBlock
      ? `Фамилия имя отчество преподавателя \n${teacherBlock}`
      : "Фамилия имя отчество преподавателя";
    setCell(
      worksheet,
      teacherSignatureRow,
      header.dateCol,
      teacherSignatureValue,
      columnTemplates
    );
  }

  // Clear dates row and populate with lesson dates
  for (let c = attendanceStartCol; c <= attendanceEndCol; c++) {
    const value = lessonDates[c - attendanceStartCol] ?? "";
    setCell(worksheet, header.row + 1, c, value, columnTemplates);
  }

  // Clear student data rows
  const ref = worksheet["!ref"];
  const range = ref ? XLSX.utils.decode_range(ref) : null;
  const templateRowCount = range && range.e.r >= dataStartRow ? range.e.r - dataStartRow + 1 : 0;
  let dataRowCount = Math.max(templateRowCount, payload.students.length);
  if (dataRowCount === 0) {
    dataRowCount = templateRowCount > 0 ? templateRowCount : 20;
  }

  const clearEndRow = range
    ? Math.max(range.e.r, dataStartRow + dataRowCount - 1)
    : dataStartRow + dataRowCount - 1;

  for (let r = dataStartRow; r <= clearEndRow; r++) {
    for (let c = header.firstCol; c <= header.lastCol; c++) {
      setCell(worksheet, r, c, null, columnTemplates);
    }
  }

  // Populate students
  payload.students.forEach((student, index) => {
    const row = dataStartRow + index;
    setCell(worksheet, row, header.firstCol, index + 1, columnTemplates);
    setCell(worksheet, row, header.studentNameCol, student.fullName, columnTemplates);

    if (attendanceColumnCount > 0) {
      const attendance = student.attendance || [];
      for (let offset = 0; offset < attendanceColumnCount; offset++) {
        const value = attendance[offset] ?? "";
        setCell(
          worksheet,
          row,
          attendanceStartCol + offset,
          value,
          columnTemplates
        );
      }
    }

    if (student.date) {
      setCell(worksheet, row, header.dateCol, student.date, columnTemplates);
    }
    if (student.hours !== undefined && student.hours !== null) {
      setCell(
        worksheet,
        row,
        header.dateCol + 1,
        student.hours,
        columnTemplates
      );
    }
    if (student.topic) {
      setCell(
        worksheet,
        row,
        header.dateCol + 2,
        student.topic,
        columnTemplates
      );
    }
    if (student.finalGrade !== undefined) {
      setCell(
        worksheet,
        row,
        header.finalGradeCol,
        student.finalGrade,
        columnTemplates
      );
    }
  });

  applyJournalGridStyles(worksheet, header, columnTemplates, dataRowCount);

  const newRange = range
    ? { s: { ...range.s }, e: { ...range.e } }
    : {
        s: { r: header.row, c: header.firstCol },
        e: { r: header.row, c: header.lastCol },
      };

  const lastStyledRow = dataRowCount > 0 ? dataStartRow + dataRowCount - 1 : header.row + 1;
  newRange.s.r = Math.min(newRange.s.r, header.row);
  newRange.s.c = Math.min(newRange.s.c, header.firstCol);
  newRange.e.r = Math.max(newRange.e.r, lastStyledRow);
  newRange.e.c = Math.max(newRange.e.c, header.lastCol);
  worksheet["!ref"] = XLSX.utils.encode_range(newRange);

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Uint8Array(buffer);
}
