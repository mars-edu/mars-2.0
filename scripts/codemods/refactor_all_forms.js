const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.vue') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  const schemaRegex = /const validationResult = computed\(\(\) => \{\s*return ([a-zA-Z]+Schema)\.safeParse\(([\s\S]*?)\);\s*\}\);\s*(?:const formError = computed\(\(\) => \{\s*if \(validationResult\.value\.success\) return "";\s*const issues = validationResult\.value\.error\.issues;\s*if \(issues\.length > 0\) return issues\[0\]\.message;\s*return "";\s*\}\);|const formError = computed\(\(\) => \{\s*if \(validationResult\.value\.success\) return "";\s*const issues = validationResult\.value\.error\.issues;\s*if \(issues\.length > 0\) return issues\[0\]\.message;\s*return "";\s*\}\);)\s*const isFormValid = computed\(\(\) => validationResult\.value\.success\);/gm;

  // Let's use a more flexible regex
  const flexibleRegex = /const validationResult\s*=\s*computed\(\(\)\s*=>\s*\{\s*return\s*([a-zA-Z0-9_]+)\.safeParse\(([\s\S]*?)\);\s*\}\);[\s\S]*?const formError\s*=\s*computed\(\(\)\s*=>\s*\{[\s\S]*?return "";\s*\}\);[\s\S]*?const isFormValid\s*=\s*computed\(\(\)\s*=>\s*validationResult\.value\.success\);/m;

  const match = content.match(flexibleRegex);
  if (match) {
    const schemaName = match[1];
    let objectBody = match[2].trim();
    
    // Check if the body starts with { and ends with } (which means it's an object literal without wrapping parens)
    if (objectBody.startsWith('{') && objectBody.endsWith('}')) {
      objectBody = `(${objectBody})`;
    } else if (!objectBody.startsWith('(')) {
      // it might be a single variable, leave it as is or wrap in ()
    } else {
      // if it's already wrapped like ({...}), leave it
    }
    
    const replacement = `const { formError, isFormValid } = useFormValidation(${schemaName}, () => ${objectBody});`;
    content = content.replace(flexibleRegex, replacement);
    
    // Add import
    if (!content.includes('useFormValidation')) {
      content = content.replace(
        /import \{.*?\} from "vue";/,
        match => match + '\nimport { useFormValidation } from "@/composables/useFormValidation";'
      );
    }
    
    fs.writeFileSync(filePath, content);
    console.log('Refactored ' + path.basename(filePath));
  }
}

processDir('/home/olge/SOFT/git/MARS/mars-2.0/src/components');
