import * as mammoth from "mammoth";

export interface DocxKtpParsedLesson {
  lessonNumber: number;
  subject: string;
  hours: number | string;
  lessonType: string;
  homework: string;
  notes: string;
}

export interface DocxKtpParseResult {
  metadata: {
    fileName: string;
    parsedAt: string;
    source: "docx";
  };
  lessons: DocxKtpParsedLesson[];
}

function normalizeText(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function parseHours(value: string): number | string {
  const str = normalizeText(value);
  if (!str) return 0;
  const num = parseFloat(str.replace(",", "."));
  return Number.isFinite(num) ? num : str;
}

function looksLikeKtpTemplateTable(text: string): boolean {
  const t = normalizeText(text).toLowerCase();
  const signals = [
    /№\s*занятия/i,
    /сабақ\s*№/i, // kk
    /количество\s+часов/i,
    /тип\s+занятий/i,
    /домашнее\s+задание/i,
    /примечание/i,
  ];
  const hits = signals.reduce((acc, re) => acc + (re.test(t) ? 1 : 0), 0);
  return hits >= 2;
}

export async function parseKtpFromDocxTemplate(
  file: File
): Promise<DocxKtpParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

  const document = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(document.querySelectorAll("table"));

  const table =
    tables.find((t) => looksLikeKtpTemplateTable(t.textContent || "")) ||
    tables[0];

  if (!table) {
    throw new Error("В документе не найдена таблица для импорта");
  }

  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length < 2) {
    throw new Error("В таблице нет строк для импорта");
  }

  const headerRowIndex = rows.findIndex((row) =>
    /№\s*занятия|сабақ/i.test(row.textContent || "")
  );
  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 1;

  const lessons: DocxKtpParsedLesson[] = [];

  for (const row of rows.slice(startIndex)) {
    const cells = Array.from(row.querySelectorAll("td,th"));
    if (!cells.length) continue;

    const expanded: string[] = [];
    for (const cell of cells) {
      const colspan = parseInt(cell.getAttribute("colspan") || "1", 10) || 1;
      const cellText = normalizeText(cell.textContent || "");
      for (let i = 0; i < colspan; i++) expanded.push(cellText);
    }

    const numberMatch = (expanded[0] || "").match(/\d+/);
    const lessonNumber = numberMatch ? parseInt(numberMatch[0], 10) : NaN;
    if (!Number.isFinite(lessonNumber) || lessonNumber <= 0) continue;

    const subject = expanded[1] || "";
    const hours = parseHours(expanded[2] || "");
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
      parsedAt: new Date().toISOString(),
      source: "docx",
    },
    lessons,
  };
}
