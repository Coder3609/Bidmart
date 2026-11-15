const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res = res.concat(walk(full));
    else if (f.endsWith('.html')) res.push(path.resolve(full));
  }
  return res;
}

const htmlFiles = walk('Shopping-Site/frontend');
htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('navbar-obsidian.css')) {
    if (content.includes('</head>')) {
      content = content.replace('</head>', '  <link rel="stylesheet" href="/shared/navbar-obsidian.css" />\n</head>');
      fs.writeFileSync(file, content, 'utf8');
      console.log('Linked navbar-obsidian.css in', path.relative('Shopping-Site/frontend', file));
    }
  }
});

