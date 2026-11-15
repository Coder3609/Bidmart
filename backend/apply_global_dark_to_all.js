const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res = res.concat(walk(full));
    else if (f.endsWith('.html')) res.push(full);
  }
  return res;
}

const htmlFiles = walk('Shopping-Site/frontend');
let updatedCount = 0;

htmlFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Ensure global-dark.css is linked in the <head>
  if (!content.includes('global-dark.css')) {
    if (content.includes('</head>')) {
      content = content.replace('</head>', '  <link rel="stylesheet" href="/shared/global-dark.css" />\n</head>');
      changed = true;
    }
  }

  // 2. Ensure checkout-modal is linked on pages that could use checkout or shop
  if (filePath.includes('shop') || filePath.includes('market') || filePath.includes('auction')) {
    if (!content.includes('checkout-modal.css') && content.includes('</head>')) {
      content = content.replace('</head>', '  <link rel="stylesheet" href="/shared/checkout-modal.css" />\n</head>');
      changed = true;
    }
    if (!content.includes('checkout-modal.js') && content.includes('</body>')) {
      content = content.replace('</body>', '  <script src="/shared/checkout-modal.js"></script>\n</body>');
      changed = true;
    }
  }

  // 3. Purge any lingering references to old modal styles or obsolete scripts
  if (content.includes('auth-modal.js') || content.includes('auth-modal.css') || content.includes('seller-auth-modal')) {
    content = content.replace(/<link[^>]*auth-modal[^>]*>\s*/gi, '');
    content = content.replace(/<script[^>]*auth-modal[^>]*><\/script>\s*/gi, '');
    content = content.replace(/<link[^>]*seller-auth-modal[^>]*>\s*/gi, '');
    content = content.replace(/<script[^>]*seller-auth-modal[^>]*><\/script>\s*/gi, '');
    changed = true;
  }

  // 4. Clean any legacy inline styles on body like background-color:var(--sc-bg) or light bg
  if (content.includes('style="background-color:var(--sc-bg)')) {
    content = content.replace(/style="background-color:var\(--sc-bg\);?margin:0;?"/gi, 'style="background-color:#080B11;margin:0;"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log('Updated:', filePath);
  }
});

console.log(`Global update completed: ${updatedCount} HTML pages updated.`);

