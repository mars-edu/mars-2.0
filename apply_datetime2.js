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
      
      let newContent = content
        .replace(/createdAt:\s*v\.number\(\)/g, 'createdAt: v.string()')
        .replace(/updatedAt:\s*v\.number\(\)/g, 'updatedAt: v.string()')
        .replace(/publishAt:\s*v\.number\(\)/g, 'publishAt: v.string()') // maybe needed for announcements
        .replace(/expiresAt:\s*v\.number\(\)/g, 'expiresAt: v.string()');
      
      if (fs.readFileSync(fullPath, 'utf8') !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'convex'));
