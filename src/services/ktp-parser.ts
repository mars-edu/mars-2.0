import mammoth from "mammoth";
import Fuse from "fuse.js";

interface LessonPlan {
  lessonNumber?: string;
  date?: string;
  topic?: string;
  hours?: number;
  homework?: string;
  notes?: string;
}

interface ParsedKTP {
  header: {
    institution?: string;
    subject?: string;
    specialty?: string;
    course?: string;
    group?: string;
    totalHours?: number;
    teacher?: string;
    semester?: string;
  };
  lessons: LessonPlan[];
  summary?: {
    totalHours?: number;
    theoreticalHours?: number;
    practicalHours?: number;
    individualHours?: number;
  };
}

interface TableCell {
  text: string;
  rowIndex: number;
  colIndex: number;
}

class KTPParser {
  private fuzzyOptions = {
    includeScore: true,
    threshold: 0.3,
    keys: ["text"],
  };

  // Header field patterns for fuzzy matching
  private headerPatterns = [
    {
      key: "subject",
      patterns: ["модуль", "пән", "дисциплине", "discipline", "subject"],
    },
    { key: "specialty", patterns: ["мамандық", "специальность", "specialty"] },
    { key: "course", patterns: ["курс", "course"] },
    { key: "teacher", patterns: ["педагог", "teacher", "преподаватель"] },
    { key: "semester", patterns: ["семестр", "semester"] },
    {
      key: "totalHours",
      patterns: ["сағат саны", "количество часов", "hours"],
    },
  ];

  // Table column patterns
  private columnPatterns = [
    {
      key: "lessonNumber",
      patterns: ["сабақ №", "№ занятия", "lesson", "номер"],
    },
    {
      key: "date",
      patterns: ["күнтізбелік мерзімі", "календарные сроки", "date", "дата"],
    },
    {
      key: "topic",
      patterns: ["тақырып атауы", "наименование", "тема", "topic"],
    },
    { key: "hours", patterns: ["сағаттар саны", "количество часов", "hours"] },

    {
      key: "homework",
      patterns: ["үй тапсырмасы", "домашнее задание", "homework"],
    },
    { key: "notes", patterns: ["ескерту", "примечание", "notes"] },
  ];

  async parseFromFile(filePath: string): Promise<ParsedKTP> {
    const result = await mammoth.extractRawText({ path: filePath });
    return this.parseFromText(result.value);
  }

  async parseFromBuffer(buffer: Buffer): Promise<ParsedKTP> {
    const result = await mammoth.extractRawText({ buffer });
    return this.parseFromText(result.value);
  }

  parseFromText(text: string): ParsedKTP {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const header = this.parseHeader(lines);
    const { lessons, summary } = this.parseContent(lines);

    return {
      header,
      lessons,
      summary,
    };
  }

  private parseHeader(lines: string[]): ParsedKTP["header"] {
    const header: ParsedKTP["header"] = {};

    // Look for header information in the first 20 lines
    const headerLines = lines.slice(0, 20);

    for (const line of headerLines) {
      for (const pattern of this.headerPatterns) {
        const match = this.fuzzyMatch(line, pattern.patterns);
        if (match) {
          const value = this.extractValue(line);
          if (value) {
            if (pattern.key === "totalHours") {
              header[pattern.key] = this.extractNumber(value);
            } else {
              header[pattern.key as keyof ParsedKTP["header"]] = value;
            }
          }
        }
      }
    }

    return header;
  }

  private parseContent(lines: string[]): {
    lessons: LessonPlan[];
    summary?: ParsedKTP["summary"];
  } {
    const lessons: LessonPlan[] = [];
    let summary: ParsedKTP["summary"] | undefined;

    // Find table start and end
    const tableStart = this.findTableStart(lines);
    const tableEnd = this.findTableEnd(lines, tableStart);

    if (tableStart === -1) {
      return { lessons };
    }

    const tableLines = lines.slice(
      tableStart,
      tableEnd === -1 ? undefined : tableEnd
    );
    const tableData = this.parseTable(tableLines);

    // Parse lessons from table
    const columnMapping = this.identifyColumns(tableData);
    lessons.push(...this.extractLessons(tableData, columnMapping));

    // Parse summary if exists
    summary = this.parseSummary(
      lines.slice(tableEnd === -1 ? lines.length : tableEnd)
    );

    return { lessons, summary };
  }

  private findTableStart(lines: string[]): number {
    const tableIndicators = ["сабақ №", "№ занятия", "тақырып", "наименование"];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (
        tableIndicators.some((indicator) =>
          line.includes(indicator.toLowerCase())
        )
      ) {
        return i;
      }
    }
    return -1;
  }

  private findTableEnd(lines: string[], start: number): number {
    const summaryIndicators = ["барлық сағат", "всего часов", "распределение"];

    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (
        summaryIndicators.some((indicator) =>
          line.includes(indicator.toLowerCase())
        )
      ) {
        return i;
      }
    }
    return -1;
  }

  private parseTable(lines: string[]): TableCell[][] {
    const table: TableCell[][] = [];

    lines.forEach((line, rowIndex) => {
      // Simple table parsing - split by multiple spaces or tabs
      const cells = line
        .split(/\s{2,}|\t/)
        .filter((cell) => cell.trim().length > 0);

      if (cells.length > 1) {
        const row: TableCell[] = cells.map((text, colIndex) => ({
          text: text.trim(),
          rowIndex,
          colIndex,
        }));
        table.push(row);
      }
    });

    return table;
  }

  private identifyColumns(table: TableCell[][]): Map<string, number> {
    const columnMapping = new Map<string, number>();

    if (table.length === 0) return columnMapping;

    const headerRow = table[0];

    headerRow.forEach((cell, index) => {
      for (const pattern of this.columnPatterns) {
        if (this.fuzzyMatch(cell.text, pattern.patterns)) {
          columnMapping.set(pattern.key, index);
          break;
        }
      }
    });

    return columnMapping;
  }

  private extractLessons(
    table: TableCell[][],
    columnMapping: Map<string, number>
  ): LessonPlan[] {
    const lessons: LessonPlan[] = [];

    // Skip header row
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const lesson: LessonPlan = {};

      // Extract data based on column mapping
      for (const [key, colIndex] of columnMapping.entries()) {
        if (colIndex < row.length) {
          const cellText = row[colIndex].text;

          switch (key) {
            case "lessonNumber":
              lesson.lessonNumber = cellText;
              break;
            case "date":
              lesson.date = this.parseDate(cellText);
              break;
            case "topic":
              lesson.topic = cellText;
              break;
            case "hours":
              lesson.hours = this.extractNumber(cellText);
              break;

            case "homework":
              lesson.homework = cellText;
              break;
            case "notes":
              lesson.notes = cellText;
              break;
          }
        }
      }

      // Only add lessons with meaningful content
      if (lesson.topic || lesson.lessonNumber) {
        lessons.push(lesson);
      }
    }

    return lessons;
  }

  private parseSummary(lines: string[]): ParsedKTP["summary"] | undefined {
    const summary: ParsedKTP["summary"] = {};

    for (const line of lines) {
      if (line.includes("барлық сағат") || line.includes("всего часов")) {
        summary.totalHours = this.extractNumber(line);
      } else if (line.includes("теориялық") || line.includes("теоретические")) {
        summary.theoreticalHours = this.extractNumber(line);
      } else if (
        line.includes("практикалық") ||
        line.includes("практические")
      ) {
        summary.practicalHours = this.extractNumber(line);
      } else if (
        line.includes("жеке сабақтар") ||
        line.includes("индивидуальные")
      ) {
        summary.individualHours = this.extractNumber(line);
      }
    }

    return Object.keys(summary).length > 0 ? summary : undefined;
  }

  private fuzzyMatch(text: string, patterns: string[]): boolean {
    const fuse = new Fuse(
      patterns.map((p) => ({ text: p })),
      this.fuzzyOptions
    );
    const results = fuse.search(text.toLowerCase());
    return (
      results.length > 0 && results[0].score! < this.fuzzyOptions.threshold
    );
  }

  private extractValue(line: string): string | null {
    // Extract value after common separators
    const separators = [":", "___", "_", "/", "//"];

    for (const sep of separators) {
      const parts = line.split(sep);
      if (parts.length > 1) {
        const value = parts[1].trim();
        if (value && value !== "_" && value !== "___") {
          return value;
        }
      }
    }

    return null;
  }

  private extractNumber(text: string): number | undefined {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  }

  private parseDate(dateText: string): string | undefined {
    // Handle various date formats
    const datePatterns = [
      /(\d{2})\.(\d{2})\.(\d{2,4})/, // DD.MM.YY or DD.MM.YYYY
      /(\d{2})\/(\d{2})\/(\d{2,4})/, // DD/MM/YY or DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{2,4})/, // DD-MM-YY or DD-MM-YYYY
    ];

    for (const pattern of datePatterns) {
      const match = dateText.match(pattern);
      if (match) {
        return dateText.trim();
      }
    }

    return dateText.trim() || undefined;
  }
}

// Usage example
// export async function parseKTP(filePath: string): Promise<ParsedKTP> {
//   const parser = new KTPParser();
//   return parser.parseFromFile(filePath);
// }

// export async function parseKTPFromBuffer(buffer: Buffer): Promise<ParsedKTP> {
//   const parser = new KTPParser();
//   return parser.parseFromBuffer(buffer);
// }

export { KTPParser, ParsedKTP, LessonPlan };
