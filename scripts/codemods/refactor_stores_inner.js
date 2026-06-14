const { Project, SyntaxKind } = require('ts-morph');

const project = new Project();
project.addSourceFilesAtPaths('/home/olge/SOFT/git/MARS/mars-2.0/src/stores/**/*.ts');

const sourceFiles = project.getSourceFiles();

for (const sourceFile of sourceFiles) {
  let fileModified = false;

  const tryStatements = sourceFile.getDescendantsOfKind(SyntaxKind.TryStatement);
  for (const tryStmt of tryStatements) {
    const catchClause = tryStmt.getCatchClause();
    const finallyBlock = tryStmt.getFinallyBlock();
    
    if (finallyBlock && finallyBlock.getText().includes('loading.value = false')) {
      // Check if loading.value = true is either just before try, or first line inside try
      let hasLoadingTrue = false;
      let prevSiblingToRemove = null;

      const parentBlock = tryStmt.getParentIfKind(SyntaxKind.Block);
      if (parentBlock) {
        const tryIndex = tryStmt.getChildIndex();
        if (tryIndex > 0) {
          const prevSibling = parentBlock.getStatements()[tryIndex - 1];
          if (prevSibling && prevSibling.getText().includes('loading.value = true')) {
            hasLoadingTrue = true;
            prevSiblingToRemove = prevSibling;
          }
        }
      }

      const tryBlock = tryStmt.getTryBlock();
      const firstStmt = tryBlock.getStatements()[0];
      if (firstStmt && firstStmt.getText().includes('loading.value = true')) {
        hasLoadingTrue = true;
      }

      if (hasLoadingTrue) {
        let tryBody = tryBlock.getText();
        tryBody = tryBody.replace(/^\{/, '').replace(/\}$/, '').trim();
        tryBody = tryBody.replace(/^loading\.value\s*=\s*true;/, '').trim();
        tryBody = tryBody.replace(/^error\.value\s*=\s*null;/, '').trim();

        let fallbackMsg = '"Operation failed"';
        if (catchClause) {
          const catchBody = catchClause.getBlock().getText();
          const match = catchBody.match(/error\.value\s*=\s*(?:err|e)\s*instanceof\s*Error\s*\?\s*(?:err|e)\.message\s*:\s*("[^"]+"|'[^']+'|`[^`]+`)/);
          if (match) {
            fallbackMsg = match[1];
          }
        }

        const replacement = `return await withLoading(loading, error, async () => {\n${tryBody}\n}, ${fallbackMsg});`;

        tryStmt.replaceWithText(replacement);
        if (prevSiblingToRemove) {
          prevSiblingToRemove.remove();
        }
        fileModified = true;
      }
    }
  }

  if (fileModified) {
    const imports = sourceFile.getImportDeclarations();
    const hasImport = imports.some(imp => imp.getModuleSpecifierValue() === '@/utils/storeAction' && imp.getNamedImports().some(ni => ni.getName() === 'withLoading'));
    
    if (sourceFile.getText().includes('withLoading(') && !hasImport) {
      sourceFile.addImportDeclaration({
        namedImports: ['withLoading'],
        moduleSpecifier: '@/utils/storeAction'
      });
    }
    
    sourceFile.saveSync();
    console.log(`Refactored try blocks in ${sourceFile.getBaseName()}`);
  }
}
