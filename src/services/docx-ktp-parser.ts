/**
 * Frontend DOCX KTP Parser
 * Parses KTP (Calendar-Thematic Planning) from Word documents using mammoth
 * Runs in the browser, not in Convex backend
 */

import * as mammoth from "mammoth";

export interface ParsedLesson {
  lessonNumber: number;
  subject: string;
  hours: number;
  lessonType: string;
  homework: string;
  notes: string;
}

export interface ParseMetadata {
  fileName: string;
  sheetName: string;
  totalLessons: number;
  headerRow: number;
  headers: string[];
  parsedAt: string;
}

export interface ParseResult {
  metadata: ParseMetadata;
  lessons: ParsedLesson[];
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Normalize text by trimming and collapsing whitespace
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Parse hours from text (e.g., "2", "2.5", "2 ч", "2,5")
 */
function parseHoursFromText(text: string): number {
  const cleaned = text.replace(/[^\d.,]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Check if table looks like a KTP template
 */
function tableLooksLikeKtpTemplate(text: string): boolean {
  const lowerText = text.toLowerCase();
  return (
    (lowerText.includes("занят") || lowerText.includes("сабақ")) &&
    (lowerText.includes("тема") || lowerText.includes("тақырып"))
  );
}

/**
 * Parse KTP template data from Word (.docx) file.
 *
 * Expects a table with columns similar to:
 * № занятия | Тема | Часы | Тип занятий | Домашнее задание | Примечание
 *
 * @param file - The .docx file to parse
 * @returns Parse result with metadata and lessons
 */
export async function parseKtpDocxFile(file: File): Promise<ParseResult> {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Mammoth input for browser
  const mammothInput = { arrayBuffer };

  // Convert DOCX to HTML
  const { value: html } = await mammoth.convertToHtml(mammothInput);

  // Extract tables from HTML
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  if (!tables.length) {
    throw new Error("В документе Word не найдено таблиц");
  }

  // Find the KTP table (or use first table)
  const tableHtml =
    tables.find((t) => tableLooksLikeKtpTemplate(stripHtml(t))) ?? tables[0];
  if (!tableHtml) {
    throw new Error("В документе Word не найдено таблиц");
  }

  // Extract rows from table
  const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  if (rows.length < 2) {
    throw new Error("В таблице не найдено строк с данными");
  }

  // Find header row (contains "№ занятия" or "сабақ")
  const headerRowIndex = rows.findIndex((row) =>
    /№\s*занятия|сабақ/i.test(stripHtml(row))
  );
  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 1;

  const lessons: ParsedLesson[] = [];

  // Parse each row after header
  for (const rowHtml of rows.slice(startIndex)) {
    const cellMatches =
      rowHtml.match(/<(td|th)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi) || [];
    if (!cellMatches.length) continue;

    // Expand cells with colspan
    const expanded: string[] = [];

    for (const cellHtml of cellMatches) {
      const attrs = cellHtml.match(/<(td|th)(\s[^>]*)?>/i)?.[2] || "";
      const colspanMatch = attrs.match(/colspan\s*=\s*"?(\d+)"?/i);
      const colspan = colspanMatch ? parseInt(colspanMatch[1], 10) : 1;

      const inner =
        cellHtml.match(/<(td|th)(\s[^>]*)?>([\s\S]*?)<\/\1>/i)?.[3] || "";
      const cellText = normalizeText(stripHtml(inner));

      // Add cell content multiple times if colspan > 1
      for (let i = 0; i < Math.max(1, colspan); i++) {
        expanded.push(cellText);
      }
    }

    // Parse lesson number (first column)
    const numberMatch = (expanded[0] || "").match(/\d+/);
    const lessonNumber = numberMatch ? parseInt(numberMatch[0], 10) : NaN;
    if (!Number.isFinite(lessonNumber) || lessonNumber <= 0) continue;

    // Parse other columns
    const subject = expanded[1] || "";
    const hours = parseHoursFromText(expanded[2] || "");
    const lessonType = expanded[3] || "";
    const homework = expanded[4] || "";
    const notes = normalizeText(expanded.slice(5).filter(Boolean).join(" "));

    lessons.push({
      lessonNumber,
      subject,
      hours,
      lessonType,
      homework,
      notes,
    });
  }

  return {
    metadata: {
      fileName: file.name,
      sheetName: "DOCX",
      totalLessons: lessons.length,
      headerRow: headerRowIndex,
      headers: [
        "lessonNumber",
        "subject",
        "hours",
        "lessonType",
        "homework",
        "notes",
      ],
      parsedAt: new Date().toISOString(),
    },
    lessons,
  };
}
