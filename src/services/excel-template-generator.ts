/**
 * Excel Template Generator
 * Creates teacher workload report template programmatically
 * Based on exact analysis of "ООД Килаш 2024-2025 форма 1-3.xlsx"
 */

import * as ExcelJS from 'exceljs';

// ============================================================================
// Constants - Theme Colors
// ============================================================================

const THEME_BLACK = { theme: 1 }; // Black text color
const GRAY_FILL = {
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { theme: 0, tint: -0.499984740745262 }, // Gray fill for headers
  bgColor: { indexed: 64 },
};

const THIN_BORDER = {
  top: { style: 'thin' as const },
  right: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  left: { style: 'thin' as const },
};

// ============================================================================
// Main Template Generator
// ============================================================================

/**
 * Generate complete workbook template with all 3 forms
 */
export function generateWorkbookTemplate(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'MARS 2.0';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create all three sheets
  createForm1Sheet(workbook);
  createForm2Sheet(workbook);
  createForm3Sheet(workbook);

  return workbook;
}

// ============================================================================
// Form 1: Daily Workload (форма 1)
// ============================================================================

function createForm1Sheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('форма 1', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
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

  // Set exact column widths from template
  sheet.getColumn(1).width = 2; // A - margin
  sheet.getColumn(2).width = 5.88495575221239; // B - № п/п
  sheet.getColumn(3).width = 11.5575221238938; // C - Индекс модуля
  sheet.getColumn(4).width = 58.6637168141593; // D - Наименование дисциплины
  sheet.getColumn(5).width = 42.6637168141593; // E - Группа

  // F through AJ - 31 day columns (same width for all)
  for (let col = 6; col <= 36; col++) {
    sheet.getColumn(col).width = 5.66371681415929;
  }

  // Summary columns (6 columns after month total)
  sheet.getColumn(37).width = 12.8849557522124; // AK - Итого за месяц
  sheet.getColumn(38).width = 30; // AL - Group (duplicate)
  sheet.getColumn(39).width = 54.3362831858407; // AM - Subject (duplicate)
  sheet.getColumn(40).width = 19; // AN - Planned hours
  sheet.getColumn(41).width = 9.88495575221239; // AO - Actual monthly
  sheet.getColumn(42).width = 11.6637168141593; // AP - Cumulative
  sheet.getColumn(43).width = 11.8849557522124; // AQ - Remaining

  // Set row heights
  sheet.getRow(2).height = 24.9;
  sheet.getRow(3).height = 24.9;
  sheet.getRow(4).height = 24.9;
  sheet.getRow(5).height = 24.9;
  sheet.getRow(6).height = 24.9;
  sheet.getRow(7).height = 24.9;
  sheet.getRow(9).height = 53.2;

  // Title section (rows 2-6)
  const titleFont = { name: 'Times New Roman', size: 11, bold: true, color: THEME_BLACK };

  // Row 2: Ministry
  const b2 = sheet.getCell('B2');
  b2.value = ' Қазақстан Республикасы Оқу-ағарту министрлігі/Министерство просвещения Республики Казахстан';
  b2.font = titleFont;
  b2.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.mergeCells('B2:AK2');

  // Row 3: Institution name
  const b3 = sheet.getCell('B3');
  b3.value = '"Музыкалық колледж  - дарынды балаларға арналған музыкалық мектеп - интернат" Кешені ММ/ ГУ "Комплекс "Музыкальный колледж - музыкальная школа - интернат для одарённых детей"';
  b3.font = titleFont;
  b3.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.mergeCells('B3:AK3');

  // Row 4: Document title
  const b4 = sheet.getCell('B4');
  b4.value = 'Педагог жұмысының әрбір айға арналған оқу уақытын есепке алу ведомосі (сағатпен және (немесе) кредитпен)  /Ведомость учёта учебного времени работы педагога за каждый месяц (в часах и (или) кредитах)';
  b4.font = titleFont;
  b4.alignment = { horizontal: 'center', vertical: 'distributed' };
  sheet.mergeCells('B4:AK4');

  // Row 5: Academic year (placeholder)
  const b5 = sheet.getCell('B5');
  b5.value = '2024/2025 оқу жылы/ за 2024/2025 учебный год';
  b5.font = titleFont;
  b5.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.mergeCells('B5:AK5');

  // Row 6: Teacher name (placeholder - this will be replaced)
  const b6 = sheet.getCell('B6');
  b6.value = 'Килаш';
  b6.font = titleFont;
  b6.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.mergeCells('B6:AK6');

  // Row 7: Month (placeholder - merged cell for month name)
  const r7 = sheet.getCell('R7');
  r7.value = 'сентябрь';
  r7.font = titleFont;
  r7.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.mergeCells('R7:U7');

  // Row 8-9: Header
  const headerFont = { name: 'Times New Roman', size: 10, bold: true, color: THEME_BLACK };
  const headerAlignment = { horizontal: 'center' as const, vertical: 'distributed' as const };

  // Row 8: Main headers
  const b8 = sheet.getCell('B8');
  b8.value = '№ р/с /№ п/п';
  b8.font = headerFont;
  b8.alignment = headerAlignment;
  b8.border = THIN_BORDER;
  sheet.mergeCells('B8:B9');

  const c8 = sheet.getCell('C8');
  c8.value = 'Модуль индексі/Индекс модуля';
  c8.font = headerFont;
  c8.alignment = headerAlignment;
  c8.border = THIN_BORDER;
  sheet.mergeCells('C8:C9');

  const d8 = sheet.getCell('D8');
  d8.value = 'Пәндердің, оқыту нәтижелерінің және (немесе) модульдің атауы (практика атауы)/Наименование дисциплин, результатов обучения и (или) модуля (наименование практики)';
  d8.font = headerFont;
  d8.alignment = headerAlignment;
  d8.border = THIN_BORDER;
  sheet.mergeCells('D8:D9');

  const e8 = sheet.getCell('E8');
  e8.value = 'Оқу тобының нөмірі немесе тегі, студенттің аты-жөні, курсы/ № учебной группы или фамилия,  имя студента,  курс';
  e8.font = headerFont;
  e8.alignment = headerAlignment;
  e8.border = THIN_BORDER;
  sheet.mergeCells('E8:E9');

  // Days header (merged across all day columns)
  const f8 = sheet.getCell('F8');
  f8.value = { richText: [{ text: 'Айдың күні/\nЧисло месяца' }] };
  f8.font = headerFont;
  f8.alignment = headerAlignment;
  f8.border = THIN_BORDER;
  sheet.mergeCells('F8:AJ8');

  // Summary column headers
  const ak8 = sheet.getCell('AK8');
  ak8.value = 'Барлығы сағат/Итого часов';
  ak8.font = headerFont;
  ak8.alignment = headerAlignment;
  ak8.border = THIN_BORDER;
  sheet.mergeCells('AK8:AK9');

  const al8 = sheet.getCell('AL8');
  al8.value = 'Оқу тобының нөмірі немесе тегі, студенттің аты-жөні, курсы/ № учебной группы или фамилия,  имя студента,  курс';
  al8.font = headerFont;
  al8.alignment = headerAlignment;
  al8.border = THIN_BORDER;
  sheet.mergeCells('AL8:AL9');

  const am8 = sheet.getCell('AM8');
  am8.value = 'Пәннің және (немесе) модульдердің атауы/Наименование дисциплины и (или) модулей';
  am8.font = headerFont;
  am8.alignment = headerAlignment;
  am8.border = THIN_BORDER;
  sheet.mergeCells('AM8:AM9');

  const an8 = sheet.getCell('AN8');
  an8.value = 'Жоспарланған сағаттар саны/Количество запланированных часов';
  an8.font = headerFont;
  an8.alignment = headerAlignment;
  an8.border = THIN_BORDER;
  sheet.mergeCells('AN8:AN9');

  const ao8 = sheet.getCell('AO8');
  ao8.value = 'Нақты орындалды/Фактически выполнено';
  ao8.font = headerFont;
  ao8.alignment = headerAlignment;
  ao8.border = THIN_BORDER;
  sheet.mergeCells('AO8:AP8');

  const aq8 = sheet.getCell('AQ8');
  aq8.value = 'Қалған сағат/Остаток часов';
  aq8.font = headerFont;
  aq8.alignment = headerAlignment;
  aq8.border = THIN_BORDER;
  sheet.mergeCells('AQ8:AQ9');

  // Row 9: Day numbers (1-31) + additional headers
  const dayFont = { name: 'Times New Roman', size: 11, color: THEME_BLACK };
  const dayAlignment = { horizontal: 'center' as const };

  // Day columns start at F (column 6) and go to AJ (column 36)
  for (let day = 1; day <= 31; day++) {
    const colIndex = 5 + day; // Column 6 (F) is index 5 in 0-based, so F=6, G=7... AJ=36
    const cell = sheet.getCell(9, colIndex); // Row 9, column F through AJ
    cell.value = day;
    cell.font = dayFont;
    cell.alignment = dayAlignment;
    cell.border = THIN_BORDER;
    cell.fill = GRAY_FILL;
  }

  // Additional headers in row 9
  const ao9 = sheet.getCell('AO9');
  ao9.value = 'бір айдағы сағат жиынтығы/ итого часов в месяц';
  ao9.font = dayFont;
  ao9.alignment = dayAlignment;
  ao9.border = THIN_BORDER;

  const ap9 = sheet.getCell('AP9');
  ap9.value = 'оқу жылының басынан бастап/с начала учебного года';
  ap9.font = dayFont;
  ap9.alignment = dayAlignment;
  ap9.border = THIN_BORDER;
}

// ============================================================================
// Form 2: Summary (форма 2)
// ============================================================================

function createForm2Sheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('форма 2', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    properties: {
      defaultRowHeight: 15,
    },
  });

  // Set column widths
  sheet.getColumn(1).width = 2; // A - margin
  sheet.getColumn(2).width = 22; // B - Group (increased)
  sheet.getColumn(3).width = 40; // C - Subject
  sheet.getColumn(4).width = 12; // D - Plan (increased)
  sheet.getColumn(5).width = 12; // E - Fact (increased)
  sheet.getColumn(6).width = 12; // F - Fac Plan (increased)
  sheet.getColumn(7).width = 12; // G - Fac Fact (increased)
  sheet.getColumn(8).width = 12; // H - Cons Plan (increased)
  sheet.getColumn(9).width = 12; // I - Cons Fact (increased)
  sheet.getColumn(10).width = 12; // J - Exam Plan (increased)
  sheet.getColumn(11).width = 12; // K - Exam Fact (increased)
  sheet.getColumn(12).width = 18; // L - Total (increased)

  // Row 1: Title
  const titleFont = { name: 'Times New Roman', size: 11, bold: true, color: THEME_BLACK };
  sheet.getRow(1).height = 30;
  const b1 = sheet.getCell('B1');
  b1.value = 'Педагог сағаттарының жылдық есебіне қосымша мәліметтер/Дополнительные сведения к годовому учету часов педагога';
  b1.font = titleFont;
  b1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.mergeCells('B1:L1');

  // Row 2: Empty (leave blank as in original)
  sheet.getRow(2).height = 15;

  // Multi-row header (rows 3-5)
  const headerFont = { name: 'Times New Roman', size: 10, bold: true, color: THEME_BLACK };
  sheet.getRow(3).height = 60; // Increased for wrapped text
  sheet.getRow(4).height = 35; // Increased for wrapped text
  sheet.getRow(5).height = 30; // Increased for wrapped text
  sheet.getRow(6).height = 20;

  // Row 3: Main category headers (no fill, just borders)
  const b3 = sheet.getCell('B3');
  b3.value = 'Оқу тобының №, студенттің аты-жөні/             № учебной группы/ ФИО студента';
  b3.font = headerFont;
  b3.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
  b3.border = THIN_BORDER;
  sheet.mergeCells('B3:B5');

  const c3 = sheet.getCell('C3');
  c3.value = 'Пәннің және (немесе) модульдердің атауы/ Наименование дисциплины и (или) модулей';
  c3.font = headerFont;
  c3.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
  c3.border = THIN_BORDER;
  sheet.mergeCells('C3:C5');

  const d3 = sheet.getCell('D3');
  d3.value = 'Сағат саны/ Количество часов';
  d3.font = headerFont;
  d3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  d3.border = THIN_BORDER;
  sheet.mergeCells('D3:E4');

  const f3 = sheet.getCell('F3');
  f3.value = 'Оның ішіндегі/Из них часы';
  f3.font = headerFont;
  f3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  f3.border = THIN_BORDER;
  sheet.mergeCells('F3:K3');

  const l3 = sheet.getCell('L3');
  l3.value = 'Жалпы сағат саны/  Общее количество часов';
  l3.font = headerFont;
  l3.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
  l3.border = THIN_BORDER;
  sheet.mergeCells('L3:L5');

  // Row 4: Sub-category headers
  const f4 = sheet.getCell('F4');
  f4.value = 'факультативатер факультатива';
  f4.font = headerFont;
  f4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  f4.border = THIN_BORDER;
  sheet.mergeCells('F4:G4');

  const h4 = sheet.getCell('H4');
  h4.value = 'консультациялар консультаций';
  h4.font = headerFont;
  h4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  h4.border = THIN_BORDER;
  sheet.mergeCells('H4:I4');

  const j4 = sheet.getCell('J4');
  j4.value = 'емтихандар экзаменов';
  j4.font = headerFont;
  j4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  j4.border = THIN_BORDER;
  sheet.mergeCells('J4:K4');

  // Row 5: Plan/Fact headers
  const smallFont = { name: 'Times New Roman', size: 10, bold: true, color: THEME_BLACK };

  ['D', 'F', 'H', 'J'].forEach(col => {
    const planCell = sheet.getCell(`${col}5`);
    planCell.value = 'жоспар план';
    planCell.font = smallFont;
    planCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    planCell.border = THIN_BORDER;
  });

  ['E', 'G', 'I', 'K'].forEach(col => {
    const factCell = sheet.getCell(`${col}5`);
    factCell.value = 'нақты факт';
    factCell.font = smallFont;
    factCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    factCell.border = THIN_BORDER;
  });

  // Row 6: Column numbers
  for (let i = 1; i <= 11; i++) {
    const colLetter = String.fromCharCode(65 + i); // B=66, C=67...
    const cell = sheet.getCell(`${colLetter}6`);
    cell.value = i;
    cell.font = headerFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = THIN_BORDER;
  }
}

// ============================================================================
// Form 3: Monthly Distribution (форма 3)
// ============================================================================

function createForm3Sheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('форма 3', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    properties: {
      defaultRowHeight: 15,
    },
  });

  // Set column widths (increased for month headers)
  const columnWidths = [
    { col: 1, width: 2 }, // A - margin
    { col: 2, width: 35 }, // B - Groups
    { col: 3, width: 15 }, // C - September (increased)
    { col: 4, width: 14 }, // D - October (increased)
    { col: 5, width: 14 }, // E - November (increased)
    { col: 6, width: 16 }, // F - December (increased)
    { col: 7, width: 14 }, // G - January (increased)
    { col: 8, width: 14 }, // H - February (increased)
    { col: 9, width: 14 }, // I - March (increased)
    { col: 10, width: 14 }, // J - April (increased)
    { col: 11, width: 13 }, // K - May (increased)
    { col: 12, width: 14 }, // L - June (increased)
    { col: 13, width: 15 }, // M - Total (increased)
  ];

  columnWidths.forEach(({ col, width }) => {
    sheet.getColumn(col).width = width;
  });

  // Set row heights
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
  sheet.getRow(15).height = 35; // Month header row

  // Title section
  const titleFont = { name: 'Times New Roman', size: 11, bold: true, color: THEME_BLACK };
  const normalFont = { name: 'Times New Roman', size: 10, color: THEME_BLACK };

  // Row 2: Ministry
  const b2 = sheet.getCell('B2');
  b2.value = 'Қазақстан Республикасы Оқу-ағарту министрлігі/Министерство просвещения Республики Казахстан';
  b2.font = titleFont;
  b2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.mergeCells('B2:L2');

  // Row 3: Document title
  const b3 = sheet.getCell('B3');
  b3.value = ' Педагогтің бір жылдағы оқу уақытын есепке алу ведомосы/Ведомость учета учебного времени педагога за год';
  b3.font = titleFont;
  b3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.mergeCells('B3:L3');

  // Row 4: In hours/credits
  const b4 = sheet.getCell('B4');
  b4.value = '      (сағатпен және (немесе) кредитпен)/(в часах и (или) кредитах) ';
  b4.font = titleFont;
  b4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.mergeCells('B4:K4');

  // Row 5: Institution (placeholder - will be replaced)
  const b5 = sheet.getCell('B5');
  b5.value = '"Музыкалық колледж  - дарынды балаларға арналған музыкалық мектеп - интернат" Кешені ММ/                                                               ГУ "Комплекс "Музыкальный колледж - музыкальная школа - интернат  для одарённых детей"';
  b5.font = titleFont;
  b5.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.mergeCells('B5:K5');

  // Row 6: Organization name label
  const b6 = sheet.getCell('B6');
  b6.value = '(наименование организации образования)';
  b6.font = normalFont;
  b6.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.mergeCells('B6:K6');

  // Row 7: Academic year (placeholder - will be replaced)
  const b7 = sheet.getCell('B7');
  b7.value = '2024/2025 оқу жылында педагог берген сағаттарды және (немесе) кредиттерді жылдық есепке алу/Годовой учет часов и (или) кредитов, проведенных педагогом  в 2024/2025 учебном году';
  b7.font = titleFont;
  b7.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.mergeCells('B7:K7');

  // Row 8: Empty spacer
  sheet.mergeCells('B8:K8');

  // Row 9: Teacher name label (placeholder - will be replaced with "Килаш")
  const b9 = sheet.getCell('B9');
  b9.value = 'Педагогтің тегі, аты, әкесінің аты (болған жағдайда) (толық)/Фамилия, имя, отчество (при его наличии) педагога (полностью)\nКилаш';
  b9.font = normalFont;
  b9.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  sheet.mergeCells('B9:L9');

  // Row 10: (full name) label
  const b10 = sheet.getCell('B10');
  b10.value = '(при его наличии) педагога (полностью)';
  b10.font = normalFont;
  b10.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.mergeCells('B10:G10');

  // Row 11: Module/subject label
  const b11 = sheet.getCell('B11');
  b11.value = 'Модуль индексі және пәндердің және (немесе) модульдің атауы (практика атауы)/Индекс модуля и наименование дисциплин и (или) модуля (наименование практики)';
  b11.font = normalFont;
  b11.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  sheet.mergeCells('B11:K11');

  // Row 12: Subjects (placeholder)
  const b12 = sheet.getCell('B12');
  b12.value = 'ООД 07 История Казахстана, ООД  10 Всемирная история, БМ 4 Применение основ социально-гуманитарных наук в профессиональной деятельности';
  b12.font = normalFont;
  b12.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  sheet.mergeCells('B12:K12');

  // Row 13: Empty
  sheet.mergeCells('B13:K13');

  // Row 15: Month headers (this is where the actual data table starts)
  const headerFont = { name: 'Times New Roman', size: 12, bold: true, color: THEME_BLACK };
  const headerFontSmall = { name: 'Times New Roman', size: 11, bold: true, color: THEME_BLACK };
  const groupHeaderAlignment = { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true };
  const monthHeaderAlignment = { horizontal: 'center' as const, vertical: 'distributed' as const };

  const b15 = sheet.getCell('B15');
  b15.value = 'Топтар/ АЖ        Айлар                              Группы/ ФИО       Месяцы';
  b15.font = headerFont;
  b15.alignment = groupHeaderAlignment;
  b15.border = THIN_BORDER;
  b15.fill = GRAY_FILL;

  const monthHeaders = [
    { col: 3, textKz: 'қыркүйек', textRu: 'сентябрь' },
    { col: 4, textKz: 'қазан', textRu: 'октябрь' },
    { col: 5, textKz: 'қараша', textRu: 'ноябрь' },
    { col: 6, textKz: 'желтоқсан', textRu: 'декабрь' },
    { col: 7, textKz: 'қантар', textRu: 'январь' },
    { col: 8, textKz: 'ақпан', textRu: 'февраль' },
    { col: 9, textKz: 'наурыз', textRu: 'март' },
    { col: 10, textKz: 'сәуір', textRu: 'апрель' },
    { col: 11, textKz: 'мамыр', textRu: 'май' },
    { col: 12, textKz: 'маусым', textRu: 'июнь' },
  ];

  monthHeaders.forEach(({ col, textKz, textRu }) => {
    const cell = sheet.getCell(15, col);
    cell.value = `${textKz}    ${textRu}`;
    cell.font = headerFont;
    cell.alignment = monthHeaderAlignment;
    cell.border = THIN_BORDER;
    cell.fill = GRAY_FILL;
  });

  // Column M (13): Total
  const m15 = sheet.getCell('M15');
  m15.value = 'Итого';
  m15.font = headerFontSmall;
  m15.alignment = monthHeaderAlignment;
  m15.border = THIN_BORDER;
  m15.fill = GRAY_FILL;
}
