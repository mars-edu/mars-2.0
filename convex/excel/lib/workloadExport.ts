/**
 * Teacher Workload Export - Convex Backend
 * Generates teacher workload report Excel files (3 forms)
 */

import * as Excel from "exceljs/dist/exceljs.min.js";
import type * as ExcelJS from "exceljs";
import {
  GRAY_FILL,
  detectDataStartRow,
  getCell,
} from "./_utils";
import type { TeacherWorkloadExportPayload } from "../../../src/lib/excel/workloadExport.types";

// ============================================================================
// Type Exports
// ============================================================================

// ============================================================================
// Constants
// ============================================================================

const THEME_BLACK = { theme: 1 };

const THIN_BORDER = {
  top: { style: "thin" as const },
  right: { style: "thin" as const },
  bottom: { style: "thin" as const },
  left: { style: "thin" as const },
};

const TIMES_NEW_ROMAN = "Times New Roman";

// Helper function to convert 0-based column index to Excel column letter
function getColumnLetter(col0: number): string {
  let letter = '';
  let temp = col0 + 1; // Convert to 1-based

  while (temp > 0) {
    const remainder = (temp - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    temp = Math.floor((temp - 1) / 26);
  }

  return letter;
}

function applyTimesCellStyle(
  cell: ExcelJS.Cell,
  options: {
    size: number;
    bold?: boolean;
    underline?: boolean;
    horizontal?: ExcelJS.Alignment["horizontal"];
    vertical?: ExcelJS.Alignment["vertical"];
    wrapText?: boolean;
    indent?: number;
    border?: Partial<ExcelJS.Borders>;
    fill?: ExcelJS.Fill;
  }
): void {
  cell.font = {
    name: TIMES_NEW_ROMAN,
    size: options.size,
    color: THEME_BLACK,
    bold: options.bold,
    underline: options.underline,
  };

  const alignment: Partial<ExcelJS.Alignment> = {};
  if (options.horizontal) alignment.horizontal = options.horizontal;
  if (options.vertical) alignment.vertical = options.vertical;
  if (options.wrapText !== undefined) alignment.wrapText = options.wrapText;
  if (options.indent !== undefined) alignment.indent = options.indent;
  if (Object.keys(alignment).length > 0) {
    cell.alignment = alignment;
  }

  cell.border = (options.border || THIN_BORDER) as Partial<ExcelJS.Borders>;

  if (options.fill) {
    cell.fill = options.fill;
  }
}

// ============================================================================
// Template Generators
// ============================================================================

function createForm1Sheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet("форма 1", {
    pageSetup: {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.26,
        right: 0.16,
        top: 0.28,
        bottom: 0.27,
        header: 0.24,
        footer: 0.31496062992126,
      },
    },
    properties: {
      defaultRowHeight: 15,
    },
  });

  // Set column widths
  sheet.getColumn(2).width = 5.88495575221239;
  sheet.getColumn(3).width = 11.5575221238938;
  sheet.getColumn(4).width = 58.6637168141593;
  sheet.getColumn(5).width = 42.6637168141593;

  for (let col = 6; col <= 36; col++) {
    sheet.getColumn(col).width = 5.66371681415929;
  }

  sheet.getColumn(37).width = 12.8849557522124; // Column AK - Итого часов
  sheet.getColumn(38).width = 30; // Column AL - Group
  sheet.getColumn(39).width = 54.3362831858407; // Column AM - Subject
  sheet.getColumn(40).width = 19; // Column AN - Planned hours
  sheet.getColumn(41).width = 9.88495575221239; // Column AO - Actual (month)
  sheet.getColumn(42).width = 11.6637168141593; // Column AP - Actual (cumulative)
  sheet.getColumn(43).width = 11.8849557522124; // Column AQ - Remaining

  // Set row heights
  sheet.getRow(2).height = 24.9;
  sheet.getRow(3).height = 24.9;
  sheet.getRow(4).height = 24.9;
  sheet.getRow(5).height = 24.9;
  sheet.getRow(6).height = 24.9;
  sheet.getRow(7).height = 24.9;
  sheet.getRow(9).height = 51; // Taller row for day numbers

  const titleFont = { name: "Times New Roman", size: 11, bold: true, color: THEME_BLACK };

  // Row 2: Ministry
  const b2 = sheet.getCell("B2");
  b2.value =
    "Қазақстан Республикасы Оқу-ағарту министрлігі/Министерство просвещения Республики Казахстан";
  b2.font = titleFont;
  b2.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells("B2:AK2");

  // Row 3: Institution
  const b3 = sheet.getCell("B3");
  b3.value =
    '"Музыкалық колледж  - дарынды балаларға арналған музыкалық мектеп - интернат" Кешені ММ/ ГУ "Комплекс "Музыкальный колледж - музыкальная школа - интернат для одарённых детей"';
  b3.font = titleFont;
  b3.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells("B3:AK3");

  // Row 4: Document title
  const b4 = sheet.getCell("B4");
  b4.value =
    "Педагог жұмысының әрбір айға арналған оқу уақытын есепке алу ведомосі (сағатпен және (немесе) кредитпен)  /Ведомость учёта учебного времени работы педагога за каждый месяц (в часах и (или) кредитах)";
  b4.font = titleFont;
  b4.alignment = { horizontal: "center", vertical: "distributed" };
  sheet.mergeCells("B4:AK4");

  // Row 5: Academic year
  const b5 = sheet.getCell("B5");
  b5.value = "2024/2025 оқу жылы/ за 2024/2025 учебный год";
  b5.font = titleFont;
  b5.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells("B5:AK5");

  // Row 6: Teacher name
  const b6 = sheet.getCell("B6");
  b6.value =
    "Педагогтің тегі, аты, әкесінің аты /Фамилия, имя, отчество педагога  Килаш";
  b6.font = titleFont;
  b6.alignment = { horizontal: "center", vertical: "middle" };
  sheet.mergeCells("B6:AK6");

  // Row 7: Teacher name suffix
  const r7 = sheet.getCell("R7");
  r7.value = "толық/полностью";
  r7.font = { name: TIMES_NEW_ROMAN, size: 11, color: THEME_BLACK };
  r7.alignment = { horizontal: "center" };
  r7.border = { bottom: { style: "thin" as const } };
  sheet.mergeCells("R7:U7");
}

function createForm2Sheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet("форма 2", {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: false,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    properties: {
      defaultRowHeight: 15,
    },
  });

  // Set column widths
  sheet.getColumn(2).width = 20.1061946902655; // B
  sheet.getColumn(3).width = 39.8849557522124; // C
  sheet.getColumn(12).width = 29.1061946902655; // L

  const titleFont = {
    name: TIMES_NEW_ROMAN,
    size: 14,
    bold: true,
    color: { argb: "FF444444" },
  };

  const b1 = sheet.getCell("B1");
  b1.value =
    "Педагог сағаттарының жылдық есебіне қосымша мәліметтер/Дополнительные сведения к годовому учету часов педагога";
  b1.font = titleFont;
  b1.alignment = { horizontal: "center", wrapText: true };
  sheet.mergeCells("B1:L1");

  const headerFont = { name: TIMES_NEW_ROMAN, size: 10, bold: true, color: THEME_BLACK };
  sheet.getRow(3).height = 21.75;
  sheet.getRow(4).height = 27.75;
  sheet.getRow(5).height = 25.55;
  sheet.getRow(6).height = 14.15;

  const b3 = sheet.getCell("B3");
  b3.value = "Оқу тобының №, студенттің аты-жөні/             № учебной группы/ ФИО студента";
  b3.font = headerFont;
  b3.alignment = { horizontal: "center", vertical: "top", wrapText: true };
  b3.border = THIN_BORDER;
  sheet.mergeCells("B3:B5");

  const c3 = sheet.getCell("C3");
  c3.value = "Пәннің және (немесе) модульдердің атауы/ Наименование дисциплины и (или) модулей";
  c3.font = headerFont;
  c3.alignment = { horizontal: "center", vertical: "top", wrapText: true };
  c3.border = THIN_BORDER;
  sheet.mergeCells("C3:C5");

  const d3 = sheet.getCell("D3");
  d3.value = "Сағат саны/ Количество часов";
  d3.font = headerFont;
  d3.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  d3.border = THIN_BORDER;
  sheet.mergeCells("D3:E4");

  const f3 = sheet.getCell("F3");
  f3.value = "Оның ішіндегі/Из них часы";
  f3.font = headerFont;
  f3.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  f3.border = THIN_BORDER;
  sheet.mergeCells("F3:K3");

  const l3 = sheet.getCell("L3");
  l3.value = "Жалпы сағат саны/  Общее количество часов";
  l3.font = headerFont;
  l3.alignment = { horizontal: "center", vertical: "top", wrapText: true };
  l3.border = THIN_BORDER;
  sheet.mergeCells("L3:L5");

  const f4 = sheet.getCell("F4");
  f4.value = "факультативатер факультатива";
  f4.font = headerFont;
  f4.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  f4.border = THIN_BORDER;
  sheet.mergeCells("F4:G4");

  const h4 = sheet.getCell("H4");
  h4.value = "консультациялар консультаций";
  h4.font = headerFont;
  h4.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  h4.border = THIN_BORDER;
  sheet.mergeCells("H4:I4");

  const j4 = sheet.getCell("J4");
  j4.value = "емтихандар экзаменов";
  j4.font = headerFont;
  j4.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  j4.border = THIN_BORDER;
  sheet.mergeCells("J4:K4");

  const smallFont = { name: "Times New Roman", size: 10, bold: true, color: THEME_BLACK };

  ["D", "F", "H", "J"].forEach((col) => {
    const planCell = sheet.getCell(`${col}5`);
    planCell.value = "жоспар план";
    planCell.font = smallFont;
    planCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    planCell.border = THIN_BORDER;
  });

  ["E", "G", "I", "K"].forEach((col) => {
    const factCell = sheet.getCell(`${col}5`);
    factCell.value = "нақты факт";
    factCell.font = smallFont;
    factCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    factCell.border = THIN_BORDER;
  });

  for (let i = 1; i <= 11; i++) {
    const colLetter = String.fromCharCode(65 + i);
    const cell = sheet.getCell(`${colLetter}6`);
    cell.value = i;
    cell.font = headerFont;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = THIN_BORDER;
  }

  // Note: Signature block is now dynamically created in populateForm2()
  // based on actual data row count
}

function createForm3Sheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet("форма 3", {
    pageSetup: {
      paperSize: 9,
      orientation: "portrait",
      fitToPage: false,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    properties: {
      defaultRowHeight: 15,
    },
  });

  // Match template column widths (column A keeps default width).
  sheet.getColumn(2).width = 34.6637168141593; // B
  sheet.getColumn(3).width = 11.3362831858407; // C
  sheet.getColumn(4).width = 11.4424778761062; // D
  sheet.getColumn(5).width = 11.3362831858407; // E
  sheet.getColumn(6).width = 12.4424778761062; // F
  sheet.getColumn(7).width = 11.4424778761062; // G
  sheet.getColumn(8).width = 11.6637168141593; // H
  sheet.getColumn(9).width = 13.4424778761062; // I
  sheet.getColumn(10).width = 11.8849557522124; // J
  sheet.getColumn(11).width = 12; // K
  sheet.getColumn(12).width = 11.6637168141593; // L
  sheet.getColumn(13).width = 14.6637168141593; // M

  sheet.getRow(2).height = 21.75;
  sheet.getRow(3).height = 18;
  sheet.getRow(4).height = 12;
  sheet.getRow(5).height = 28.5;
  sheet.getRow(7).height = 29.25;
  sheet.getRow(8).height = 15.75;
  sheet.getRow(9).height = 27.75;
  sheet.getRow(10).height = 18.75;
  sheet.getRow(11).height = 27.75;
  sheet.getRow(12).height = 30;
  sheet.getRow(13).height = 19.5;
  sheet.getRow(15).height = 30.5;

  const titleFont = { name: TIMES_NEW_ROMAN, size: 11, bold: true, color: THEME_BLACK };
  const normalFont = { name: TIMES_NEW_ROMAN, size: 10, color: THEME_BLACK };

  const b2 = sheet.getCell("B2");
  b2.value =
    "Қазақстан Республикасы Оқу-ағарту министрлігі/Министерство просвещения Республики Казахстан";
  b2.font = titleFont;
  b2.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.mergeCells("B2:L2");

  const b3 = sheet.getCell("B3");
  b3.value =
    " Педагогтің бір жылдағы оқу уақытын есепке алу ведомосы/Ведомость учета учебного времени педагога за год";
  b3.font = titleFont;
  b3.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.mergeCells("B3:L3");

  const b4 = sheet.getCell("B4");
  b4.value = "      (сағатпен және (немесе) кредитпен)/(в часах и (или) кредитах) ";
  b4.font = titleFont;
  b4.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.mergeCells("B4:K4");

  const b5 = sheet.getCell("B5");
  b5.value =
    '"Музыкалық колледж  - дарынды балаларға арналған музыкалық мектеп - интернат" Кешені ММ/                                                               ГУ "Комплекс "Музыкальный колледж - музыкальная школа - интернат  для одарённых детей"';
  b5.font = titleFont;
  b5.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.mergeCells("B5:K5");

  const b6 = sheet.getCell("B6");
  b6.value = "(наименование организации образования)";
  b6.font = normalFont;
  b6.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.mergeCells("B6:K6");

  const b7 = sheet.getCell("B7");
  b7.value =
    "2024/2025 оқу жылында педагог берген сағаттарды және (немесе) кредиттерді жылдық есепке алу/Годовой учет часов и (или) кредитов, проведенных педагогом  в 2024/2025 учебном году";
  b7.font = titleFont;
  b7.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.mergeCells("B7:K7");

  sheet.mergeCells("B8:K8");

  const b9 = sheet.getCell("B9");
  b9.value =
    "Педагогтің тегі, аты, әкесінің аты (болған жағдайда) (толық)/Фамилия, имя, отчество Қилаш";
  b9.font = normalFont;
  b9.alignment = { horizontal: "left", vertical: "top", wrapText: true };
  sheet.mergeCells("B9:L9");

  const b10 = sheet.getCell("B10");
  b10.value = "(при его наличии) педагога (полностью)";
  b10.font = normalFont;
  b10.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  sheet.mergeCells("B10:G10");

  const b11 = sheet.getCell("B11");
  b11.value =
    "Модуль индексі және пәндердің және (немесе) модульдің атауы (практика атауы)/Индекс модуля и наименование дисциплин и (или) модуля (наименование практики)";
  b11.font = normalFont;
  b11.alignment = { horizontal: "left", vertical: "top", wrapText: true };
  sheet.mergeCells("B11:K11");

  const b12 = sheet.getCell("B12");
  b12.value =
    "ООД 07 История Казахстана, ООД 10 Всемирная история, БМ 4 Применение основ социальных наук для социализации и адаптации в обществе и трудовом коллективе, Ф 2 Казахстанское право, Ф 4 Краеведение";
  b12.font = normalFont;
  b12.alignment = { horizontal: "left", vertical: "top", wrapText: true };
  sheet.mergeCells("B12:K12");

  sheet.mergeCells("B13:K13");

  const headerFont = { name: "Times New Roman", size: 12, bold: true, color: THEME_BLACK };
  const headerFontSmall = { name: "Times New Roman", size: 11, bold: true, color: THEME_BLACK };
  const groupHeaderAlignment = {
    horizontal: "center" as const,
    vertical: "middle" as const,
    wrapText: true,
  };
  const monthHeaderAlignment = {
    horizontal: "center" as const,
    vertical: "distributed" as const,
  };

  const b15 = sheet.getCell("B15");
  b15.value = "Топтар/ АЖ        Айлар                              Группы/ ФИО       Месяцы";
  b15.font = headerFont;
  b15.alignment = groupHeaderAlignment;
  b15.border = THIN_BORDER;
  b15.fill = GRAY_FILL;

  const monthHeaders = [
    { col: 3, textKz: "қыркүйек", textRu: "сентябрь" },
    { col: 4, textKz: "қазан", textRu: "октябрь" },
    { col: 5, textKz: "қараша", textRu: "ноябрь" },
    { col: 6, textKz: "желтоқсан", textRu: "декабрь" },
    { col: 7, textKz: "қантар", textRu: "январь" },
    { col: 8, textKz: "ақпан", textRu: "февраль" },
    { col: 9, textKz: "наурыз", textRu: "март" },
    { col: 10, textKz: "сәуір", textRu: "апрель" },
    { col: 11, textKz: "мамыр", textRu: "май" },
    { col: 12, textKz: "маусым", textRu: "июнь" },
  ];

  monthHeaders.forEach(({ col, textKz, textRu }) => {
    const cell = sheet.getCell(15, col);
    cell.value = `${textKz}    ${textRu}`;
    cell.font = headerFont;
    cell.alignment = monthHeaderAlignment;
    cell.border = THIN_BORDER;
    cell.fill = GRAY_FILL;
  });

  const m15 = sheet.getCell("M15");
  m15.value = "Итого";
  m15.font = headerFontSmall;
  m15.alignment = monthHeaderAlignment;
  m15.border = THIN_BORDER;
  m15.fill = GRAY_FILL;
}

function generateWorkbookTemplate(): ExcelJS.Workbook {
  const workbook: ExcelJS.Workbook = new Excel.Workbook();

  workbook.creator = "MARS 2.0";
  workbook.created = new Date();
  workbook.modified = new Date();

  createForm1Sheet(workbook);
  createForm2Sheet(workbook);
  createForm3Sheet(workbook);

  return workbook;
}

// ============================================================================
// Form Population Functions
// ============================================================================

/**
 * Populate Form 1 with multiple months of workload data
 * Creates separate sections for each month with its own table
 */
async function populateForm1MultiMonth(
  worksheet: ExcelJS.Worksheet,
  payload: TeacherWorkloadExportPayload
): Promise<void> {
  if (!payload.allMonthsWorkload || payload.allMonthsWorkload.length === 0) {
    throw new Error("allMonthsWorkload is required for multi-month export");
  }

  console.log(`[populateForm1MultiMonth] Processing ${payload.allMonthsWorkload.length} months`);

  // Start after row 7 (teacher name row), no template headers now
  const baseStartRow = 7; // 0-based row index (row 8 in Excel 1-based)
  let currentRow = baseStartRow;

  const COL_OFFSET = 1; // Column B (0-based)
  const DAY_COLUMNS = 31; // Always show 31 day columns for consistency
  const dayStartCol0 = COL_OFFSET + 4; // Column F (0-based)
  const monthTotalCol0 = dayStartCol0 + DAY_COLUMNS; // Column AK (0-based)

  for (const monthData of payload.allMonthsWorkload) {
    console.log(`[populateForm1MultiMonth] Processing month: ${monthData.monthInfo.key} ${monthData.monthInfo.year}, entries: ${monthData.entries.length}`);

    // Always show month section, even if there are no entries (hours finished)
    // if (monthData.entries.length === 0) {
    //   console.log(`[populateForm1MultiMonth] Skipping ${monthData.monthInfo.key} - no entries`);
    //   continue;
    // }

    // Calculate actual days in this specific month
    const daysInMonth = monthData.entries[0]?.dailyHours.length ||
      new Date(monthData.monthInfo.year, monthData.monthInfo.month + 1, 0).getDate() ||
      31;

    // All months: Create full header section (2 rows) for consistency
    const headerRow1 = currentRow; // First header row (0-based)
    const headerRow2 = currentRow + 1; // Second header row with day numbers (0-based)

    const headerFont = { name: TIMES_NEW_ROMAN, size: 10, bold: true, color: THEME_BLACK };
    const headerAlignment = { horizontal: "center" as const, vertical: "distributed" as const };

    // Row 1: Main headers
    // № р/с /№ п/п
    const b_h1 = worksheet.getCell(headerRow1 + 1, COL_OFFSET + 1);
    b_h1.value = "№ р/с /№ п/п";
    b_h1.font = headerFont;
    b_h1.alignment = headerAlignment;
    b_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, COL_OFFSET + 1, headerRow2 + 1, COL_OFFSET + 1);

    // Модуль индексі/Индекс модуля
    const c_h1 = worksheet.getCell(headerRow1 + 1, COL_OFFSET + 2);
    c_h1.value = "Модуль индексі/Индекс модуля";
    c_h1.font = headerFont;
    c_h1.alignment = headerAlignment;
    c_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, COL_OFFSET + 2, headerRow2 + 1, COL_OFFSET + 2);

    // Наименование (long header)
    const d_h1 = worksheet.getCell(headerRow1 + 1, COL_OFFSET + 3);
    d_h1.value = "Пәндердің, оқыту нәтижелерінің және (немесе) модульдің атауы (практика атауы)/Наименование дисциплин, результатов обучения и (или) модуля (наименование практики)";
    d_h1.font = headerFont;
    d_h1.alignment = headerAlignment;
    d_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, COL_OFFSET + 3, headerRow2 + 1, COL_OFFSET + 3);

    // Группа (long header)
    const e_h1 = worksheet.getCell(headerRow1 + 1, COL_OFFSET + 4);
    e_h1.value = "Оқу тобының нөмірі немесе тегі, студенттің аты-жөні, курсы/ № учебной группы или фамилия,  имя студента,  курс";
    e_h1.font = headerFont;
    e_h1.alignment = headerAlignment;
    e_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, COL_OFFSET + 4, headerRow2 + 1, COL_OFFSET + 4);

    // Month name header spanning days
    const f_h1 = worksheet.getCell(headerRow1 + 1, dayStartCol0 + 1);
    f_h1.value = {
      richText: [
        { text: "____________айы/Месяц " },
        {
          text: monthData.monthInfo.name,
          font: {
            bold: true,
            underline: true,
            size: 12,
            color: { indexed: 8 } as any,
            name: TIMES_NEW_ROMAN,
          },
        },
      ],
    };
    f_h1.font = { name: TIMES_NEW_ROMAN, size: 12, color: THEME_BLACK };
    f_h1.alignment = { horizontal: "left", vertical: "distributed" };
    f_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, dayStartCol0 + 1, headerRow1 + 1, monthTotalCol0);

    // Итого часов
    const ak_h1 = worksheet.getCell(headerRow1 + 1, monthTotalCol0 + 1);
    ak_h1.value = "Барлығы сағат/Итого часов";
    ak_h1.font = headerFont;
    ak_h1.alignment = headerAlignment;
    ak_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, monthTotalCol0 + 1, headerRow2 + 1, monthTotalCol0 + 1);

    // Summary column headers (AL-AQ)
    const al_h1 = worksheet.getCell(headerRow1 + 1, monthTotalCol0 + 2);
    al_h1.value = "Оқу тобының нөмірі немесе тегі, студенттің аты-жөні, курсы/ № учебной группы или фамилия,  имя студента,  курс";
    al_h1.font = headerFont;
    al_h1.alignment = headerAlignment;
    al_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, monthTotalCol0 + 2, headerRow2 + 1, monthTotalCol0 + 2);

    const am_h1 = worksheet.getCell(headerRow1 + 1, monthTotalCol0 + 3);
    am_h1.value = "Пәннің және (немесе) модульдердің атауы/Наименование дисциплины и (или) модулей";
    am_h1.font = headerFont;
    am_h1.alignment = headerAlignment;
    am_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, monthTotalCol0 + 3, headerRow2 + 1, monthTotalCol0 + 3);

    const an_h1 = worksheet.getCell(headerRow1 + 1, monthTotalCol0 + 4);
    an_h1.value = "Жоспарланған сағаттар саны/Количество запланированных часов";
    an_h1.font = headerFont;
    an_h1.alignment = headerAlignment;
    an_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, monthTotalCol0 + 4, headerRow2 + 1, monthTotalCol0 + 4);

    const ao_h1 = worksheet.getCell(headerRow1 + 1, monthTotalCol0 + 5);
    ao_h1.value = "Нақты орындалды/Фактически выполнено";
    ao_h1.font = headerFont;
    ao_h1.alignment = headerAlignment;
    ao_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, monthTotalCol0 + 5, headerRow1 + 1, monthTotalCol0 + 6);

    const aq_h1 = worksheet.getCell(headerRow1 + 1, monthTotalCol0 + 7);
    aq_h1.value = "Қалған сағат/Остаток часов";
    aq_h1.font = headerFont;
    aq_h1.alignment = headerAlignment;
    aq_h1.border = THIN_BORDER;
    worksheet.mergeCells(headerRow1 + 1, monthTotalCol0 + 7, headerRow2 + 1, monthTotalCol0 + 7);

    // Row 2: Day numbers
    const dayFont = { name: TIMES_NEW_ROMAN, size: 11, color: THEME_BLACK };
    const dayAlignment = { horizontal: "center" as const };

    // Set row height for day numbers row
    worksheet.getRow(headerRow2 + 1).height = 54;

    // Always render 31 day columns
    for (let day = 1; day <= DAY_COLUMNS; day++) {
      const dayCell = worksheet.getCell(headerRow2 + 1, dayStartCol0 + day);

      if (day <= daysInMonth) {
        // Valid day for this month - show day number with gray fill
        dayCell.value = day;
        dayCell.font = dayFont;
        dayCell.alignment = dayAlignment;
        dayCell.border = THIN_BORDER;
        dayCell.fill = GRAY_FILL;
      } else {
        // Day doesn't exist in this month (e.g., day 31 in a 30-day month)
        dayCell.value = null;
        dayCell.border = THIN_BORDER;
        // No fill for empty days
      }
    }

    // Sub-headers for AO and AP
    const ao_h2 = worksheet.getCell(headerRow2 + 1, monthTotalCol0 + 5);
    ao_h2.value = "бір айдағы сағат жиынтығы/ итого часов в месяц";
    ao_h2.font = dayFont;
    ao_h2.alignment = dayAlignment;
    ao_h2.border = THIN_BORDER;

    const ap_h2 = worksheet.getCell(headerRow2 + 1, monthTotalCol0 + 6);
    ap_h2.value = "оқу жылының басынан бастап/с начала учебного года";
    ap_h2.font = dayFont;
    ap_h2.alignment = dayAlignment;
    ap_h2.border = THIN_BORDER;

    const dataStartRow = headerRow2 + 1;
    currentRow = headerRow2 + 1;

    monthData.entries.forEach((entry, index) => {
      const row0 = dataStartRow + index;
      const row1 = row0 + 1; // 1-based for formulas

      // Debug: log non-null days
      const nonNullDays = entry.dailyHours
        .map((h, i) => ({ day: i + 1, hours: h }))
        .filter(d => d.hours !== null);
      console.log(`[populateForm1MultiMonth] Entry ${index + 1} (${entry.groupName} - ${entry.subjectName}) non-null days:`, nonNullDays);

      // № п/п
      const rowNumCell = getCell(worksheet, row0, COL_OFFSET + 0);
      rowNumCell.value = entry.rowNumber;
      applyTimesCellStyle(rowNumCell, { size: 11, horizontal: "center" });

      // Индекс модуля
      const moduleCell = getCell(worksheet, row0, COL_OFFSET + 1);
      moduleCell.value = entry.moduleIndex;
      applyTimesCellStyle(moduleCell, {
        size: 11,
        horizontal: "center",
        vertical: "middle",
      });

      // Наименование
      const subjectCell = getCell(worksheet, row0, COL_OFFSET + 2);
      subjectCell.value = entry.subjectName;
      applyTimesCellStyle(subjectCell, {
        size: 9,
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
      });

      // Группа
      const groupCell = getCell(worksheet, row0, COL_OFFSET + 3);
      groupCell.value = entry.groupName;
      applyTimesCellStyle(groupCell, { size: 11 });

      // Daily hours (always 31 columns)
      for (let dayIndex = 0; dayIndex < DAY_COLUMNS; dayIndex++) {
        const hours = dayIndex < daysInMonth ? (entry.dailyHours[dayIndex] ?? null) : null;
        const col0 = dayStartCol0 + dayIndex;
        const cell = getCell(worksheet, row0, col0);
        cell.value = hours;
        applyTimesCellStyle(cell, {
          size: 11,
          horizontal: "center",
          vertical: "middle",
        });
      }

      // Month total
      const totalCell = getCell(worksheet, row0, monthTotalCol0);
      const firstDayCol = getColumnLetter(dayStartCol0);
      const lastDayCol = getColumnLetter(dayStartCol0 + daysInMonth - 1);
      totalCell.value = {
        formula: `SUM(${firstDayCol}${row1}:${lastDayCol}${row1})`,
        result: entry.monthTotal,
      };
      applyTimesCellStyle(totalCell, { size: 11, horizontal: "center" });

      // Summary columns (AL-AQ)
      // AL: Group name
      const summaryGroupCell = getCell(worksheet, row0, monthTotalCol0 + 1);
      summaryGroupCell.value = entry.groupName;
      applyTimesCellStyle(summaryGroupCell, { size: 11, horizontal: "center" });

      // AM: Subject name (with module index)
      const summarySubjectCell = getCell(worksheet, row0, monthTotalCol0 + 2);
      const combinedSubjectName = entry.moduleIndex
        ? `${entry.moduleIndex} ${entry.subjectName}`
        : entry.subjectName;
      summarySubjectCell.value = combinedSubjectName;
      applyTimesCellStyle(summarySubjectCell, {
        size: 8,
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
        indent: 1,
      });

      // AN: Planned hours
      const plannedCell = getCell(worksheet, row0, monthTotalCol0 + 3);
      plannedCell.value = entry.plannedHours;
      applyTimesCellStyle(plannedCell, {
        size: 11,
        horizontal: "center",
        vertical: "middle",
      });

      // AO: Actual hours (month)
      const actualMonthCell = getCell(worksheet, row0, monthTotalCol0 + 4);
      actualMonthCell.value = entry.monthTotal;
      applyTimesCellStyle(actualMonthCell, {
        size: 11,
        horizontal: "center",
        vertical: "middle",
      });

      // AP: Actual hours (cumulative from year start)
      const actualCumulativeCell = getCell(worksheet, row0, monthTotalCol0 + 5);
      actualCumulativeCell.value = entry.cumulativeHours;
      applyTimesCellStyle(actualCumulativeCell, {
        size: 11,
        horizontal: "center",
        vertical: "middle",
      });

      // AQ: Remaining hours
      const remainingCell = getCell(worksheet, row0, monthTotalCol0 + 6);
      remainingCell.value = entry.remainingHours;
      applyTimesCellStyle(remainingCell, {
        size: 11,
        horizontal: "center",
        vertical: "middle",
      });
    });

    // Only add "Итого" row and signatures if there are entries
    if (monthData.entries.length > 0) {
      // Add "Итого" (Total) row after all entries
      const totalRow = dataStartRow + monthData.entries.length;
      const totalRow1 = totalRow + 1; // 1-based for formulas

      // B and C columns: Empty cells with borders
      const totalB = getCell(worksheet, totalRow, COL_OFFSET);
      totalB.value = "";
      applyTimesCellStyle(totalB, { size: 11, bold: true });

      const totalC = getCell(worksheet, totalRow, COL_OFFSET + 1);
      totalC.value = "";
      applyTimesCellStyle(totalC, { size: 11, bold: true });

      // D column: "Итого" text
      const totalLabelCell = getCell(worksheet, totalRow, COL_OFFSET + 2);
      totalLabelCell.value = "Итого";
      applyTimesCellStyle(totalLabelCell, {
        size: 11,
        bold: true,
        horizontal: "left",
      });

      // E column: Empty cell with border
      const totalE = getCell(worksheet, totalRow, COL_OFFSET + 3);
      totalE.value = "";
      applyTimesCellStyle(totalE, { size: 11, bold: true });

      // Add SUM formulas for each day column (always 31 columns)
      const firstDataRow = dataStartRow + 1; // 1-based
      const lastDataRow = dataStartRow + monthData.entries.length; // 1-based

      for (let dayIndex = 0; dayIndex < DAY_COLUMNS; dayIndex++) {
        const col0 = dayStartCol0 + dayIndex;
        const cell = getCell(worksheet, totalRow, col0);

        if (dayIndex < daysInMonth) {
          // Valid day - add SUM formula
          const colLetter = getColumnLetter(col0);
          cell.value = {
            formula: `SUM(${colLetter}${firstDataRow}:${colLetter}${lastDataRow})`,
            result: 0,
          };
          applyTimesCellStyle(cell, {
            size: 11,
            bold: true,
            horizontal: "center",
          });
        } else {
          // Day doesn't exist in this month - empty cell with border
          cell.value = null;
          applyTimesCellStyle(cell, {
            size: 11,
            bold: true,
            horizontal: "center",
          });
        }
      }

      // Month total column with SUM of day totals in this row
      const monthTotalCell = getCell(worksheet, totalRow, monthTotalCol0);
      const firstDayCol = getColumnLetter(dayStartCol0);
      const lastDayCol = getColumnLetter(dayStartCol0 + daysInMonth - 1);
      monthTotalCell.value = {
        formula: `SUM(${firstDayCol}${totalRow1}:${lastDayCol}${totalRow1})`,
        result: monthData.totalHours || 0,
      };
      applyTimesCellStyle(monthTotalCell, {
        size: 11,
        bold: true,
        horizontal: "center",
      });

      // Add empty cells with borders for AL and AM columns
      // AL: Empty cell (group name column in total row)
      const totalAL = getCell(worksheet, totalRow, monthTotalCol0 + 1);
      totalAL.value = "";
      applyTimesCellStyle(totalAL, { size: 11, bold: true });

      // AM: Empty cell (subject name column in total row)
      const totalAM = getCell(worksheet, totalRow, monthTotalCol0 + 2);
      totalAM.value = "";
      applyTimesCellStyle(totalAM, { size: 11, bold: true });

      // Add summary total formulas in columns AN, AO, AP, AQ
      // AN: SUM of planned hours
      const plannedTotalCell = getCell(worksheet, totalRow, monthTotalCol0 + 3);
      const anCol = getColumnLetter(monthTotalCol0 + 3);
      plannedTotalCell.value = {
        formula: `SUM(${anCol}${firstDataRow}:${anCol}${lastDataRow})`,
        result: 0,
      };
      applyTimesCellStyle(plannedTotalCell, {
        size: 11,
        bold: true,
        horizontal: "center",
      });

      // AO: SUM of actual hours (month)
      const actualMonthTotalCell = getCell(worksheet, totalRow, monthTotalCol0 + 4);
      const aoCol = getColumnLetter(monthTotalCol0 + 4);
      actualMonthTotalCell.value = {
        formula: `SUM(${aoCol}${firstDataRow}:${aoCol}${lastDataRow})`,
        result: 0,
      };
      applyTimesCellStyle(actualMonthTotalCell, {
        size: 11,
        bold: true,
        horizontal: "center",
      });

      // AP: SUM of actual hours (cumulative)
      const actualCumulativeTotalCell = getCell(worksheet, totalRow, monthTotalCol0 + 5);
      const apCol = getColumnLetter(monthTotalCol0 + 5);
      actualCumulativeTotalCell.value = {
        formula: `SUM(${apCol}${firstDataRow}:${apCol}${lastDataRow})`,
        result: 0,
      };
      applyTimesCellStyle(actualCumulativeTotalCell, {
        size: 11,
        bold: true,
        horizontal: "center",
      });

      // AQ: SUM of remaining hours
      const remainingTotalCell = getCell(worksheet, totalRow, monthTotalCol0 + 6);
      const aqCol = getColumnLetter(monthTotalCol0 + 6);
      remainingTotalCell.value = {
        formula: `SUM(${aqCol}${firstDataRow}:${aqCol}${lastDataRow})`,
        result: 0,
      };
      applyTimesCellStyle(remainingTotalCell, {
        size: 11,
        bold: true,
        horizontal: "center",
      });

      // Add spacing rows after total
      currentRow = totalRow + 1;

      // Add "Барлығы бір айда нақты орындалды/Всего фактически выполнено за месяц" text
      const summaryTextRow = currentRow + 2;
      const summaryTextCell = getCell(worksheet, summaryTextRow, COL_OFFSET);
      const totalHoursValue = monthData.totalHours || 0;
      summaryTextCell.value = `Барлығы бір айда нақты орындалды/Всего фактически выполнено за месяц                ${totalHoursValue}                    сағат/ часов`;
      summaryTextCell.font = {
        name: TIMES_NEW_ROMAN,
        size: 12,
        bold: true,
        underline: true,
        color: THEME_BLACK,
      };
      summaryTextCell.alignment = { horizontal: "left" };

      // Add signature rows
      const signatureRow1 = summaryTextRow + 2;
      const signature1Cell = getCell(worksheet, signatureRow1, COL_OFFSET);
      signature1Cell.value = "Педагог  _________________ (қолы/подпись)";
      signature1Cell.font = {
        name: TIMES_NEW_ROMAN,
        size: 12,
        bold: true,
        color: THEME_BLACK,
      };
      signature1Cell.alignment = { horizontal: "left" };

      const signatureRow2 = signatureRow1 + 2;
      const signature2Cell = getCell(worksheet, signatureRow2, COL_OFFSET);
      signature2Cell.value =
        "Басшының оқу жұмысы жөніндегі орынбасары/Заместитель руководителя по УР ______________________ (қолы/подпись)";
      signature2Cell.font = {
        name: TIMES_NEW_ROMAN,
        size: 12,
        bold: true,
        color: THEME_BLACK,
      };
      signature2Cell.alignment = { horizontal: "left" };

      // Move to next section (leave some space)
      currentRow = signatureRow2 + 2;
    } else {
      // No entries for this month - just add spacing and move to next month
      currentRow = dataStartRow + 2;
    }
  }

  console.log(`[populateForm1MultiMonth] Finished processing all months`);
}

async function populateForm1(
  worksheet: ExcelJS.Worksheet,
  payload: TeacherWorkloadExportPayload
): Promise<void> {
  // ALWAYS use multi-month export logic
  if (!payload.allMonthsWorkload || payload.allMonthsWorkload.length === 0) {
    throw new Error("allMonthsWorkload is required - multi-month export is mandatory");
  }

  await populateForm1MultiMonth(worksheet, payload);
}

async function populateForm2(
  worksheet: ExcelJS.Worksheet,
  payload: TeacherWorkloadExportPayload
): Promise<void> {
  let form2HeaderRow = 6;

  for (let r = 1; r <= 10; r++) {
    const rowObj = worksheet.getRow(r);
    let foundOne = false;
    let foundTwo = false;

    rowObj.eachCell((cell) => {
      const val = cell.value;
      if (val === 1 || val === "1") foundOne = true;
      if (val === 2 || val === "2") foundTwo = true;
    });

    if (foundOne && foundTwo) {
      form2HeaderRow = r;
      break;
    }
  }

  const headerRow0 = form2HeaderRow - 1;
  const dataStartRow0 = headerRow0 + 1;

  const COL_OFFSET = 1;

  payload.summaryEntries.forEach((entry, index) => {
    const row0 = dataStartRow0 + index;
    const row1 = row0 + 1;

    // Set row height to match template
    worksheet.getRow(row1).height = 17.25;

    const combinedSubjectName = entry.moduleIndex
      ? `${entry.moduleIndex} ${entry.subjectName}`
      : entry.subjectName;

    const groupCell = getCell(worksheet, row0, COL_OFFSET + 0);
    groupCell.value = entry.groupName;
    applyTimesCellStyle(groupCell, { size: 11 });
    // Column B should NOT have white background fill
    groupCell.fill = { type: 'pattern', pattern: 'none' };

    const subjectCell = getCell(worksheet, row0, COL_OFFSET + 1);
    subjectCell.value = combinedSubjectName;
    applyTimesCellStyle(subjectCell, {
      size: 8,
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
      indent: 1,
    });

    const plannedCell = getCell(worksheet, row0, COL_OFFSET + 2);
    plannedCell.value = entry.plannedHours;
    applyTimesCellStyle(plannedCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    const actualCell = getCell(worksheet, row0, COL_OFFSET + 3);
    actualCell.value = entry.actualHours;
    applyTimesCellStyle(actualCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    const facPlanCell = getCell(worksheet, row0, COL_OFFSET + 4);
    facPlanCell.value = entry.facultativePlanned || null;
    applyTimesCellStyle(facPlanCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    const facActualCell = getCell(worksheet, row0, COL_OFFSET + 5);
    facActualCell.value = entry.facultativeActual || null;
    applyTimesCellStyle(facActualCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    const consPlanCell = getCell(worksheet, row0, COL_OFFSET + 6);
    consPlanCell.value = entry.consultationsPlanned || null;
    applyTimesCellStyle(consPlanCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    const consActualCell = getCell(worksheet, row0, COL_OFFSET + 7);
    consActualCell.value = entry.consultationsActual || null;
    applyTimesCellStyle(consActualCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    const examsPlanCell = getCell(worksheet, row0, COL_OFFSET + 8);
    examsPlanCell.value = entry.examsPlanned || null;
    applyTimesCellStyle(examsPlanCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    const examsActualCell = getCell(worksheet, row0, COL_OFFSET + 9);
    examsActualCell.value = entry.examsActual || null;
    applyTimesCellStyle(examsActualCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    const totalCell = getCell(worksheet, row0, COL_OFFSET + 10);
    totalCell.value = {
      formula: `SUM(E${row1}+G${row1}+I${row1}+K${row1})`,
      result: entry.totalHours,
    };
    applyTimesCellStyle(totalCell, {
      size: 11,
      horizontal: "center",
      vertical: "middle",
    });

    // Apply white background fill to data cells (columns C-L only, skip B)
    for (let colOffset = 1; colOffset <= 10; colOffset++) {
      const cell = getCell(worksheet, row0, COL_OFFSET + colOffset);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' },
        bgColor: { argb: 'FFFFFFCC' } // Match template bgColor
      };
    }
  });

  // Add "Итого" (Subtotal) row after main entries
  const totalRow0 = dataStartRow0 + payload.summaryEntries.length;
  const totalRow1 = totalRow0 + 1; // 1-based for formulas

  const firstDataRow1 = dataStartRow0 + 1; // 1-based
  const lastDataRow1 = dataStartRow0 + payload.summaryEntries.length; // 1-based

  // Calculate totals
  const totalPlanned = payload.summaryEntries.reduce((sum, e) => sum + (e.plannedHours || 0), 0);
  const totalActual = payload.summaryEntries.reduce((sum, e) => sum + (e.actualHours || 0), 0);
  const totalFacPlanned = payload.summaryEntries.reduce((sum, e) => sum + (e.facultativePlanned || 0), 0);
  const totalFacActual = payload.summaryEntries.reduce((sum, e) => sum + (e.facultativeActual || 0), 0);
  const totalConsPlanned = payload.summaryEntries.reduce((sum, e) => sum + (e.consultationsPlanned || 0), 0);
  const totalConsActual = payload.summaryEntries.reduce((sum, e) => sum + (e.consultationsActual || 0), 0);
  const totalExamsPlanned = payload.summaryEntries.reduce((sum, e) => sum + (e.examsPlanned || 0), 0);
  const totalExamsActual = payload.summaryEntries.reduce((sum, e) => sum + (e.examsActual || 0), 0);
  const grandTotal = payload.summaryEntries.reduce((sum, e) => sum + (e.totalHours || 0), 0);

  // B: "Итого"
  const totalLabelCell = getCell(worksheet, totalRow0, COL_OFFSET);
  totalLabelCell.value = "Итого";
  applyTimesCellStyle(totalLabelCell, { size: 11, bold: true, horizontal: "left" });

  // C: Empty
  const totalSubjectCell = getCell(worksheet, totalRow0, COL_OFFSET + 1);
  totalSubjectCell.value = null;
  applyTimesCellStyle(totalSubjectCell, { size: 11, bold: true });

  // D: Planned hours total
  const totalPlannedCell = getCell(worksheet, totalRow0, COL_OFFSET + 2);
  totalPlannedCell.value = totalPlanned || null;
  applyTimesCellStyle(totalPlannedCell, { size: 11, bold: true, horizontal: "center" });

  // E: Actual hours total
  const totalActualCell = getCell(worksheet, totalRow0, COL_OFFSET + 3);
  totalActualCell.value = totalActual || null;
  applyTimesCellStyle(totalActualCell, { size: 11, bold: true, horizontal: "center" });

  // F: Facultative planned total
  const totalFacPlanCell = getCell(worksheet, totalRow0, COL_OFFSET + 4);
  totalFacPlanCell.value = totalFacPlanned || null;
  applyTimesCellStyle(totalFacPlanCell, { size: 11, bold: true, horizontal: "center" });

  // G: Facultative actual total
  const totalFacActualCell = getCell(worksheet, totalRow0, COL_OFFSET + 5);
  totalFacActualCell.value = totalFacActual || null;
  applyTimesCellStyle(totalFacActualCell, { size: 11, bold: true, horizontal: "center" });

  // H: Consultations planned total
  const totalConsPlanCell = getCell(worksheet, totalRow0, COL_OFFSET + 6);
  totalConsPlanCell.value = totalConsPlanned || null;
  applyTimesCellStyle(totalConsPlanCell, { size: 11, bold: true, horizontal: "center" });

  // I: Consultations actual total
  const totalConsActualCell = getCell(worksheet, totalRow0, COL_OFFSET + 7);
  totalConsActualCell.value = totalConsActual || null;
  applyTimesCellStyle(totalConsActualCell, { size: 11, bold: true, horizontal: "center" });

  // J: Exams planned total
  const totalExamsPlanCell = getCell(worksheet, totalRow0, COL_OFFSET + 8);
  totalExamsPlanCell.value = totalExamsPlanned || null;
  applyTimesCellStyle(totalExamsPlanCell, { size: 11, bold: true, horizontal: "center" });

  // K: Exams actual total
  const totalExamsActualCell = getCell(worksheet, totalRow0, COL_OFFSET + 9);
  totalExamsActualCell.value = totalExamsActual || null;
  applyTimesCellStyle(totalExamsActualCell, { size: 11, bold: true, horizontal: "center" });

  // L: Grand total
  const totalGrandCell = getCell(worksheet, totalRow0, COL_OFFSET + 10);
  totalGrandCell.value = grandTotal || null;
  applyTimesCellStyle(totalGrandCell, { size: 11, bold: true, horizontal: "center" });

  // Apply orange/peach background fill to all total row cells (columns B-L) to match template
  for (let colOffset = 0; colOffset <= 10; colOffset++) {
    const cell = getCell(worksheet, totalRow0, COL_OFFSET + colOffset);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCC99' },
      bgColor: { argb: 'FFC0C0C0' }
    };
  }

  // ==========================================================================
  // Замена (Replacement) section - empty rows with just structure
  // ==========================================================================

  const zamenaStartRow0 = totalRow0 + 1; // Row after first Итого

  // "Замена" label row
  const zamenaLabelCell = getCell(worksheet, zamenaStartRow0, COL_OFFSET);
  zamenaLabelCell.value = "Замена";
  applyTimesCellStyle(zamenaLabelCell, { size: 11, bold: true, horizontal: "left" });
  zamenaLabelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' },
    bgColor: { argb: 'FFFFFFFF' }
  };

  // Add empty cells with borders for the Замена label row (columns C-L)
  for (let colOffset = 1; colOffset <= 10; colOffset++) {
    const cell = getCell(worksheet, zamenaStartRow0, COL_OFFSET + colOffset);
    cell.value = null;
    applyTimesCellStyle(cell, { size: 11 });
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' },
      bgColor: { argb: 'FFFFFFFF' }
    };
  }

  // "Итого" row for Замена section (empty values, just structure)
  const zamenaItogoRow0 = zamenaStartRow0 + 1;
  const zamenaItogoRow1 = zamenaItogoRow0 + 1; // 1-based for formulas

  // B: "Итого"
  const zamenaItogoLabel = getCell(worksheet, zamenaItogoRow0, COL_OFFSET);
  zamenaItogoLabel.value = "Итого";
  applyTimesCellStyle(zamenaItogoLabel, { size: 11, bold: true, horizontal: "left" });

  // C: Empty
  const zamenaItogoSubject = getCell(worksheet, zamenaItogoRow0, COL_OFFSET + 1);
  zamenaItogoSubject.value = null;
  applyTimesCellStyle(zamenaItogoSubject, { size: 11, bold: true });

  // D: Empty (planned hours for Замена)
  const zamenaItogoPlanned = getCell(worksheet, zamenaItogoRow0, COL_OFFSET + 2);
  zamenaItogoPlanned.value = null;
  applyTimesCellStyle(zamenaItogoPlanned, { size: 11, bold: true, horizontal: "center" });

  // E: Empty (actual hours for Замена)
  const zamenaItogoActual = getCell(worksheet, zamenaItogoRow0, COL_OFFSET + 3);
  zamenaItogoActual.value = null;
  applyTimesCellStyle(zamenaItogoActual, { size: 11, bold: true, horizontal: "center" });

  // F-K: Empty cells for facultative, consultations, exams
  for (let colOffset = 4; colOffset <= 9; colOffset++) {
    const cell = getCell(worksheet, zamenaItogoRow0, COL_OFFSET + colOffset);
    cell.value = null;
    applyTimesCellStyle(cell, { size: 11, bold: true, horizontal: "center" });
  }

  // L: Grand total for Замена (empty)
  const zamenaItogoGrand = getCell(worksheet, zamenaItogoRow0, COL_OFFSET + 10);
  zamenaItogoGrand.value = null;
  applyTimesCellStyle(zamenaItogoGrand, { size: 11, bold: true, horizontal: "center" });

  // Apply orange/peach background fill to all Замена Итого row cells (columns B-L)
  for (let colOffset = 0; colOffset <= 10; colOffset++) {
    const cell = getCell(worksheet, zamenaItogoRow0, COL_OFFSET + colOffset);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCC99' },
      bgColor: { argb: 'FFC0C0C0' }
    };
  }

  // ==========================================================================
  // "Всего" (Grand Total) row - combines main Итого + Замена Итого
  // ==========================================================================

  const vsegoRow0 = zamenaItogoRow0 + 1;
  const vsegoRow1 = vsegoRow0 + 1; // 1-based for formulas

  const totalRowRef = totalRow1; // Reference to first Итого row (1-based)
  const zamenaRowRef = zamenaItogoRow1; // Reference to Замена Итого row (1-based)

  // B: "Всего"
  const vsegoLabel = getCell(worksheet, vsegoRow0, COL_OFFSET);
  vsegoLabel.value = "Всего";
  applyTimesCellStyle(vsegoLabel, { size: 11, bold: true, horizontal: "left" });

  // C: Empty
  const vsegoSubject = getCell(worksheet, vsegoRow0, COL_OFFSET + 1);
  vsegoSubject.value = null;
  applyTimesCellStyle(vsegoSubject, { size: 11, bold: true });

  // D: SUM of planned hours from both Итого rows
  const vsegoPlanned = getCell(worksheet, vsegoRow0, COL_OFFSET + 2);
  vsegoPlanned.value = {
    formula: `SUM(D${totalRowRef}:D${zamenaRowRef})`,
    result: totalPlanned,
  };
  applyTimesCellStyle(vsegoPlanned, { size: 11, bold: true, horizontal: "center" });

  // E: SUM of actual hours from both Итого rows
  const vsegoActual = getCell(worksheet, vsegoRow0, COL_OFFSET + 3);
  vsegoActual.value = {
    formula: `SUM(E${totalRowRef}:E${zamenaRowRef})`,
    result: totalActual,
  };
  applyTimesCellStyle(vsegoActual, { size: 11, bold: true, horizontal: "center" });

  // F: Facultative planned
  const vsegoFacPlanned = getCell(worksheet, vsegoRow0, COL_OFFSET + 4);
  vsegoFacPlanned.value = {
    formula: `SUM(F${totalRowRef}:F${zamenaRowRef})`,
    result: totalFacPlanned,
  };
  applyTimesCellStyle(vsegoFacPlanned, { size: 11, bold: true, horizontal: "center" });

  // G: Facultative actual
  const vsegoFacActual = getCell(worksheet, vsegoRow0, COL_OFFSET + 5);
  vsegoFacActual.value = {
    formula: `SUM(G${totalRowRef}:G${zamenaRowRef})`,
    result: totalFacActual,
  };
  applyTimesCellStyle(vsegoFacActual, { size: 11, bold: true, horizontal: "center" });

  // H: Consultations planned
  const vsegoConsPlanned = getCell(worksheet, vsegoRow0, COL_OFFSET + 6);
  vsegoConsPlanned.value = {
    formula: `SUM(H${totalRowRef}:H${zamenaRowRef})`,
    result: totalConsPlanned,
  };
  applyTimesCellStyle(vsegoConsPlanned, { size: 11, bold: true, horizontal: "center" });

  // I: Consultations actual
  const vsegoConsActual = getCell(worksheet, vsegoRow0, COL_OFFSET + 7);
  vsegoConsActual.value = {
    formula: `SUM(I${totalRowRef}:I${zamenaRowRef})`,
    result: totalConsActual,
  };
  applyTimesCellStyle(vsegoConsActual, { size: 11, bold: true, horizontal: "center" });

  // J: Exams planned
  const vsegoExamsPlanned = getCell(worksheet, vsegoRow0, COL_OFFSET + 8);
  vsegoExamsPlanned.value = {
    formula: `SUM(J${totalRowRef}:J${zamenaRowRef})`,
    result: totalExamsPlanned,
  };
  applyTimesCellStyle(vsegoExamsPlanned, { size: 11, bold: true, horizontal: "center" });

  // K: Exams actual
  const vsegoExamsActual = getCell(worksheet, vsegoRow0, COL_OFFSET + 9);
  vsegoExamsActual.value = {
    formula: `SUM(K${totalRowRef}:K${zamenaRowRef})`,
    result: totalExamsActual,
  };
  applyTimesCellStyle(vsegoExamsActual, { size: 11, bold: true, horizontal: "center" });

  // L: Grand total
  const vsegoGrandTotal = getCell(worksheet, vsegoRow0, COL_OFFSET + 10);
  vsegoGrandTotal.value = {
    formula: `SUM(L${totalRowRef}:L${zamenaRowRef})`,
    result: grandTotal,
  };
  applyTimesCellStyle(vsegoGrandTotal, { size: 11, bold: true, horizontal: "center" });

  // Apply orange/peach background fill to all Всего row cells (columns B-L)
  for (let colOffset = 0; colOffset <= 10; colOffset++) {
    const cell = getCell(worksheet, vsegoRow0, COL_OFFSET + colOffset);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCC99' },
      bgColor: { argb: 'FFC0C0C0' }
    };
  }

  // Add dynamic signature section after data and totals
  // Calculate signature row positions based on actual data
  const signatureStartRow0 = vsegoRow0 + 3; // Leave 2 empty rows after Всего

  // Row 1 of signature - Teacher name (dynamic row number)
  const sig1Row0 = signatureStartRow0;
  const sig1Row1 = sig1Row0 + 1; // 1-based
  worksheet.getRow(sig1Row1).height = 46.5;
  worksheet.mergeCells(sig1Row1, COL_OFFSET + 1, sig1Row1, COL_OFFSET + 2); // B:C (1-based: 2:3)
  worksheet.mergeCells(sig1Row1, COL_OFFSET + 4, sig1Row1, COL_OFFSET + 9); // E:J (1-based: 5:10)

  const sigLabelCell = getCell(worksheet, sig1Row0, COL_OFFSET);
  sigLabelCell.value = "Педагогтің тегі, аты, әкесінің аты (бар болған жағдайда) (толық)\n\nФамилия, имя, отчество (при его наличии) педагога (полностью)";
  sigLabelCell.font = { name: TIMES_NEW_ROMAN, size: 11, color: THEME_BLACK };
  sigLabelCell.alignment = { horizontal: "left", vertical: "top", wrapText: true };

  const sigNameCell = getCell(worksheet, sig1Row0, COL_OFFSET + 3);
  sigNameCell.value = payload.teacherFullName; // Dynamic teacher name
  sigNameCell.font = { name: TIMES_NEW_ROMAN, size: 11, color: THEME_BLACK };
  sigNameCell.alignment = { horizontal: "center", vertical: "middle" };

  // Row 2 of signature - Signature line
  const sig2Row0 = sig1Row0 + 1;
  const sig2Row1 = sig2Row0 + 1; // 1-based
  worksheet.getRow(sig2Row1).height = 24.75;
  worksheet.mergeCells(sig2Row1, COL_OFFSET + 1, sig2Row1, COL_OFFSET + 11); // B:L (1-based: 2:12)

  const sigLineCell = getCell(worksheet, sig2Row0, COL_OFFSET);
  sigLineCell.value = "_______________________________________________________________ (қолы/подпись)";
  sigLineCell.font = { name: TIMES_NEW_ROMAN, size: 11, color: THEME_BLACK };
  sigLineCell.alignment = { horizontal: "left", vertical: "middle" };

  // Row 3 of signature - Verification line (skip row 3, use row 4)
  const sig4Row0 = sig2Row0 + 2;
  const sig4Row1 = sig4Row0 + 1; // 1-based
  worksheet.mergeCells(sig4Row1, COL_OFFSET + 1, sig4Row1, COL_OFFSET + 11); // B:L (1-based: 2:12)

  const verificationCell = getCell(worksheet, sig4Row0, COL_OFFSET);
  verificationCell.value = "Тексерілді/Проверено ___________________________________________________";
  verificationCell.font = { name: TIMES_NEW_ROMAN, size: 11, color: THEME_BLACK };
  verificationCell.alignment = { horizontal: "left", vertical: "middle" };

  // Row 4 of signature - Deputy director line (skip row 5, use row 6)
  const sig6Row0 = sig4Row0 + 2;
  const sig6Row1 = sig6Row0 + 1; // 1-based
  worksheet.mergeCells(sig6Row1, COL_OFFSET + 1, sig6Row1, COL_OFFSET + 11); // B:L (1-based: 2:12)

  const deputyCell = getCell(worksheet, sig6Row0, COL_OFFSET);
  deputyCell.value = "Басшының оқу жұмысы жөніндегі орынбасары/Заместитель руководителя по учебной работе _____________________";
  deputyCell.font = { name: TIMES_NEW_ROMAN, size: 11, color: THEME_BLACK };
  deputyCell.alignment = { horizontal: "left", vertical: "middle" };
}

async function populateForm3(
  worksheet: ExcelJS.Worksheet,
  payload: TeacherWorkloadExportPayload
): Promise<void> {
  const form3HeaderRow = detectDataStartRow(
    worksheet,
    ["қыркүйек", "сентябрь", "Итого", "Топтар"],
    30
  );
  const headerRow0 = form3HeaderRow - 1;
  const dataStartRow0 = headerRow0 + 1;

  // Column indices (0-based): B=1, C=2, ..., L=11, M=12
  const COL_B = 1;  // Group name
  const COL_C = 2;  // September
  const COL_L = 11; // June
  const COL_M = 12; // Итого (Total)
  const COL_H = 7;  // Summary values column
  const COL_I = 8;  // Summary notes column

  // Yellow fill for highlighted cells (matching template)
  const HIGHLIGHT_FILL = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFFFFF00" },
  };

  // Populate main workload entries (rows 16-45 in template)
  payload.monthlyDistribution.forEach((entry, index) => {
    const row0 = dataStartRow0 + index;
    const row1 = row0 + 1; // 1-based
    worksheet.getRow(row1).height = 15.6;

    // Column B: Group name
    const groupCell = getCell(worksheet, row0, COL_B);
    groupCell.value = entry.groupName;
    applyTimesCellStyle(groupCell, { size: 11, horizontal: "center" });

    // Columns C-L: Monthly values (10 months)
    const monthValues = [
      entry.september, entry.october, entry.november, entry.december,
      entry.january, entry.february, entry.march, entry.april,
      entry.may, entry.june,
    ];

    monthValues.forEach((value, idx) => {
      const cell = getCell(worksheet, row0, COL_C + idx);
      cell.value = value;
      applyTimesCellStyle(cell, { size: 12, horizontal: "center" });
    });

    // Column M: Total with SUM formula + yellow fill
    const totalCell = getCell(worksheet, row0, COL_M);
    totalCell.value = {
      formula: `SUM(C${row1}:L${row1})`,
      result: entry.total,
    };
    applyTimesCellStyle(totalCell, { size: 11, horizontal: "center" });
    totalCell.fill = HIGHLIGHT_FILL;
  });

  // Calculate row positions
  const firstDataRow1 = dataStartRow0 + 1; // 1-based
  const lastDataRow1 = dataStartRow0 + payload.monthlyDistribution.length; // 1-based

  // "Всего" (Total) row - Row 46 in template
  const vsegoRow0 = dataStartRow0 + payload.monthlyDistribution.length;
  const vsegoRow1 = vsegoRow0 + 1;
  worksheet.getRow(vsegoRow1).height = 15.6;

  // Column B: "Всего" label with fill
  const vsegoLabelCell = getCell(worksheet, vsegoRow0, COL_B);
  vsegoLabelCell.value = "Всего";
  applyTimesCellStyle(vsegoLabelCell, { size: 12, bold: true, horizontal: "left" });
  vsegoLabelCell.fill = HIGHLIGHT_FILL;

  // Columns C-L: SUM formulas with fill
  for (let col = COL_C; col <= COL_L; col++) {
    const colLetter = getColumnLetter(col);
    const cell = getCell(worksheet, vsegoRow0, col);
    cell.value = {
      formula: `SUM(${colLetter}${firstDataRow1}:${colLetter}${lastDataRow1})`,
      result: 0,
    };
    applyTimesCellStyle(cell, { size: 12, bold: true, horizontal: "center" });
    cell.fill = HIGHLIGHT_FILL;
  }

  // Column M: Total with fill
  const vsegoTotalCell = getCell(worksheet, vsegoRow0, COL_M);
  vsegoTotalCell.value = {
    formula: `SUM(M${firstDataRow1}:M${lastDataRow1})`,
    result: 0,
  };
  applyTimesCellStyle(vsegoTotalCell, { size: 12, bold: true, horizontal: "center" });
  vsegoTotalCell.fill = HIGHLIGHT_FILL;

  // "Замена:" (Replacement) section - Row 47 in template
  const zamenaLabelRow0 = vsegoRow0 + 1;
  const zamenaLabelRow1 = zamenaLabelRow0 + 1;
  worksheet.getRow(zamenaLabelRow1).height = 15.6;

  const zamenaLabelCell = getCell(worksheet, zamenaLabelRow0, COL_B);
  zamenaLabelCell.value = "Замена:";
  applyTimesCellStyle(zamenaLabelCell, { size: 12, bold: true, horizontal: "left" });
  zamenaLabelCell.fill = HIGHLIGHT_FILL;

  // Empty cells for months (C-M) with borders
  for (let col = COL_C; col <= COL_M; col++) {
    const cell = getCell(worksheet, zamenaLabelRow0, col);
    cell.value = null;
    applyTimesCellStyle(cell, { size: 12, bold: true, horizontal: "center" });
  }

  // Замена entries - only 1 empty row for manual entry
  const zamenaFirstRow0 = zamenaLabelRow0 + 1;
  const zamenaFirstRow1 = zamenaFirstRow0 + 1;
  const ZAMENA_EMPTY_ROWS = 1; // Single empty row for replacement entries

  for (let rowOffset = 0; rowOffset < ZAMENA_EMPTY_ROWS; rowOffset++) {
    const row0 = zamenaFirstRow0 + rowOffset;
    const row1 = row0 + 1;
    worksheet.getRow(row1).height = 15.6;

    // Column B: Group name with yellow fill
    const groupCell = getCell(worksheet, row0, COL_B);
    groupCell.value = null;
    applyTimesCellStyle(groupCell, { size: 11, horizontal: "center" });
    groupCell.fill = HIGHLIGHT_FILL;

    // Columns C-L: Month values
    for (let col = COL_C; col <= COL_L; col++) {
      const cell = getCell(worksheet, row0, col);
      cell.value = null;
      applyTimesCellStyle(cell, { size: 11, horizontal: "center" });
    }

    // Column M: Total with SUM formula
    const totalCell = getCell(worksheet, row0, COL_M);
    totalCell.value = {
      formula: `SUM(C${row1}:L${row1})`,
      result: 0,
    };
    applyTimesCellStyle(totalCell, { size: 11, horizontal: "center" });
  }

  // "Всего" row for Замена section
  const zamenaVsegoRow0 = zamenaFirstRow0 + ZAMENA_EMPTY_ROWS;
  const zamenaVsegoRow1 = zamenaVsegoRow0 + 1;
  const zamenaLastRow1 = zamenaFirstRow1 + ZAMENA_EMPTY_ROWS - 1;

  const zamenaVsegoCell = getCell(worksheet, zamenaVsegoRow0, COL_B);
  zamenaVsegoCell.value = "Всего";
  applyTimesCellStyle(zamenaVsegoCell, { size: 12, bold: true, horizontal: "left" });
  zamenaVsegoCell.fill = HIGHLIGHT_FILL;

  // Columns C-L: SUM formulas with fill
  for (let col = COL_C; col <= COL_L; col++) {
    const colLetter = getColumnLetter(col);
    const cell = getCell(worksheet, zamenaVsegoRow0, col);
    cell.value = {
      formula: `SUM(${colLetter}${zamenaFirstRow1}:${colLetter}${zamenaLastRow1})`,
      result: 0,
    };
    applyTimesCellStyle(cell, { size: 12, bold: true, horizontal: "center" });
    cell.fill = HIGHLIGHT_FILL;
  }

  // Column M: Total for Замена
  const zamenaVsegoTotalCell = getCell(worksheet, zamenaVsegoRow0, COL_M);
  zamenaVsegoTotalCell.value = {
    formula: `SUM(M${zamenaFirstRow1}:M${zamenaLastRow1})`,
    result: 0,
  };
  applyTimesCellStyle(zamenaVsegoTotalCell, { size: 12, bold: true, horizontal: "center" });
  zamenaVsegoTotalCell.fill = HIGHLIGHT_FILL;

  // "Емтихандар/Экзамены" row - Row 62 in template
  const examsRow0 = zamenaVsegoRow0 + 1;
  const examsRow1 = examsRow0 + 1;
  worksheet.getRow(examsRow1).height = 70.8;

  const examsCell = getCell(worksheet, examsRow0, COL_B);
  examsCell.value = "Емтихандар/Экзамены (емтихан ведомосының негізінде енгізіледі/заносятся на основании экзаменационной ведомости)";
  applyTimesCellStyle(examsCell, { size: 12, horizontal: "left", wrapText: true });

  // Columns C-L: Empty
  for (let col = COL_C; col <= COL_L; col++) {
    const cell = getCell(worksheet, examsRow0, col);
    cell.value = null;
    applyTimesCellStyle(cell, { size: 12, horizontal: "center" });
  }

  // Column M: Total (bold)
  const examsTotalCell = getCell(worksheet, examsRow0, COL_M);
  examsTotalCell.value = null;
  applyTimesCellStyle(examsTotalCell, { size: 11, bold: true, horizontal: "center" });

  // "Консультациялар/Консультации" row - Row 63 in template
  const consultationsRow0 = examsRow0 + 1;
  const consultationsCell = getCell(worksheet, consultationsRow0, COL_B);
  consultationsCell.value = "Консультациялар/Консультации";
  applyTimesCellStyle(consultationsCell, { size: 12, horizontal: "left" });

  // Columns C-L: Empty
  for (let col = COL_C; col <= COL_L; col++) {
    const cell = getCell(worksheet, consultationsRow0, col);
    cell.value = null;
    applyTimesCellStyle(cell, { size: 12, horizontal: "center" });
  }

  // Column M: Total (bold)
  const consultationsTotalCell = getCell(worksheet, consultationsRow0, COL_M);
  consultationsTotalCell.value = null;
  applyTimesCellStyle(consultationsTotalCell, { size: 11, bold: true, horizontal: "center" });

  // Row 64: "Барлығы жоспарланған, сағат Всего запланировано, часов"
  const plannedRow0 = consultationsRow0 + 1;
  const plannedRow1 = plannedRow0 + 1;

  const plannedCell = getCell(worksheet, plannedRow0, COL_B);
  plannedCell.value = "Барлығы жоспарланған, сағат Всего запланировано, часов";
  applyTimesCellStyle(plannedCell, { size: 12, horizontal: "left" });

  // Columns C-F: Reference main Всего row
  for (let col = COL_C; col <= 6; col++) {
    const colLetter = getColumnLetter(col);
    const cell = getCell(worksheet, plannedRow0, col);
    cell.value = {
      formula: `SUM(${colLetter}${vsegoRow1})`,
      result: 0,
    };
    applyTimesCellStyle(cell, { size: 12, horizontal: "center" });
  }

  // Columns G-L: Manual entry
  for (let col = 7; col <= COL_L; col++) {
    const cell = getCell(worksheet, plannedRow0, col);
    cell.value = null;
    applyTimesCellStyle(cell, { size: 12, horizontal: "center" });
  }

  // Column M: SUM of row
  const plannedTotalCell = getCell(worksheet, plannedRow0, COL_M);
  plannedTotalCell.value = {
    formula: `SUM(C${plannedRow1}:L${plannedRow1})`,
    result: 0,
  };
  applyTimesCellStyle(plannedTotalCell, { size: 12, horizontal: "center" });

  // Row 65: "Нақты орындалған, сағат/ Фактически выполнено, часов" (BOLD)
  const actualRow0 = plannedRow0 + 1;
  const actualRow1 = actualRow0 + 1;

  const actualCell = getCell(worksheet, actualRow0, COL_B);
  actualCell.value = "Нақты орындалған, сағат/ Фактически выполнено, часов";
  applyTimesCellStyle(actualCell, { size: 12, bold: true, horizontal: "left" });

  // Columns C-L: Formula =SUM(col46+col61+col62)
  for (let col = COL_C; col <= COL_L; col++) {
    const colLetter = getColumnLetter(col);
    const cell = getCell(worksheet, actualRow0, col);
    cell.value = {
      formula: `SUM(${colLetter}${vsegoRow1}+${colLetter}${zamenaVsegoRow1}+${colLetter}${examsRow1})`,
      result: 0,
    };
    applyTimesCellStyle(cell, { size: 12, bold: true, horizontal: "center" });
  }

  // Column M: Total
  const actualTotalCell = getCell(worksheet, actualRow0, COL_M);
  actualTotalCell.value = {
    formula: `SUM(M${vsegoRow1}+M${zamenaVsegoRow1}+M${examsRow1})`,
    result: 0,
  };
  applyTimesCellStyle(actualTotalCell, { size: 12, bold: true, horizontal: "center" });

  // Row 66: Empty (no borders needed - matches template)
  // Skip styling for row 66

  // Summary section rows 67-72: Labels in B, values in H-I with borders+fill
  const summaryStartRow0 = actualRow0 + 2; // Skip empty row 66

  // Row 67: "Жоспар бойынша барлық сағаттар/Всего часов по плану:"
  const planTotalRow0 = summaryStartRow0;
  const planTotalCell = getCell(worksheet, planTotalRow0, COL_B);
  planTotalCell.value = "Жоспар бойынша барлық сағаттар/Всего часов по плану:";
  planTotalCell.font = { name: TIMES_NEW_ROMAN, size: 12, color: THEME_BLACK };
  planTotalCell.alignment = { horizontal: "left" };

  // Column H: Value with border + fill
  const planValueCell = getCell(worksheet, planTotalRow0, COL_H);
  planValueCell.value = null;
  applyTimesCellStyle(planValueCell, { size: 11, horizontal: "center" });
  planValueCell.fill = HIGHLIGHT_FILL;

  // Column I: Empty with border + fill
  const planNoteCell = getCell(worksheet, planTotalRow0, COL_I);
  planNoteCell.value = null;
  applyTimesCellStyle(planNoteCell, { size: 11, horizontal: "center" });
  planNoteCell.fill = HIGHLIGHT_FILL;

  // Row 68: "Сағаттардың орындалмағаны/Не выполнено часов:"
  const notCompletedRow0 = planTotalRow0 + 1;
  const notCompletedCell = getCell(worksheet, notCompletedRow0, COL_B);
  notCompletedCell.value = "Сағаттардың орындалмағаны/Не выполнено часов:";
  notCompletedCell.font = { name: TIMES_NEW_ROMAN, size: 12, color: THEME_BLACK };
  notCompletedCell.alignment = { horizontal: "left" };

  const notCompletedValueCell = getCell(worksheet, notCompletedRow0, COL_H);
  notCompletedValueCell.value = 0;
  applyTimesCellStyle(notCompletedValueCell, { size: 11, horizontal: "center" });
  notCompletedValueCell.fill = HIGHLIGHT_FILL;

  const notCompletedNoteCell = getCell(worksheet, notCompletedRow0, COL_I);
  notCompletedNoteCell.value = null;
  applyTimesCellStyle(notCompletedNoteCell, { size: 11, horizontal: "center" });
  notCompletedNoteCell.fill = HIGHLIGHT_FILL;

  // Row 69: "Сағаттардың орындалғаны/Выполнено часов"
  const completedRow0 = notCompletedRow0 + 1;
  const completedCell = getCell(worksheet, completedRow0, COL_B);
  completedCell.value = "Сағаттардың орындалғаны/Выполнено часов";
  completedCell.font = { name: TIMES_NEW_ROMAN, size: 12, color: THEME_BLACK };
  completedCell.alignment = { horizontal: "left" };

  // Column H: Value (bold) - references main Всего M column
  const completedValueCell = getCell(worksheet, completedRow0, COL_H);
  completedValueCell.value = {
    formula: `M${vsegoRow1}`,
    result: 0,
  };
  applyTimesCellStyle(completedValueCell, { size: 11, bold: true, horizontal: "center" });
  completedValueCell.fill = HIGHLIGHT_FILL;

  // Column I: Note (e.g., "плюс 20")
  const completedNoteCell = getCell(worksheet, completedRow0, COL_I);
  completedNoteCell.value = null;
  applyTimesCellStyle(completedNoteCell, { size: 11, horizontal: "center" });
  completedNoteCell.fill = HIGHLIGHT_FILL;

  // Row 70: "Жоспардан тыс сағаттар берілді/Дано часов сверх плана:"
  const extraHoursRow1_0 = completedRow0 + 1;
  const extraHoursCell1 = getCell(worksheet, extraHoursRow1_0, COL_B);
  extraHoursCell1.value = "Жоспардан тыс сағаттар берілді/Дано часов сверх плана:";
  extraHoursCell1.font = { name: TIMES_NEW_ROMAN, size: 12, color: THEME_BLACK };
  extraHoursCell1.alignment = { horizontal: "left" };

  // Column H: Exam hours (references M column of exams row)
  const extraValue1Cell = getCell(worksheet, extraHoursRow1_0, COL_H);
  extraValue1Cell.value = {
    formula: `M${examsRow1}`,
    result: 0,
  };
  applyTimesCellStyle(extraValue1Cell, { size: 11, horizontal: "center" });
  extraValue1Cell.fill = HIGHLIGHT_FILL;

  // Column I: "экзамен"
  const extraNote1Cell = getCell(worksheet, extraHoursRow1_0, COL_I);
  extraNote1Cell.value = "экзамен";
  applyTimesCellStyle(extraNote1Cell, { size: 11, horizontal: "center" });
  extraNote1Cell.fill = HIGHLIGHT_FILL;

  // Row 71: Replacement hours (empty label, values in H-I)
  const extraHoursRow2_0 = extraHoursRow1_0 + 1;
  // Column B: Empty
  const extraHoursLabel2 = getCell(worksheet, extraHoursRow2_0, COL_B);
  extraHoursLabel2.value = null;
  extraHoursLabel2.font = { name: TIMES_NEW_ROMAN, size: 12, color: THEME_BLACK };

  // Column H: Replacement hours (references Замена Всего M column)
  const extraValue2Cell = getCell(worksheet, extraHoursRow2_0, COL_H);
  extraValue2Cell.value = {
    formula: `M${zamenaVsegoRow1}`,
    result: 0,
  };
  applyTimesCellStyle(extraValue2Cell, { size: 11, horizontal: "center" });
  extraValue2Cell.fill = HIGHLIGHT_FILL;

  // Column I: "замена"
  const extraNote2Cell = getCell(worksheet, extraHoursRow2_0, COL_I);
  extraNote2Cell.value = "замена";
  applyTimesCellStyle(extraNote2Cell, { size: 11, horizontal: "center" });
  extraNote2Cell.fill = HIGHLIGHT_FILL;

  // Row 72: "Барлығы бір жыл ішінде берілген сағаттар/Всего дано за год часов:"
  const totalYearRow0 = extraHoursRow2_0 + 1;
  const completedRow1 = completedRow0 + 1;
  const extraHoursRow1_1 = extraHoursRow1_0 + 1;
  const extraHoursRow2_1 = extraHoursRow2_0 + 1;

  const totalYearCell = getCell(worksheet, totalYearRow0, COL_B);
  totalYearCell.value = "Барлығы бір жыл ішінде берілген сағаттар/Всего дано за год часов:";
  totalYearCell.font = { name: TIMES_NEW_ROMAN, size: 12, color: THEME_BLACK };
  totalYearCell.alignment = { horizontal: "left" };

  // Column H: SUM of rows 69-71 column H (bold)
  const totalYearValueCell = getCell(worksheet, totalYearRow0, COL_H);
  totalYearValueCell.value = {
    formula: `SUM(H${completedRow1}:H${extraHoursRow2_1})`,
    result: 0,
  };
  applyTimesCellStyle(totalYearValueCell, { size: 11, bold: true, horizontal: "center" });
  totalYearValueCell.fill = HIGHLIGHT_FILL;

  // Column I: Empty with border + fill
  const totalYearNoteCell = getCell(worksheet, totalYearRow0, COL_I);
  totalYearNoteCell.value = null;
  applyTimesCellStyle(totalYearNoteCell, { size: 11, horizontal: "center" });
  totalYearNoteCell.fill = HIGHLIGHT_FILL;

  // Rows 73-74: Empty (no styling needed)

  // Signature block - Row 75
  const signatureRow1_0 = totalYearRow0 + 3;
  const signatureCell = getCell(worksheet, signatureRow1_0, COL_B);
  signatureCell.value = "Басшының оқу жұмысы жөніндегі орынбасары /Заместитель руководителя по учебной работе _____________";
  signatureCell.font = { name: TIMES_NEW_ROMAN, size: 12, color: THEME_BLACK };
  signatureCell.alignment = { horizontal: "left" };

  // Row 76: Signature label in column H (size 8)
  const signatureRow2_0 = signatureRow1_0 + 1;
  const signatureCell2 = getCell(worksheet, signatureRow2_0, COL_H);
  signatureCell2.value = "(қолы/подпись)";
  signatureCell2.font = { name: TIMES_NEW_ROMAN, size: 8, color: THEME_BLACK };
  signatureCell2.alignment = { horizontal: "center" };
}

// ============================================================================
// Main Export Function
// ============================================================================

export async function exportTeacherWorkloadToExcel(
  payload: TeacherWorkloadExportPayload
): Promise<Uint8Array> {
  const workbook = generateWorkbookTemplate();

  const form1Sheet = workbook.getWorksheet(1);
  const form2Sheet = workbook.getWorksheet(2);
  const form3Sheet = workbook.getWorksheet(3);

  if (!form1Sheet || !form2Sheet || !form3Sheet) {
    throw new Error("Template sheets are missing");
  }

  // ==========================================================================
  // Dynamic header fields
  // ==========================================================================

  // Form 1
  form1Sheet.getCell("B3").value = payload.institutionName;
  form1Sheet.getCell("B5").value = `${payload.academicYear} оқу жылы/ за ${payload.academicYear} учебный год`;
  form1Sheet.getCell("B6").value =
    `Педагогтің тегі, аты, әкесінің аты /Фамилия, имя, отчество педагога  ${payload.teacherFullName}`;
  form1Sheet.getCell("F8").value = {
    richText: [
      { text: "____________айы/Месяц " },
      {
        // Form-1 now renders one section per month via populateForm1MultiMonth;
        // this header cell is a legacy single-month label. Fallback to empty
        // (each month section carries its own name in-band).
        text: payload.month ?? "",
        font: {
          bold: true,
          underline: true,
          size: 12,
          color: { indexed: 8 } as any,
          name: TIMES_NEW_ROMAN,
        },
      },
    ],
  };

  // Form 3
  form3Sheet.getCell("B5").value = payload.institutionName;
  form3Sheet.getCell("B7").value =
    `${payload.academicYear} оқу жылында педагог берген сағаттарды және (немесе) кредиттерді жылдық есепке алу/` +
    `Годовой учет часов и (или) кредитов, проведенных педагогом  в ${payload.academicYear} учебном году`;
  form3Sheet.getCell("B9").value =
    `Педагогтің тегі, аты, әкесінің аты (болған жағдайда) (толық)/Фамилия, имя, отчество ${payload.teacherFullName}`;

  const moduleList = (() => {
    const seen = new Set<string>();
    const items: string[] = [];
    for (const entry of payload.summaryEntries) {
      const moduleIndex = entry.moduleIndex?.trim();
      const subjectName = entry.subjectName?.trim();
      const combined = [moduleIndex, subjectName]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (!combined || seen.has(combined)) continue;
      seen.add(combined);
      items.push(combined);
    }
    return items.join(", ");
  })();

  form3Sheet.getCell("B12").value = moduleList;

  // Note: Form 2 signature block with teacher name is now set dynamically in populateForm2()

  await populateForm1(form1Sheet, payload);
  await populateForm2(form2Sheet, payload);
  await populateForm3(form3Sheet, payload);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
