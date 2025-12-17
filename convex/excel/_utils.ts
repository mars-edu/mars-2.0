/**
 * Excel Utility Library for Convex Actions
 * Provides helper functions and styles for ExcelJS workbook generation
 */

import type * as ExcelJS from "exceljs";

// ============================================================================
// Type Definitions
// ============================================================================

export type BorderWeight = "thin" | "medium" | "thick";
export type BorderEdge = "top" | "right" | "bottom" | "left";

export interface CellStyle {
  font?: {
    name?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: { argb?: string; rgb?: string };
  };
  alignment?: {
    vertical?: "top" | "middle" | "bottom";
    horizontal?: "left" | "center" | "right";
    wrapText?: boolean;
    textRotation?: number;
  };
  border?: {
    top?: { style: BorderWeight; color?: { argb?: string; rgb?: string } };
    right?: { style: BorderWeight; color?: { argb?: string; rgb?: string } };
    bottom?: { style: BorderWeight; color?: { argb?: string; rgb?: string } };
    left?: { style: BorderWeight; color?: { argb?: string; rgb?: string } };
  };
  fill?: {
    type?: "pattern";
    pattern?: string;
    fgColor?: { argb?: string; rgb?: string };
    bgColor?: { argb?: string; rgb?: string };
  };
  numFmt?: string;
}

export interface ColumnTemplate {
  width?: number;
  style?: CellStyle;
  numFmt?: string;
}

export type ColumnTemplateMap = Record<number, ColumnTemplate | undefined>;

// ============================================================================
// Constants
// ============================================================================

export const BORDER_COLOR = { argb: "FF000000" };
export const DEFAULT_FONT = { name: "Arial", size: 10, color: BORDER_COLOR };
export const DEFAULT_ALIGNMENT = {
  vertical: "middle" as const,
  horizontal: "center" as const,
  wrapText: true,
};

export const THIN_BORDER = {
  top: { style: "thin" as const, color: BORDER_COLOR },
  right: { style: "thin" as const, color: BORDER_COLOR },
  bottom: { style: "thin" as const, color: BORDER_COLOR },
  left: { style: "thin" as const, color: BORDER_COLOR },
};

export const MEDIUM_BORDER = {
  top: { style: "medium" as const, color: BORDER_COLOR },
  right: { style: "medium" as const, color: BORDER_COLOR },
  bottom: { style: "medium" as const, color: BORDER_COLOR },
  left: { style: "medium" as const, color: BORDER_COLOR },
};

export const LIGHT_GRAY_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFD9D9D9" },
};

export const LIGHT_YELLOW_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFFFFFFE0" },
};

export const ARIAL_FONT = { name: "Arial", size: 11 };
export const ARIAL_BOLD_FONT = { name: "Arial", size: 11, bold: true };
export const TIMES_FONT = { name: "Times New Roman", size: 11 };
export const TIMES_BOLD_FONT = { name: "Times New Roman", size: 11, bold: true };

export const THEME_BLACK = { theme: 1 };
export const GRAY_FILL = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { theme: 0, tint: -0.499984740745262 },
  bgColor: { indexed: 64 } as any,
};

// ============================================================================
// Style Application Helpers
// ============================================================================

/**
 * Apply data cell style (standard table cell)
 */
export function applyDataCellStyle(
  cell: ExcelJS.Cell,
  options?: {
    horizontal?: "left" | "center" | "right";
    numFmt?: string;
    bold?: boolean;
  }
): void {
  cell.font = {
    name: "Arial",
    size: 10,
    color: BORDER_COLOR,
    bold: options?.bold || false,
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: options?.horizontal || "center",
    wrapText: true,
  };
  cell.border = THIN_BORDER;
  if (options?.numFmt) {
    cell.numFmt = options.numFmt;
  }
}

/**
 * Apply header cell style (bold, centered, gray background)
 */
export function applyHeaderCellStyle(cell: ExcelJS.Cell): void {
  cell.font = {
    name: "Arial",
    size: 11,
    color: BORDER_COLOR,
    bold: true,
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cell.border = MEDIUM_BORDER;
  cell.fill = LIGHT_GRAY_FILL;
}

/**
 * Apply total cell style (bold, yellow background)
 */
export function applyTotalCellStyle(
  cell: ExcelJS.Cell,
  isLastColumn: boolean = false
): void {
  cell.font = {
    name: "Arial",
    size: 10,
    color: BORDER_COLOR,
    bold: true,
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: false,
  };
  cell.border = {
    top: { style: "thin", color: BORDER_COLOR },
    left: { style: "thin", color: BORDER_COLOR },
    bottom: { style: "thin", color: BORDER_COLOR },
    right: { style: isLastColumn ? "medium" : "thin", color: BORDER_COLOR },
  };
  cell.fill = LIGHT_YELLOW_FILL;
  cell.numFmt = "0.0";
}

// ============================================================================
// Cell Access Helpers
// ============================================================================

/**
 * Get cell by row/col indices (0-based)
 */
export function getCell(
  worksheet: ExcelJS.Worksheet,
  row: number,
  col: number
): ExcelJS.Cell {
  // ExcelJS uses 1-based indexing
  return worksheet.getCell(row + 1, col + 1);
}

/**
 * Set cell value with styling
 */
export function setCellValue(
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

  if (value === null || value === undefined || value === "") {
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

/**
 * Apply cell style
 */
export function applyCellStyle(cell: ExcelJS.Cell, style: CellStyle): void {
  if (style.font) {
    const font: Partial<ExcelJS.Font> = {};
    if (style.font.name) font.name = style.font.name;
    if (style.font.size) font.size = style.font.size;
    if (style.font.bold !== undefined) font.bold = style.font.bold;
    if (style.font.italic !== undefined) font.italic = style.font.italic;
    if (style.font.underline !== undefined) font.underline = style.font.underline;
    if (style.font.color) {
      const colorValue = style.font.color.argb || style.font.color.rgb;
      if (colorValue) {
        font.color = {
          argb: colorValue.startsWith("FF") ? colorValue : "FF" + colorValue,
        };
      }
    }
    cell.font = font;
  }

  if (style.alignment) {
    cell.alignment = style.alignment as Partial<ExcelJS.Alignment>;
  }

  if (style.border) {
    const border: Partial<ExcelJS.Borders> = {};
    (["top", "right", "bottom", "left"] as BorderEdge[]).forEach((edge) => {
      const borderDef = style.border![edge];
      if (borderDef) {
        const colorValue =
          borderDef.color?.argb || borderDef.color?.rgb || "FF000000";
        border[edge] = {
          style: borderDef.style,
          color: {
            argb: colorValue.startsWith("FF") ? colorValue : "FF" + colorValue,
          },
        };
      }
    });
    cell.border = border;
  }

  if (style.fill && style.fill.fgColor) {
    const colorValue = style.fill.fgColor.argb || style.fill.fgColor.rgb;
    if (colorValue) {
      cell.fill = {
        type: "pattern",
        pattern: (style.fill.pattern || "solid") as any,
        fgColor: {
          argb: colorValue.startsWith("FF") ? colorValue : "FF" + colorValue,
        },
      };
    }
  }

  if (style.numFmt) {
    cell.numFmt = style.numFmt;
  }
}

/**
 * Apply borders to cell edges
 */
export function applyBorders(
  cell: ExcelJS.Cell,
  edges: Partial<Record<BorderEdge, BorderWeight>>
): void {
  const border: Partial<ExcelJS.Borders> = cell.border || {};

  (Object.keys(edges) as BorderEdge[]).forEach((edge) => {
    const weight = edges[edge];
    if (weight) {
      border[edge] = { style: weight, color: BORDER_COLOR };
    }
  });

  cell.border = border;
}

// ============================================================================
// Template Collection
// ============================================================================

/**
 * Collect column templates from a template row
 */
export function collectColumnTemplates(
  worksheet: ExcelJS.Worksheet,
  templateRow: number,
  startCol: number,
  endCol: number
): ColumnTemplateMap {
  const templates: ColumnTemplateMap = {};

  for (let c = startCol; c <= endCol; c++) {
    const cell = getCell(worksheet, templateRow, c);
    const column = worksheet.getColumn(c + 1);

    templates[c] = {
      width: column.width,
      style: cloneCellStyle(cell),
      numFmt: cell.numFmt || undefined,
    };
  }

  return templates;
}

/**
 * Clone cell style
 */
export function cloneCellStyle(cell: ExcelJS.Cell): CellStyle {
  const style: CellStyle = {};

  if (cell.font) {
    style.font = {
      name: cell.font.name,
      size: cell.font.size,
      bold: cell.font.bold,
      italic: cell.font.italic,
      underline: cell.font.underline as boolean | undefined,
      color: cell.font.color
        ? { argb: (cell.font.color as { argb?: string }).argb }
        : undefined,
    };
  }

  if (cell.alignment) {
    style.alignment = {
      vertical: cell.alignment.vertical as "top" | "middle" | "bottom",
      horizontal: cell.alignment.horizontal as "left" | "center" | "right",
      wrapText: cell.alignment.wrapText,
      textRotation: cell.alignment.textRotation as number | undefined,
    };
  }

  if (cell.border) {
    style.border = {};
    (["top", "right", "bottom", "left"] as BorderEdge[]).forEach((edge) => {
      const borderDef = (cell.border as Record<string, { style?: string; color?: { argb?: string } }>)?.[edge];
      if (borderDef) {
        style.border![edge] = {
          style: borderDef.style as BorderWeight,
          color: borderDef.color ? { argb: borderDef.color.argb } : undefined,
        };
      }
    });
  }

  if (cell.fill && (cell.fill as { fgColor?: unknown }).fgColor) {
    const fill = cell.fill as {
      pattern?: string;
      fgColor?: { argb?: string };
      bgColor?: { argb?: string };
    };
    style.fill = {
      type: "pattern",
      pattern: fill.pattern,
      fgColor: fill.fgColor ? { argb: fill.fgColor.argb } : undefined,
      bgColor: fill.bgColor ? { argb: fill.bgColor.argb } : undefined,
    };
  }

  if (cell.numFmt) {
    style.numFmt = cell.numFmt;
  }

  return style;
}

// ============================================================================
// Search and Replace
// ============================================================================

/**
 * Update cell containing specific text
 */
export function updateCellWithText(
  worksheet: ExcelJS.Worksheet,
  searchSubstr: string,
  replacement: string,
  maxRows: number = 20
): boolean {
  for (let r = 1; r <= maxRows; r++) {
    worksheet.getRow(r).eachCell((cell) => {
      if (typeof cell.value === "string" && cell.value.includes(searchSubstr)) {
        cell.value = cell.value.replace(new RegExp(searchSubstr, "g"), replacement);
        return true;
      }
    });
  }
  return false;
}

// ============================================================================
// Range Helpers
// ============================================================================

/**
 * Get column range (first and last data columns)
 */
export function getColumnRange(worksheet: ExcelJS.Worksheet): {
  start: number;
  end: number;
} {
  let start = 0;
  let end = 0;

  worksheet.eachRow((row) => {
    row.eachCell((cell, colNumber) => {
      if (cell.value !== null && cell.value !== undefined) {
        const colIndex = colNumber - 1; // Convert to 0-based
        if (start === 0 || colIndex < start) start = colIndex;
        if (colIndex > end) end = colIndex;
      }
    });
  });

  return { start, end };
}

/**
 * Detect data start row by looking for header marker
 */
export function detectDataStartRow(
  worksheet: ExcelJS.Worksheet,
  headerMarkers: string[],
  maxSearchRows: number = 20
): number {
  for (let r = 1; r <= maxSearchRows; r++) {
    const row = worksheet.getRow(r);
    let found = false;
    row.eachCell((cell) => {
      if (typeof cell.value === "string") {
        const value = cell.value.trim();
        if (headerMarkers.some((marker) => value.includes(marker))) {
          found = true;
        }
      }
    });
    if (found) {
      return r; // Return 1-based row
    }
  }
  return 10; // Default fallback
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize text by collapsing whitespace
 */
export function normalizeText(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Convert column number to Excel letter (1=A, 2=B, ..., 27=AA)
 */
export function columnNumberToLetter(col: number): string {
  let letter = "";
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Set cell with template styling
 */
export function setCell(
  worksheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: string | number | Date | null | undefined,
  templates: ColumnTemplateMap
): ExcelJS.Cell {
  const cell = getCell(worksheet, row, col);
  const template = templates[col];

  if (template?.style) {
    applyCellStyle(cell, template.style);
  }

  if (value === null || value === undefined || value === "") {
    cell.value = null;
  } else if (typeof value === "number") {
    cell.value = value;
  } else if (value instanceof Date) {
    cell.value = value;
  } else {
    cell.value = String(value);
  }

  if (template?.numFmt) {
    cell.numFmt = template.numFmt;
  }

  return cell;
}
