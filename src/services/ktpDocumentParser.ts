import {
  parseEducationalScheduleViaConvex,
  exportKtpToExcelViaConvex,
} from "@/services/convex-excel-export";
import { parseKtpDocxFile } from "@/services/docx-ktp-parser";
import type { ParsedLesson, KtpDetail } from "@/types/ktp";

export interface ParsedKtpDocument {
  lessons: ParsedLesson[];
  metadata: {
    fileName: string;
    totalLessons: number;
  };
}

/**
 * Parses an uploaded .docx or .xlsx/.xls KTP document into a list of parsed lessons.
 */
export async function parseKtpFile(file: File): Promise<ParsedKtpDocument> {
  const isDocx =
    file.name.toLowerCase().endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const parseResult = isDocx
    ? await parseKtpDocxFile(file)
    : await parseEducationalScheduleViaConvex(file);

  if (!parseResult.lessons || parseResult.lessons.length === 0) {
    throw new Error("В файле не найдено ни одного урока для импорта");
  }

  return parseResult;
}

/**
 * Exports KTP detail items to Excel using standard template.
 */
export async function exportKtpDetailsToExcel(
  items: KtpDetail[],
  learningOutcome?: string,
  templatePath = "/rup_templates/Шаблон КТП Марса.xlsx"
): Promise<void> {
  const dataRows = items.map((item) => [
    item.position,
    item.theme,
    item.totalHours ?? null,
    null, // lesson type placeholder
    item.homework ?? null,
    item.notes ?? null,
  ]);

  await exportKtpToExcelViaConvex(dataRows, templatePath, learningOutcome);
}
