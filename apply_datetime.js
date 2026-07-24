const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Update Schemas
      if (fullPath.includes('schema/')) {
        content = content.replace(/createdAt:\s*v\.number\(\)/g, 'createdAt: v.string()')
                         .replace(/updatedAt:\s*v\.number\(\)/g, 'updatedAt: v.string()');
      }
      
      // Update Queries & Mutations (Fixing Date.now() usages for createdAt/updatedAt)
      content = content
        .replace(/createdAt:\s*Date\.now\(\)/g, 'createdAt: new Date().toISOString()')
        .replace(/updatedAt:\s*Date\.now\(\)/g, 'updatedAt: new Date().toISOString()')
        .replace(/b\.createdAt\s*-\s*a\.createdAt/g, 'b.createdAt.localeCompare(a.createdAt)')
        .replace(/a\.createdAt\s*-\s*b\.createdAt/g, 'a.createdAt.localeCompare(b.createdAt)')
        .replace(/b\.updatedAt\s*-\s*a\.updatedAt/g, 'b.updatedAt.localeCompare(a.updatedAt)')
        .replace(/a\.updatedAt\s*-\s*b\.updatedAt/g, 'a.updatedAt.localeCompare(b.updatedAt)')
        .replace(/createdAt:\s*now,/g, 'createdAt: new Date(now).toISOString(),')
        .replace(/updatedAt:\s*now,/g, 'updatedAt: new Date(now).toISOString(),');
      
      if (fs.readFileSync(fullPath, 'utf8') !== content) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'convex'));
