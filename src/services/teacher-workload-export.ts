import * as XLSX from "xlsx-js-style";
import type { CellObject } from "xlsx-js-style";

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
    throw new Error(`Failed to load template: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  TEMPLATE_CACHE.set(url, buffer);
  return buffer.slice(0);
}

type Worksheet = XLSX.WorkSheet;
type ColumnTemplateMap = Record<number, CellObject | undefined>;

function cloneTemplateCell(
  cell: CellObject | undefined
): CellObject | undefined {
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
  templateRow: number,
  startCol: number,
  endCol: number
): ColumnTemplateMap {
  const templates: ColumnTemplateMap = {};

  for (let c = startCol; c <= endCol; c++) {
    const addr = XLSX.utils.encode_cell({ r: templateRow, c });
    const cell = worksheet[addr] as CellObject | undefined;
    templates[c] = cell ? sanitizeTemplateCell(cell) : undefined;
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
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 20); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[addr];
      if (!cell || typeof cell.v !== "string") continue;
      if (cell.v.includes(searchSubstr)) {
        cell.v = cell.v.replace(new RegExp(searchSubstr, "g"), replacement);
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

function detectDataStartRow(worksheet: Worksheet, sheetIndex: number): number {
  const ref = worksheet["!ref"];
  if (!ref) return 9;
  const range = XLSX.utils.decode_range(ref);

  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 20); r++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r, c: range.s.c })];
    const value = typeof cell?.v === "string" ? cell.v.trim() : cell?.v;

    if (typeof value === "string") {
      if (sheetIndex === 0 && value.includes("№ п/п")) {
        return r + 1;
      } else if (sheetIndex === 1 && value.includes("№ п/п")) {
        return r + 1;
      } else if (sheetIndex === 2 && value.includes("№")) {
        return r + 1;
      }
    }
  }

  return 9;
}

function getColumnRange(worksheet: Worksheet): { start: number; end: number } {
  const ref = worksheet["!ref"];
  if (!ref) return { start: 0, end: 40 };
  const range = XLSX.utils.decode_range(ref);
  return { start: range.s.c, end: range.e.c };
}

export async function exportTeacherWorkloadToExcel(
  payload: TeacherWorkloadExportPayload
): Promise<Uint8Array> {
  const templateUrl = "/ООД Килаш 2024-2025 форма 1-3.xls";
  const templateBuffer = await loadTemplate(templateUrl);
  const workbook = XLSX.read(templateBuffer, {
    type: "array",
    cellStyles: true,
    cellDates: true,
    cellNF: true,
  });

  const form1Sheet = workbook.Sheets[workbook.SheetNames[0]];
  const form2Sheet = workbook.Sheets[workbook.SheetNames[1]];
  const form3Sheet = workbook.Sheets[workbook.SheetNames[2]];

  if (!form1Sheet || !form2Sheet || !form3Sheet) {
    throw new Error("Template sheets are missing");
  }

  updateCellWithText(form1Sheet, "Килаш А.А.", payload.teacherFullName);
  updateCellWithText(form1Sheet, "2024-2025", payload.academicYear);
  updateCellWithText(form1Sheet, "сентябрь", payload.month);

  updateCellWithText(form2Sheet, "Килаш А.А.", payload.teacherFullName);
  updateCellWithText(form2Sheet, "2024-2025", payload.academicYear);

  updateCellWithText(form3Sheet, "Килаш А.А.", payload.teacherFullName);
  updateCellWithText(form3Sheet, "2024-2025", payload.academicYear);

  const form1DataRow = detectDataStartRow(form1Sheet, 0);
  const form1ColRange = getColumnRange(form1Sheet);
  const form1Templates = collectColumnTemplates(
    form1Sheet,
    form1DataRow - 1,
    form1ColRange.start,
    form1ColRange.end
  );

  const form1Ref = form1Sheet["!ref"];
  const form1Range = form1Ref ? XLSX.utils.decode_range(form1Ref) : null;
  const form1ClearEnd = form1Range
    ? Math.max(form1Range.e.r, form1DataRow + payload.entries.length - 1)
    : form1DataRow + payload.entries.length - 1;

  for (let r = form1DataRow; r <= form1ClearEnd; r++) {
    for (let c = form1ColRange.start; c <= form1ColRange.end; c++) {
      setCell(form1Sheet, r, c, null, form1Templates);
    }
  }

  payload.entries.forEach((entry, index) => {
    const row = form1DataRow + index;
    setCell(form1Sheet, row, 0, entry.rowNumber, form1Templates);
    setCell(form1Sheet, row, 1, entry.moduleIndex, form1Templates);
    setCell(form1Sheet, row, 2, entry.subjectName, form1Templates);
    setCell(form1Sheet, row, 3, entry.groupName, form1Templates);

    entry.dailyHours.forEach((hours, dayIndex) => {
      const col = 4 + dayIndex;
      setCell(form1Sheet, row, col, hours, form1Templates);
    });

    const monthTotalCol = 4 + entry.dailyHours.length;
    setCell(form1Sheet, row, monthTotalCol, entry.monthTotal, form1Templates);
    setCell(
      form1Sheet,
      row,
      monthTotalCol + 1,
      entry.plannedHours,
      form1Templates
    );
    setCell(
      form1Sheet,
      row,
      monthTotalCol + 2,
      entry.actualHours,
      form1Templates
    );
    setCell(
      form1Sheet,
      row,
      monthTotalCol + 3,
      entry.cumulativeHours,
      form1Templates
    );
    setCell(
      form1Sheet,
      row,
      monthTotalCol + 4,
      entry.remainingHours,
      form1Templates
    );
  });

  const form2DataRow = detectDataStartRow(form2Sheet, 1);
  const form2ColRange = getColumnRange(form2Sheet);
  const form2Templates = collectColumnTemplates(
    form2Sheet,
    form2DataRow - 1,
    form2ColRange.start,
    form2ColRange.end
  );

  const form2Ref = form2Sheet["!ref"];
  const form2Range = form2Ref ? XLSX.utils.decode_range(form2Ref) : null;
  const form2ClearEnd = form2Range
    ? Math.max(form2Range.e.r, form2DataRow + payload.summaryEntries.length - 1)
    : form2DataRow + payload.summaryEntries.length - 1;

  for (let r = form2DataRow; r <= form2ClearEnd; r++) {
    for (let c = form2ColRange.start; c <= form2ColRange.end; c++) {
      setCell(form2Sheet, r, c, null, form2Templates);
    }
  }

  payload.summaryEntries.forEach((entry, index) => {
    const row = form2DataRow + index;
    setCell(form2Sheet, row, 0, index + 1, form2Templates);
    setCell(form2Sheet, row, 1, entry.groupName, form2Templates);
    setCell(form2Sheet, row, 2, entry.subjectName, form2Templates);
    setCell(form2Sheet, row, 3, entry.plannedHours, form2Templates);
    setCell(form2Sheet, row, 4, entry.actualHours, form2Templates);
    setCell(form2Sheet, row, 5, entry.facultativePlanned || 0, form2Templates);
    setCell(form2Sheet, row, 6, entry.facultativeActual || 0, form2Templates);
    setCell(
      form2Sheet,
      row,
      7,
      entry.consultationsPlanned || 0,
      form2Templates
    );
    setCell(form2Sheet, row, 8, entry.consultationsActual || 0, form2Templates);
    setCell(form2Sheet, row, 9, entry.examsPlanned || 0, form2Templates);
    setCell(form2Sheet, row, 10, entry.examsActual || 0, form2Templates);
    setCell(form2Sheet, row, 11, entry.totalHours, form2Templates);
  });

  const form3DataRow = detectDataStartRow(form3Sheet, 2);
  const form3ColRange = getColumnRange(form3Sheet);
  const form3Templates = collectColumnTemplates(
    form3Sheet,
    form3DataRow - 1,
    form3ColRange.start,
    form3ColRange.end
  );

  const form3Ref = form3Sheet["!ref"];
  const form3Range = form3Ref ? XLSX.utils.decode_range(form3Ref) : null;
  const form3ClearEnd = form3Range
    ? Math.max(
        form3Range.e.r,
        form3DataRow + payload.monthlyDistribution.length - 1
      )
    : form3DataRow + payload.monthlyDistribution.length - 1;

  for (let r = form3DataRow; r <= form3ClearEnd; r++) {
    for (let c = form3ColRange.start; c <= form3ColRange.end; c++) {
      setCell(form3Sheet, r, c, null, form3Templates);
    }
  }

  payload.monthlyDistribution.forEach((entry, index) => {
    const row = form3DataRow + index;
    setCell(form3Sheet, row, 0, index + 1, form3Templates);
    setCell(form3Sheet, row, 1, entry.groupName, form3Templates);
    setCell(form3Sheet, row, 2, entry.september, form3Templates);
    setCell(form3Sheet, row, 3, entry.october, form3Templates);
    setCell(form3Sheet, row, 4, entry.november, form3Templates);
    setCell(form3Sheet, row, 5, entry.december, form3Templates);
    setCell(form3Sheet, row, 6, entry.january, form3Templates);
    setCell(form3Sheet, row, 7, entry.february, form3Templates);
    setCell(form3Sheet, row, 8, entry.march, form3Templates);
    setCell(form3Sheet, row, 9, entry.april, form3Templates);
    setCell(form3Sheet, row, 10, entry.may, form3Templates);
    setCell(form3Sheet, row, 11, entry.june, form3Templates);
    setCell(form3Sheet, row, 12, entry.total, form3Templates);
  });

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Uint8Array(buffer);
}
