/**
 * ExcelJS Utility Library
 * Provides compatibility layer and helper functions for migrating from xlsx-js-style to ExcelJS
 */

import * as ExcelJS from 'exceljs';

// ============================================================================
// Type Definitions
// ============================================================================

export type BorderWeight = 'thin' | 'medium' | 'thick';
export type BorderEdge = 'top' | 'right' | 'bottom' | 'left';

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
    vertical?: 'top' | 'middle' | 'bottom';
    horizontal?: 'left' | 'center' | 'right';
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
    type?: 'pattern';
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

export const BORDER_COLOR = { argb: 'FF000000' };
export const DEFAULT_FONT = { name: 'Arial', size: 10, color: BORDER_COLOR };
export const DEFAULT_ALIGNMENT = {
  vertical: 'middle' as const,
  horizontal: 'center' as const,
  wrapText: true,
};

// Predefined styles for different cell types
export const THIN_BORDER = {
  top: { style: 'thin' as const, color: BORDER_COLOR },
  right: { style: 'thin' as const, color: BORDER_COLOR },
  bottom: { style: 'thin' as const, color: BORDER_COLOR },
  left: { style: 'thin' as const, color: BORDER_COLOR },
};

export const MEDIUM_BORDER = {
  top: { style: 'medium' as const, color: BORDER_COLOR },
  right: { style: 'medium' as const, color: BORDER_COLOR },
  bottom: { style: 'medium' as const, color: BORDER_COLOR },
  left: { style: 'medium' as const, color: BORDER_COLOR },
};

export const LIGHT_GRAY_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFD9D9D9' },
};

export const LIGHT_YELLOW_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb: 'FFFFFFFE0' },
};

// ============================================================================
// Style Application Helpers
// ============================================================================

/**
 * Apply data cell style (standard table cell)
 */
export function applyDataCellStyle(cell: ExcelJS.Cell, options?: {
  horizontal?: 'left' | 'center' | 'right';
  numFmt?: string;
  bold?: boolean;
}): void {
  cell.font = {
    name: 'Arial',
    size: 10,
    color: BORDER_COLOR,
    bold: options?.bold || false,
  };
  cell.alignment = {
    vertical: 'middle',
    horizontal: options?.horizontal || 'center',
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
    name: 'Arial',
    size: 11,
    color: BORDER_COLOR,
    bold: true,
  };
  cell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true,
  };
  cell.border = MEDIUM_BORDER;
  cell.fill = LIGHT_GRAY_FILL;
}

/**
 * Apply total cell style (bold, yellow background, thin left/top/bottom, medium right)
 */
export function applyTotalCellStyle(cell: ExcelJS.Cell, isLastColumn: boolean = false): void {
  cell.font = {
    name: 'Arial',
    size: 10,
    color: BORDER_COLOR,
    bold: true,
  };
  cell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: false,
  };
  cell.border = {
    top: { style: 'thin', color: BORDER_COLOR },
    left: { style: 'thin', color: BORDER_COLOR },
    bottom: { style: 'thin', color: BORDER_COLOR },
    right: { style: isLastColumn ? 'medium' : 'thin', color: BORDER_COLOR },
  };
  cell.fill = LIGHT_YELLOW_FILL;
  cell.numFmt = '0.0';
}

// ============================================================================
// Cell Access Helpers
// ============================================================================

/**
 * Get cell by address (e.g., 'A1') or by row/col indices
 */
export function getCell(
  worksheet: ExcelJS.Worksheet,
  addressOrRow: string | number,
  col?: number
): ExcelJS.Cell {
  if (typeof addressOrRow === 'string') {
    return worksheet.getCell(addressOrRow);
  }
  // ExcelJS uses 1-based indexing
  return worksheet.getCell(addressOrRow + 1, col! + 1);
}

/**
 * Set cell value with optional formatting
 */
export function setCellValue(
  worksheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: string | number | Date | null | undefined,
  style?: CellStyle,
  numFmt?: string
): ExcelJS.Cell {
  const cell = getCell(worksheet, row, col);

  if (value === null || value === undefined || value === '') {
    cell.value = null;
  } else if (typeof value === 'number') {
    cell.value = value;
  } else if (value instanceof Date) {
    cell.value = value;
  } else {
    cell.value = String(value);
  }

  if (style) {
    applyCellStyle(cell, style);
  }

  if (numFmt) {
    cell.numFmt = numFmt;
  }

  return cell;
}

/**
 * Ensure cell exists and has template style
 */
export function ensureCell(
  worksheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  templates: ColumnTemplateMap
): ExcelJS.Cell {
  const cell = getCell(worksheet, row, col);
  const template = templates[col];

  if (template?.style) {
    applyCellStyle(cell, template.style);
  }

  if (template?.numFmt) {
    cell.numFmt = template.numFmt;
  }

  return cell;
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
  const cell = ensureCell(worksheet, row, col, templates);
  const template = templates[col];

  if (value === null || value === undefined || value === '') {
    cell.value = null;
  } else if (typeof value === 'number') {
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

// ============================================================================
// Style Helpers
// ============================================================================

/**
 * Apply style to a cell
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
        font.color = { argb: colorValue.startsWith('FF') ? colorValue : 'FF' + colorValue };
      }
    }
    cell.font = font;
  }

  if (style.alignment) {
    cell.alignment = style.alignment as Partial<ExcelJS.Alignment>;
  }

  if (style.border) {
    const border: Partial<ExcelJS.Borders> = {};
    (['top', 'right', 'bottom', 'left'] as BorderEdge[]).forEach((edge) => {
      const borderDef = style.border![edge];
      if (borderDef) {
        const colorValue = borderDef.color?.argb || borderDef.color?.rgb || 'FF000000';
        border[edge] = {
          style: borderDef.style,
          color: { argb: colorValue.startsWith('FF') ? colorValue : 'FF' + colorValue },
        };
      }
    });
    cell.border = border;
  }

  if (style.fill && style.fill.fgColor) {
    const colorValue = style.fill.fgColor.argb || style.fill.fgColor.rgb;
    if (colorValue) {
      cell.fill = {
        type: 'pattern',
        pattern: (style.fill.pattern as any) || 'solid',
        fgColor: { argb: colorValue.startsWith('FF') ? colorValue : 'FF' + colorValue },
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
      color: cell.font.color ? { argb: (cell.font.color as any).argb } : undefined,
    };
  }

  if (cell.alignment) {
    style.alignment = {
      vertical: cell.alignment.vertical,
      horizontal: cell.alignment.horizontal,
      wrapText: cell.alignment.wrapText,
      textRotation: cell.alignment.textRotation,
    };
  }

  if (cell.border) {
    style.border = {};
    (['top', 'right', 'bottom', 'left'] as BorderEdge[]).forEach((edge) => {
      const borderDef = (cell.border as any)?.[edge];
      if (borderDef) {
        style.border![edge] = {
          style: borderDef.style,
          color: borderDef.color ? { argb: borderDef.color.argb } : undefined,
        };
      }
    });
  }

  if (cell.fill && (cell.fill as any).fgColor) {
    style.fill = {
      type: 'pattern',
      pattern: (cell.fill as any).pattern,
      fgColor: { argb: (cell.fill as any).fgColor.argb },
      bgColor: (cell.fill as any).bgColor ? { argb: (cell.fill as any).bgColor.argb } : undefined,
    };
  }

  if (cell.numFmt) {
    style.numFmt = cell.numFmt;
  }

  return style;
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

// ============================================================================
// Grid Styling
// ============================================================================

/**
 * Apply consistent grid borders to a range of data rows
 */
export function applyWorkloadGridStyles(
  worksheet: ExcelJS.Worksheet,
  dataStartRow: number,
  dataRowCount: number,
  firstCol: number,
  lastCol: number,
  boundaryColumns: number[] = []
): void {
  const boundarySet = new Set(boundaryColumns);
  const getLeftWeight = (col: number): BorderWeight =>
    boundarySet.has(col) ? 'medium' : 'thin';
  const getRightWeight = (col: number): BorderWeight =>
    boundarySet.has(col + 1) ? 'medium' : 'thin';

  for (let r = dataStartRow; r < dataStartRow + dataRowCount; r++) {
    for (let c = firstCol; c <= lastCol; c++) {
      const cell = getCell(worksheet, r, c);

      const top: BorderWeight = r === dataStartRow ? 'medium' : 'thin';
      const bottom: BorderWeight = r === dataStartRow + dataRowCount - 1 ? 'medium' : 'thin';
      const left: BorderWeight = getLeftWeight(c);
      const right: BorderWeight = getRightWeight(c);

      applyBorders(cell, { top, bottom, left, right });
    }
  }
}

/**
 * Apply journal grid styles
 */
export function applyJournalGridStyles(
  worksheet: ExcelJS.Worksheet,
  headerRow: number,
  firstCol: number,
  lastCol: number,
  dataStartRow: number,
  dataRowCount: number,
  boundaryColumns: number[] = []
): void {
  const boundarySet = new Set(boundaryColumns);
  const getLeftWeight = (col: number): BorderWeight =>
    boundarySet.has(col) ? 'medium' : 'thin';
  const getRightWeight = (col: number): BorderWeight =>
    boundarySet.has(col + 1) ? 'medium' : 'thin';

  const lastDataRow = dataRowCount > 0 ? dataStartRow + dataRowCount - 1 : dataStartRow - 1;

  for (let r = dataStartRow; r <= lastDataRow; r++) {
    for (let c = firstCol; c <= lastCol; c++) {
      const cell = getCell(worksheet, r, c);

      const top: BorderWeight = r === dataStartRow ? 'medium' : 'thin';
      const bottom: BorderWeight = r === lastDataRow ? 'medium' : 'thin';
      const left: BorderWeight = getLeftWeight(c);
      const right: BorderWeight = getRightWeight(c);

      applyBorders(cell, { top, bottom, left, right });
    }
  }
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
      if (typeof cell.value === 'string' && cell.value.includes(searchSubstr)) {
        cell.value = cell.value.replace(new RegExp(searchSubstr, 'g'), replacement);
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
 * Expand worksheet range to include specific rows/columns
 */
export function expandRange(
  worksheet: ExcelJS.Worksheet,
  minRow: number,
  minCol: number,
  maxRow: number,
  maxCol: number
): void {
  // ExcelJS automatically expands range when cells are accessed
  // Just ensure the corner cells exist
  getCell(worksheet, minRow, minCol);
  getCell(worksheet, maxRow, maxCol);
}

/**
 * Get column range (first and last data columns)
 */
export function getColumnRange(worksheet: ExcelJS.Worksheet): { start: number; end: number } {
  let start = 0;
  let end = 0;

  worksheet.eachRow((row, rowNumber) => {
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
      if (typeof cell.value === 'string') {
        const value = cell.value.trim();
        if (headerMarkers.some((marker) => value.includes(marker))) {
          found = true;
        }
      }
    });
    if (found) {
      return r; // Return 1-based row, next row is data start
    }
  }
  return 10; // Default fallback
}

// ============================================================================
// Journal-Specific Helpers
// ============================================================================

export interface JournalHeaderInfo {
  row: number;
  firstCol: number;
  lastCol: number;
  studentNameCol: number;
  dateCol: number;
  finalGradeCol: number;
  noFinalControlCol: number;
}

/**
 * Detect journal header row and column positions
 */
export function detectJournalHeader(worksheet: ExcelJS.Worksheet): JournalHeaderInfo {
  let headerRow = -1;

  // Find header row by looking for "№ п/п"
  for (let r = 1; r <= 30; r++) {
    const row = worksheet.getRow(r);
    let found = false;
    row.eachCell((cell, colNumber) => {
      if (typeof cell.value === 'string' && cell.value.trim().includes('№ п/п')) {
        headerRow = r;
        found = true;
      }
    });
    if (found) break;
  }

  if (headerRow === -1) {
    throw new Error('Header row not found in template');
  }

  // Detect column positions
  let firstCol = 999;
  let lastCol = 0;
  let studentNameCol = 2; // Default
  let dateCol = 3; // Default
  let finalGradeCol = 10; // Default
  let noFinalControlCol = 11; // Default

  const headerRowObj = worksheet.getRow(headerRow);
  headerRowObj.eachCell((cell, colNumber) => {
    const value = typeof cell.value === 'string' ? cell.value.trim() : String(cell.value || '');
    if (!value) return;

    const colIndex = colNumber - 1; // Convert to 0-based
    firstCol = Math.min(firstCol, colIndex);
    lastCol = Math.max(lastCol, colIndex);

    if (value.toLowerCase().includes('фамилия')) {
      studentNameCol = colIndex;
    } else if (value.toLowerCase().includes('дата проведения')) {
      dateCol = colIndex;
    } else if (value.toLowerCase().includes('итоговая')) {
      finalGradeCol = colIndex;
    } else if (value.toLowerCase().includes('без итогового')) {
      noFinalControlCol = colIndex;
    }
  });

  return {
    row: headerRow - 1, // Convert to 0-based
    firstCol,
    lastCol,
    studentNameCol,
    dateCol,
    finalGradeCol,
    noFinalControlCol,
  };
}

/**
 * Collect column templates for journal (looks for existing cells in data rows)
 */
export function collectJournalColumnTemplates(
  worksheet: ExcelJS.Worksheet,
  dataStartRow: number,
  startCol: number,
  endCol: number,
  headerRow: number
): ColumnTemplateMap {
  const templates: ColumnTemplateMap = {};

  for (let c = startCol; c <= endCol; c++) {
    let templateCell: ExcelJS.Cell | undefined;

    // Look for existing cells in data rows
    for (let r = dataStartRow; r < dataStartRow + 30; r++) {
      const cell = getCell(worksheet, r, c);
      if (cell && cell.value !== null && cell.value !== undefined) {
        templateCell = cell;
        break;
      }
    }

    // Fallback to dates row
    if (!templateCell) {
      const cell = getCell(worksheet, headerRow + 1, c);
      if (cell && cell.value !== null) {
        templateCell = cell;
      }
    }

    // Fallback to header row
    if (!templateCell) {
      const cell = getCell(worksheet, headerRow, c);
      if (cell) {
        templateCell = cell;
      }
    }

    if (templateCell) {
      templates[c] = {
        style: cloneCellStyle(templateCell),
        numFmt: templateCell.numFmt || undefined,
      };
    }
  }

  return templates;
}

/**
 * Apply journal-specific grid styles
 */
export function applyJournalGridStylesExtended(
  worksheet: ExcelJS.Worksheet,
  header: JournalHeaderInfo,
  templates: ColumnTemplateMap,
  dataRowCount: number
): void {
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
    boundaryColumns.has(col) ? 'medium' : 'thin';
  const getRightWeight = (col: number): BorderWeight =>
    boundaryColumns.has(col + 1) ? 'medium' : 'thin';

  // Teacher info row
  if (teacherInfoRow >= 0) {
    for (let c = header.firstCol; c <= header.lastCol; c++) {
      const cell = ensureCell(worksheet, teacherInfoRow, c, templates);
      applyBorders(cell, {
        top: 'medium',
        bottom: 'medium',
        left: getLeftWeight(c),
        right: getRightWeight(c),
      });
    }
  }

  // Header row
  for (let c = header.firstCol; c <= header.lastCol; c++) {
    const cell = ensureCell(worksheet, headerRow, c, templates);
    applyBorders(cell, {
      top: 'medium',
      bottom: 'medium',
      left: getLeftWeight(c),
      right: getRightWeight(c),
    });

    if (c === header.studentNameCol) {
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
      };
    }
  }

  // Dates row
  for (let c = header.firstCol; c <= header.lastCol; c++) {
    const cell = ensureCell(worksheet, datesRow, c, templates);
    applyBorders(cell, {
      top: 'medium',
      bottom: 'medium',
      left: getLeftWeight(c),
      right: getRightWeight(c),
    });

    if (c >= header.studentNameCol + 1 && c <= header.dateCol - 1) {
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
    }
  }

  // Data rows
  if (dataRowCount > 0) {
    for (let r = firstDataRow; r <= lastDataRow; r++) {
      for (let c = header.firstCol; c <= header.lastCol; c++) {
        const cell = ensureCell(worksheet, r, c, templates);
        const top: BorderWeight = r === firstDataRow ? 'medium' : 'thin';
        const bottom: BorderWeight = r === lastDataRow ? 'medium' : 'thin';
        const left: BorderWeight = getLeftWeight(c);
        const right: BorderWeight = getRightWeight(c);

        applyBorders(cell, { top, bottom, left, right });

        if (c === header.studentNameCol) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          };
        } else if (c === header.firstCol || c >= header.studentNameCol + 1) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true,
          };
        }
      }
    }
  }
}
