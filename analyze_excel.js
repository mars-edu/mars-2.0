const ExcelJS = require('exceljs');

async function analyzeTemplate() {
    console.log("================================================================================");
    console.log("EXCEL TEMPLATE STRUCTURE ANALYSIS");
    console.log("================================================================================");
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('/home/olge/SOFT/git/mars-2.0/public/ООД Килаш 2024-2025 форма 1-3.xlsx');
    
    const sheetNames = workbook.worksheets.map(ws => ws.name);
    console.log('\nTotal sheets:', workbook.worksheets.length);
    console.log('Sheet names:', sheetNames.join(', '));
    
    workbook.worksheets.forEach((worksheet, sheetIndex) => {
        console.log('\n================================================================================');
        console.log('SHEET', sheetIndex + 1, ':', worksheet.name);
        console.log('================================================================================');
        
        console.log('\nRow count:', worksheet.rowCount, ', Column count:', worksheet.columnCount);
        
        console.log('\nFirst 35 rows (showing non-empty cells):');
        console.log('--------------------------------------------------------------------------------');
        
        for (let rowNum = 1; rowNum <= Math.min(35, worksheet.rowCount); rowNum++) {
            const row = worksheet.getRow(rowNum);
            let hasContent = false;
            const cellData = [];
            
            row.eachCell({ includeEmpty: false }, (cell, colNum) => {
                hasContent = true;
                let value = cell.value;
                
                if (value && typeof value === 'object') {
                    if (value.richText) {
                        value = value.richText.map(rt => rt.text).join('');
                    } else if (value.text) {
                        value = value.text;
                    } else if (value.formula) {
                        value = '[Formula: ' + value.formula + ']';
                    } else {
                        value = JSON.stringify(value);
                    }
                }
                
                value = String(value || '').substring(0, 60);
                
                const styleInfo = [];
                if (cell.font && cell.font.bold) styleInfo.push('BOLD');
                if (cell.fill && cell.fill.fgColor && cell.fill.fgColor.argb) {
                    styleInfo.push('Fill:' + cell.fill.fgColor.argb);
                }
                
                if (cell.border) {
                    const borders = [];
                    if (cell.border.top && cell.border.top.style) borders.push('T:' + cell.border.top.style);
                    if (cell.border.right && cell.border.right.style) borders.push('R:' + cell.border.right.style);
                    if (cell.border.bottom && cell.border.bottom.style) borders.push('B:' + cell.border.bottom.style);
                    if (cell.border.left && cell.border.left.style) borders.push('L:' + cell.border.left.style);
                    if (borders.length) styleInfo.push('Border:[' + borders.join(',') + ']');
                }
                
                if (cell.alignment && cell.alignment.horizontal) {
                    styleInfo.push('Align:' + cell.alignment.horizontal);
                }
                
                if (cell.numFmt && cell.numFmt !== 'General') {
                    styleInfo.push('NumFmt:' + cell.numFmt);
                }
                
                cellData.push({
                    col: String.fromCharCode(64 + colNum) + colNum,
                    value: value,
                    style: styleInfo.join(', ')
                });
            });
            
            if (hasContent) {
                console.log('\nRow', rowNum + ':');
                cellData.forEach(cd => {
                    const styleStr = cd.style ? ' [' + cd.style + ']' : '';
                    console.log('  ' + cd.col + ': ' + cd.value + styleStr);
                });
            }
        }
        
        const mergedCells = Object.keys(worksheet._merges || {});
        if (mergedCells.length > 0) {
            console.log('\nMerged cells:', mergedCells.length);
            mergedCells.slice(0, 15).forEach(merge => {
                console.log('  ' + merge);
            });
        }
        
        console.log('\nColumn widths (first 20 columns):');
        for (let i = 1; i <= Math.min(20, worksheet.columnCount); i++) {
            const col = worksheet.getColumn(i);
            if (col.width) {
                console.log('  Col', i + ': ' + col.width);
            }
        }
    });
    
    console.log('\n================================================================================');
    console.log('ANALYSIS COMPLETE');
    console.log('================================================================================');
}

analyzeTemplate().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
