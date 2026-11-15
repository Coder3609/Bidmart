const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res = res.concat(walk(full));
    else if (f.endsWith('.html') || f.endsWith('.js')) res.push(full);
  }
  return res;
}

const files = walk('Shopping-Site/frontend');
files.forEach(file => {
  const c = fs.readFileSync(file, 'utf8');
  if (c.includes('"," />') || c.includes('\'" />') || c.includes('," />')) {
    const lines = c.split('\n');
    lines.forEach((l, idx) => {
      if (l.includes('," />') || l.includes('\'" />') || l.includes('"," />')) {
        console.log(`${file}:${idx + 1}: ${l.trim()}`);
      }
    });
  }
});

