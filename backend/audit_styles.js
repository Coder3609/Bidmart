const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const links = [];
  const regex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(content)) !== null) {
    if (m[1].endsWith('.css')) links.push(m[1]);
  }
  return links;
}

function walk(dir) {
  const res = {};
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') Object.assign(res, walk(full));
    } else if (f.endsWith('.html')) {
      res[full] = checkFile(full);
    }
  }
  return res;
}

const map = walk('./Shopping-Site/frontend');
const oldList = [];
const newList = [];

for (const [p, links] of Object.entries(map)) {
  const rel = p.replace(/\\/g, '/').replace('./Shopping-Site/frontend/', '');
  const hasOldTheme = links.some(l => l.includes('theme.css') && !l.includes('market-hub.css') && !l.includes('shop-dual-theme.css'));
  
  if (hasOldTheme) {
    oldList.push({ file: rel, stylesheets: links });
  } else {
    newList.push({ file: rel, stylesheets: links });
  }
}

console.log('=== PAGES STILL USING OLD STYLESHEET (/shared/theme.css) ===');
oldList.forEach(x => console.log(' [OLD] ' + x.file.padEnd(35) + ' -> ' + x.stylesheets.join(', ')));

console.log('\n=== PAGES ALREADY REDESIGNED (NEW STYLES) ===');
newList.forEach(x => console.log(' [NEW] ' + x.file.padEnd(35) + ' -> ' + x.stylesheets.join(', ')));

process.exit(0);

