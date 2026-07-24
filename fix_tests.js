const fs = require('fs');
const file = '/home/olge/SOFT/git/MARS/mars-2.0/convex/announcements/__tests__/lib.spec.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/createdAt: 1000/g, 'createdAt: new Date(1000).toISOString()')
  .replace(/createdAt: 2000/g, 'createdAt: new Date(2000).toISOString()')
  .replace(/createdAt: 3000/g, 'createdAt: new Date(3000).toISOString()')
  .replace(/publishAt: 1000/g, 'publishAt: new Date(1000).toISOString()')
  .replace(/publishAt: 4000/g, 'publishAt: new Date(4000).toISOString()')
  .replace(/expiresAt: 500/g, 'expiresAt: new Date(500).toISOString()')
  .replace(/now: 2500/g, 'now: new Date(2500).toISOString()');
fs.writeFileSync(file, content);
