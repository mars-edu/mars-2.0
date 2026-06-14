const fs = require('fs');
const path = require('path');

const files = [
  'AddCabinetButton.vue',
  'EditCabinetButton.vue',
  'AddTeacherButton.vue',
  'EditTeacherButton.vue',
  'AddStudentButton.vue',
  'EditStudentButton.vue'
];

files.forEach(file => {
  const filePath = path.join('/home/olge/SOFT/git/MARS/mars-2.0/src/components', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import
  if (!content.includes('useFormValidation')) {
    content = content.replace(
      /import \{ ref.*?\} from "vue";/,
      match => match + '\nimport { useFormValidation } from "@/composables/useFormValidation";'
    );
  }
  
  // Replace the validation block
  // We need to match the specific schema safeParse and the 3 computed refs.
  const schemaRegex = /const validationResult = computed\(\(\) => \{\s*return ([a-zA-Z]+Schema)\.safeParse\(([\s\S]*?)\);\s*\}\);\s*const formError = computed\(\(\) => \{\s*if \(validationResult\.value\.success\) return "";\s*const issues = validationResult\.value\.error\.issues;\s*if \(issues\.length > 0\) return issues\[0\]\.message;\s*return "";\s*\}\);\s*const isFormValid = computed\(\(\) => validationResult\.value\.success\);/m;
  
  const match = content.match(schemaRegex);
  if (match) {
    const schemaName = match[1];
    const objectBody = match[2].trim();
    
    const replacement = `const { formError, isFormValid } = useFormValidation(${schemaName}, () => (${objectBody}));`;
    content = content.replace(schemaRegex, replacement);
    
    fs.writeFileSync(filePath, content);
    console.log('Refactored ' + file);
  } else {
    console.log('Regex did not match in ' + file);
  }
});
