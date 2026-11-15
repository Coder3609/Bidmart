const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove old CSS link tags
  content = content.replace(/<link[^>]+href=["'][^"']*auth-modal\.css["'][^>]*>\r?\n?/gi, '');
  content = content.replace(/<link[^>]+href=["'][^"']*seller-auth-modal\.css["'][^>]*>\r?\n?/gi, '');

  // Add explore-dialog.css if not present
  if (content.includes('</head>') && !content.includes('explore-dialog.css')) {
    content = content.replace('</head>', '  <link rel="stylesheet" href="/shared/explore-dialog.css" />\n</head>');
  }

  // Replace old auth-modal.js script with explore-dialog.js
  content = content.replace(/<script[^>]+src=["'][^"']*auth-modal\.js["'][^>]*><\/script>\r?\n?/gi, '<script src="/shared/explore-dialog.js"></script>\n');
  content = content.replace(/<script[^>]+src=["'][^"']*seller-auth-modal\.js["'][^>]*><\/script>\r?\n?/gi, '');

  // Replace window.buyerAuth invocations with window.bmExploreModal
  content = content.replace(/window\.buyerAuth\s*&&\s*window\.buyerAuth\.open\([^)]*\)/gi, 'window.bmExploreModal && window.bmExploreModal.open()');
  content = content.replace(/window\.buyerAuth\.open\([^)]*\)/gi, 'window.bmExploreModal.open()');
  content = content.replace(/window\.buyerAuth/g, 'window.bmExploreModal');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') walkDir(full);
    } else if (file.endsWith('.html') || file.endsWith('.js')) {
      replaceInFile(full);
    }
  }
}

walkDir('./Shopping-Site/frontend');
console.log('Finished sweeping entire frontend directory.');
process.exit(0);

