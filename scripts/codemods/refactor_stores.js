const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project();
project.addSourceFilesAtPaths('/home/olge/SOFT/git/MARS/mars-2.0/src/stores/**/*.ts');

const sourceFiles = project.getSourceFiles();

for (const sourceFile of sourceFiles) {
  let fileModified = false;

  // 1. Remove isLoading and getError computed aliases
  const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  
  for (const varDecl of variableDeclarations) {
    const name = varDecl.getName();
    if (name === 'isLoading' || name === 'getError') {
      const initializer = varDecl.getInitializer();
      if (initializer && initializer.getKind() === SyntaxKind.CallExpression) {
        const expr = initializer.getExpression().getText();
        if (expr === 'computed') {
          const args = initializer.getArguments();
          if (args.length === 1 && args[0].getKind() === SyntaxKind.ArrowFunction) {
            const bodyText = args[0].getBodyText();
            if (bodyText === 'loading.value' || bodyText === 'error.value') {
              varDecl.getVariableStatement().remove();
              fileModified = true;
            }
          }
        }
      }
    }
  }

  // Also remove from return statement in setup stores
  const returnStatements = sourceFile.getDescendantsOfKind(SyntaxKind.ReturnStatement);
  for (const ret of returnStatements) {
    const expr = ret.getExpression();
    if (expr && expr.getKind() === SyntaxKind.ObjectLiteralExpression) {
      for (const prop of expr.getProperties()) {
        if (prop.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
          const propName = prop.getName();
          if (propName === 'isLoading' || propName === 'getError') {
            prop.remove();
            fileModified = true;
          }
        }
      }
    }
  }

  // 2. Refactor try/catch/finally withLoading
  const tryStatements = sourceFile.getDescendantsOfKind(SyntaxKind.TryStatement);
  for (const tryStmt of tryStatements) {
    const parentBlock = tryStmt.getParentIfKind(SyntaxKind.Block);
    if (!parentBlock) continue;

    const tryIndex = tryStmt.getChildIndex();
    if (tryIndex === 0) continue;

    const prevSibling = parentBlock.getStatements()[tryIndex - 1];
    if (prevSibling && prevSibling.getText().includes('loading.value = true')) {
      
      const catchClause = tryStmt.getCatchClause();
      const finallyBlock = tryStmt.getFinallyBlock();
      
      if (finallyBlock && finallyBlock.getText().includes('loading.value = false')) {
        let tryBody = tryStmt.getTryBlock().getText();
        tryBody = tryBody.replace(/^\{/, '').replace(/\}$/, '').trim();
        tryBody = tryBody.replace(/^error\.value\s*=\s*null;/, '').trim();

        let fallbackMsg = '"Operation failed"';
        if (catchClause) {
          const catchBody = catchClause.getBlock().getText();
          const match = catchBody.match(/error\.value\s*=\s*(?:err|e)\s*instanceof\s*Error\s*\?\s*(?:err|e)\.message\s*:\s*("[^"]+"|'[^']+'|`[^`]+`)/);
          if (match) {
            fallbackMsg = match[1];
          }
        }

        // If tryBody doesn't have any 'return', and the try statement is the last in a function block,
        // it's safe to `return await withLoading(...)`. Even if it doesn't return, we can just use `return await`.
        let isReturn = true;
        // Just use return await if it's inside an arrow function or function declaration that returns Promise
        const replacement = `return await withLoading(loading, error, async () => {\n${tryBody}\n}, ${fallbackMsg});`;

        tryStmt.replaceWithText(replacement);
        prevSibling.remove();
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
    console.log(`Refactored ${sourceFile.getBaseName()}`);
  }
}
