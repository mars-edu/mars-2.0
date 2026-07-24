const fs = require('fs');
const path = require('path');
const glob = require('glob');

const convexDir = path.join(__dirname, 'convex');
const files = glob.sync('**/*.ts', { cwd: convexDir, absolute: true, ignore: ['**/_generated/**', 'functions.ts', 'migrations/**'] });

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Replace imports from _generated/server
  // Some might be import { mutation } from "./_generated/server"
  // Or import { query, mutation } from "../_generated/server"
  const importRegex = /from\s+["'](.*)_generated\/server["']/g;
  content = content.replace(importRegex, (match, prefix) => {
    changed = true;
    return `from "${prefix}functions"`;
  });

  // 2. Remove manual createdAt lines
  const createdAtRegex = /\bcreatedAt\s*:\s*(?:new Date\([^)]*\)\.toISOString\(\)|[a-zA-Z0-9_]+\.createdAt|args\.createdAt|now|new Date\(\)\.toISOString\(\)),?\s*\n?/g;
  if (createdAtRegex.test(content)) {
    content = content.replace(createdAtRegex, '');
    changed = true;
  }

  // 3. Remove manual updatedAt lines
  const updatedAtRegex = /\bupdatedAt\s*:\s*(?:new Date\([^)]*\)\.toISOString\(\)|[a-zA-Z0-9_]+\.updatedAt|args\.updatedAt|now|new Date\(\)\.toISOString\(\)),?\s*\n?/g;
  if (updatedAtRegex.test(content)) {
    content = content.replace(updatedAtRegex, '');
    changed = true;
  }

  // 4. Remove createTimestamps() / updateTimestamp() calls
  const createRegex = /\.\.\.createTimestamps\(\),?\s*\n?/g;
  if (createRegex.test(content)) {
    content = content.replace(createRegex, '');
    changed = true;
  }
  const updateRegex = /\.\.\.updateTimestamp\(\),?\s*\n?/g;
  if (updateRegex.test(content)) {
    content = content.replace(updateRegex, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Refactored ${file}`);
  }
}
