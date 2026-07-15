/**
 * Excel Template Analyzer
 * Analyzes the existing Excel template to extract complete structure
 */

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function analyzeTemplate() {
  const templatePath = path.join(__dirname, 'public/ООД Килаш 2024-2025 форма 1-3.xlsx');

  console.log('Loading template:', templatePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const analysis = {
    worksheetCount: workbook.worksheets.length,
    worksheets: []
  };

  workbook.eachSheet((worksheet, sheetId) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`SHEET ${sheetId}: ${worksheet.name}`);
    console.log('='.repeat(80));

    const sheetAnalysis = {
      id: sheetId,
      name: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount,
      pageSetup: {},
      columns: [],
      rows: [],
      mergedCells: [],
      cellDetails: []
    };

    // Page setup
    if (worksheet.pageSetup) {
      sheetAnalysis.pageSetup = {
        paperSize: worksheet.pageSetup.paperSize,
        orientation: worksheet.pageSetup.orientation,
        fitToPage: worksheet.pageSetup.fitToPage,
        fitToWidth: worksheet.pageSetup.fitToWidth,
        fitToHeight: worksheet.pageSetup.fitToHeight,
        margins: worksheet.pageSetup.margins
      };
      console.log('\nPage Setup:', JSON.stringify(sheetAnalysis.pageSetup, null, 2));
    }

    // Column widths
    console.log('\n--- Column Widths ---');
    worksheet.columns.forEach((col, idx) => {
      if (col.width) {
        sheetAnalysis.columns.push({
          index: idx + 1,
          letter: getColumnLetter(idx + 1),
          width: col.width
        });
        console.log(`Column ${getColumnLetter(idx + 1)} (${idx + 1}): width=${col.width}`);
      }
    });

    // Row heights (only non-default)
    console.log('\n--- Row Heights (non-default only) ---');
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (row.height && row.height !== 15) {
        sheetAnalysis.rows.push({
          number: rowNumber,
          height: row.height
        });
        console.log(`Row ${rowNumber}: height=${row.height}`);
      }
    });

    // Merged cells
    console.log('\n--- Merged Cells ---');
    if (worksheet.model.merges) {
      worksheet.model.merges.forEach(merge => {
        sheetAnalysis.mergedCells.push(merge);
        console.log(`Merged: ${merge}`);
      });
    }

    // Cell details (first 30 rows, all columns with content)
    console.log('\n--- Cell Contents and Styles (first 30 rows) ---');
    for (let rowNum = 1; rowNum <= Math.min(30, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);

      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const cellData = {
          address: cell.address,
          row: rowNum,
          col: colNumber,
          colLetter: getColumnLetter(colNumber),
          value: getCellValue(cell),
          type: cell.type,
          style: {}
        };

        // Font
        if (cell.font) {
          cellData.style.font = {
            name: cell.font.name,
            size: cell.font.size,
            bold: cell.font.bold,
            italic: cell.font.italic,
            underline: cell.font.underline,
            color: cell.font.color
          };
        }

        // Alignment
        if (cell.alignment) {
          cellData.style.alignment = {
            horizontal: cell.alignment.horizontal,
            vertical: cell.alignment.vertical,
            wrapText: cell.alignment.wrapText,
            textRotation: cell.alignment.textRotation
          };
        }

        // Border
        if (cell.border) {
          cellData.style.border = {
            top: cell.border.top,
            right: cell.border.right,
            bottom: cell.border.bottom,
            left: cell.border.left
          };
        }

        // Fill
        if (cell.fill && cell.fill.type) {
          cellData.style.fill = {
            type: cell.fill.type,
            pattern: cell.fill.pattern,
            fgColor: cell.fill.fgColor,
            bgColor: cell.fill.bgColor
          };
        }

        // Number format
        if (cell.numFmt) {
          cellData.style.numFmt = cell.numFmt;
        }

        sheetAnalysis.cellDetails.push(cellData);

        // Console output
        console.log(`\n${cell.address} (R${rowNum}C${colNumber}):`);
        console.log(`  Value: ${JSON.stringify(getCellValue(cell))}`);
        console.log(`  Type: ${cell.type}`);

        if (cell.font) {
          console.log(`  Font: ${cell.font.name} ${cell.font.size}pt${cell.font.bold ? ' bold' : ''}${cell.font.italic ? ' italic' : ''}`);
          if (cell.font.color) console.log(`    Color: ${JSON.stringify(cell.font.color)}`);
        }

        if (cell.alignment) {
          console.log(`  Alignment: H=${cell.alignment.horizontal || 'none'} V=${cell.alignment.vertical || 'none'} Wrap=${cell.alignment.wrapText || false}`);
        }

        if (cell.border) {
          const borders = [];
          if (cell.border.top) borders.push(`top=${cell.border.top.style}`);
          if (cell.border.right) borders.push(`right=${cell.border.right.style}`);
          if (cell.border.bottom) borders.push(`bottom=${cell.border.bottom.style}`);
          if (cell.border.left) borders.push(`left=${cell.border.left.style}`);
          if (borders.length > 0) console.log(`  Border: ${borders.join(', ')}`);
        }

        if (cell.fill && cell.fill.type) {
          console.log(`  Fill: ${cell.fill.type}/${cell.fill.pattern} ${JSON.stringify(cell.fill.fgColor)}`);
        }

        if (cell.numFmt) {
          console.log(`  NumFmt: ${cell.numFmt}`);
        }
      });
    }

    analysis.worksheets.push(sheetAnalysis);
  });

  // Save detailed JSON analysis
  const outputPath = path.join(__dirname, 'excel-template-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`Analysis saved to: ${outputPath}`);
  console.log('='.repeat(80));
}

function getCellValue(cell) {
  if (cell.type === ExcelJS.ValueType.Merge) {
    return '[MERGED]';
  }
  if (cell.type === ExcelJS.ValueType.Formula) {
    return { formula: cell.formula, result: cell.result };
  }
  return cell.value;
}

function getColumnLetter(columnNumber) {
  let letter = '';
  while (columnNumber > 0) {
    const remainder = (columnNumber - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    columnNumber = Math.floor((columnNumber - 1) / 26);
  }
  return letter;
}

analyzeTemplate().catch(err => {
  console.error('Error analyzing template:', err);
  process.exit(1);
});
