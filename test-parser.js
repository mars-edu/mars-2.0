const ExcelJS = require('exceljs');
const fs = require('fs');

// Copy the parsing logic from excel-parser.ts

function cleanString(value) {
  if (value === null || value === undefined) return "";
  return value.toString().trim();
}

function parseHours(value) {
  if (value === null || value === undefined) return 0;
  const str = value.toString().trim();
  const num = parseFloat(str.replace(",", "."));
  return isNaN(num) ? str : num;
}

function getCellValueAsString(cell) {
  if (cell.value === null || cell.value === undefined) return '';

  if (typeof cell.value === 'object' && 'richText' in cell.value) {
    return cell.value.richText.map(rt => rt.text).join('');
  }

  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return String(cell.value.result ?? '');
  }

  return String(cell.value);
}

function worksheetToArray(sheet) {
  const result = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const rowData = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowData[colNumber - 1] = cell.value;
    });
    result[rowNumber - 1] = rowData;
  });
  return result;
}

function detectLessonNumberColumn(rawData, headerRowIndex) {
  for (let col = 0; col < 10; col++) {
    let numericCount = 0;
    let sequentialCount = 0;
    const values = [];

    for (let i = 1; i <= Math.min(10, rawData.length - headerRowIndex - 1); i++) {
      const rowIndex = headerRowIndex + i;
      if (rowIndex >= rawData.length) break;

      const row = rawData[rowIndex];
      if (!row || !Array.isArray(row) || col >= row.length) continue;

      const cellValue = row[col];
      if (cellValue === null || cellValue === undefined) continue;

      const parsed = parseInt(String(cellValue).trim());
      if (!isNaN(parsed) && parsed > 0) {
        numericCount++;
        values.push(parsed);
      }
    }

    if (values.length >= 2) {
      values.sort((a, b) => a - b);
      let isSequential = true;
      for (let i = 1; i < values.length; i++) {
        if (values[i] - values[i - 1] === 1) {
          sequentialCount++;
        }
      }

      if (numericCount >= 2 && (sequentialCount >= numericCount - 2 || values[0] === 1)) {
        return col;
      }
    }
  }

  return 0;
}

async function parseEducationalSchedule(filePath) {
  const buffer = fs.readFileSync(filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('No worksheet found in the Excel file');
  }

  const rawData = worksheetToArray(sheet);

  let headerRowIndex = -1;
  let headers = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    if (
      row &&
      Array.isArray(row) &&
      row.length > 0 &&
      row.some(cell => cell !== null && cell !== undefined)
    ) {
      headerRowIndex = i;
      headers = row.map(header => header ? header.toString().trim() : "");
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("No headers found in the Excel file");
  }

  // Detect which column contains lesson numbers
  const lessonNumberCol = detectLessonNumberColumn(rawData, headerRowIndex);
  console.log(`Detected lesson number column: ${lessonNumberCol} (Column ${String.fromCharCode(65 + lessonNumberCol)})`);

  const dataRows = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (
      row &&
      Array.isArray(row) &&
      row.length > 0 &&
      row.some(cell => cell !== null && cell !== undefined)
    ) {
      dataRows.push(row);
    }
  }

  const lessons = [];

  for (const row of dataRows) {
    const lessonNumberValue = row[lessonNumberCol];
    if (!Array.isArray(row) || !lessonNumberValue || isNaN(parseInt(String(lessonNumberValue))))
      continue;

    const lesson = {
      lessonNumber: parseInt(String(lessonNumberValue)),
      subject: cleanString(row[lessonNumberCol + 1]),
      hours: parseHours(row[lessonNumberCol + 2]),
      lessonType: cleanString(row[lessonNumberCol + 3]),
      homework: cleanString(row[lessonNumberCol + 4]),
      notes: cleanString(row[lessonNumberCol + 5]),
    };

    lessons.push(lesson);
  }

  const result = {
    metadata: {
      fileName: 'test.xlsx',
      sheetName: sheet.name,
      totalLessons: lessons.length,
      headerRow: headerRowIndex,
      headers: headers,
      parsedAt: new Date().toISOString(),
    },
    lessons: lessons,
  };

  return result;
}

// Test the parser
const filePath = process.argv[2] || '/home/olge/Downloads/Telegram Desktop/Шаблон КТП Марса (2).xlsx';

console.log('='.repeat(80));
console.log('TESTING EXCEL PARSER');
console.log('='.repeat(80));
console.log(`File: ${filePath}\n`);

parseEducationalSchedule(filePath)
  .then(result => {
    console.log('✓ Parsing successful!\n');
    console.log('Metadata:');
    console.log(`  - File name: ${result.metadata.fileName}`);
    console.log(`  - Sheet name: ${result.metadata.sheetName}`);
    console.log(`  - Total lessons: ${result.metadata.totalLessons}`);
    console.log(`  - Header row: ${result.metadata.headerRow}`);
    console.log(`  - Headers: ${result.metadata.headers.filter(h => h).join(', ')}\n`);

    console.log('Lessons:');
    result.lessons.forEach((lesson, idx) => {
      console.log(`  ${idx + 1}. Lesson ${lesson.lessonNumber}: ${lesson.subject}`);
      console.log(`     Hours: ${lesson.hours}, Type: ${lesson.lessonType}`);
      console.log(`     Homework: ${lesson.homework || '(none)'}`);
      console.log(`     Notes: ${lesson.notes || '(none)'}`);
      console.log();
    });

    console.log('='.repeat(80));
    console.log(`SUCCESS: Imported ${result.metadata.totalLessons} lessons`);
    console.log('='.repeat(80));
  })
  .catch(error => {
    console.error('✗ Parsing failed!\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  });
