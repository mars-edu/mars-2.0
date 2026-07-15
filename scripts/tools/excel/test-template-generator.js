/**
 * Test script for excel-template-generator.ts
 * Generates a test workbook to verify template structure
 */

const path = require('path');

async function testGenerator() {
  console.log('Loading generator...');

  // Import the generator (need to use dynamic import for ES modules from TypeScript)
  const { generateWorkbookTemplate } = require('./dist/services/excel-template-generator.js');

  console.log('Generating workbook...');
  const workbook = generateWorkbookTemplate();

  console.log('Workbook created with', workbook.worksheets.length, 'worksheets');
  workbook.eachSheet((sheet, id) => {
    console.log(`  Sheet ${id}: ${sheet.name} - ${sheet.rowCount} rows, ${sheet.columnCount} cols`);
  });

  // Save to file
  const outputPath = path.join(__dirname, 'test-generated-template.xlsx');
  console.log('\nSaving to:', outputPath);
  await workbook.xlsx.writeFile(outputPath);
  console.log('Done! Generated template saved.');

  // Compare with original
  console.log('\nTo compare with original, open both files:');
  console.log('  Original: public/ООД Килаш 2024-2025 форма 1-3.xlsx');
  console.log('  Generated:', outputPath);
}

testGenerator().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
