/**
 * Excel Template Loader
 * Handles loading and caching of Excel templates
 * Supports both .xls and .xlsx formats
 *
 * NOTE: This module is no longer used for teacher workload reports.
 * Teacher workload reports now use excel-template-generator.ts which
 * creates templates programmatically without file dependencies.
 * This module can be removed if not used elsewhere in the codebase.
 */

import * as ExcelJS from 'exceljs';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TemplateMetadata {
  url: string;
  workbook: ExcelJS.Workbook;
  originalFormat: 'xlsx';
  loadedAt: number;
}

// ============================================================================
// Cache
// ============================================================================

const TEMPLATE_CACHE = new Map<string, TemplateMetadata>();

// ============================================================================
// Template Loading
// ============================================================================

/**
 * Load an Excel template and return ExcelJS workbook
 * Loads .xlsx files directly with ExcelJS (preserves all styles automatically)
 */
export async function loadTemplate(url: string): Promise<ExcelJS.Workbook> {
  // Check cache
  if (TEMPLATE_CACHE.has(url)) {
    const cached = TEMPLATE_CACHE.get(url)!;
    // Clone the workbook to avoid mutations affecting cached version
    return cloneWorkbook(cached.workbook);
  }

  // Fetch template
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  // Load .xlsx using ExcelJS directly (preserves all styles, fonts, borders, fills, etc.)
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Cache the template
  TEMPLATE_CACHE.set(url, {
    url,
    workbook: await cloneWorkbook(workbook),
    originalFormat: 'xlsx',
    loadedAt: Date.now(),
  });

  return workbook;
}

/**
 * Clear template cache
 */
export function clearTemplateCache(url?: string): void {
  if (url) {
    TEMPLATE_CACHE.delete(url);
  } else {
    TEMPLATE_CACHE.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; urls: string[] } {
  return {
    size: TEMPLATE_CACHE.size,
    urls: Array.from(TEMPLATE_CACHE.keys()),
  };
}

/**
 * Clone an ExcelJS workbook
 */
async function cloneWorkbook(workbook: ExcelJS.Workbook): Promise<ExcelJS.Workbook> {
  const buffer = await workbook.xlsx.writeBuffer();
  const cloned = new ExcelJS.Workbook();
  await cloned.xlsx.load(buffer);
  return cloned;
}

// ============================================================================
// Template Cell Helpers
// ============================================================================

/**
 * Sanitize template cell (remove value but keep formatting)
 */
export function sanitizeTemplateCell(cell: ExcelJS.Cell): void {
  cell.value = null;
}

/**
 * Copy cell formatting from one cell to another
 */
export function copyCellFormatting(sourceCell: ExcelJS.Cell, targetCell: ExcelJS.Cell): void {
  if (sourceCell.font) targetCell.font = { ...sourceCell.font };
  if (sourceCell.alignment) targetCell.alignment = { ...sourceCell.alignment };
  if (sourceCell.border) targetCell.border = { ...sourceCell.border };
  if (sourceCell.fill) targetCell.fill = { ...sourceCell.fill };
  if (sourceCell.numFmt) targetCell.numFmt = sourceCell.numFmt;
}
