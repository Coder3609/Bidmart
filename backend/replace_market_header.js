const fs = require('fs');

let market = fs.readFileSync('Shopping-Site/frontend/market.html', 'utf8');

// Replace the hardcoded <header class="bm-header">...</header> with <div id="site-header"></div>
market = market.replace(/<header class="bm-header">[\s\S]*?<\/header>/, '<div id="site-header"></div>');

// Ensure header.js is included
if (!market.includes('/shared/header.js')) {
  market = market.replace('</body>', '  <script src="/shared/header.js"></script>\n</body>');
}

fs.writeFileSync('Shopping-Site/frontend/market.html', market, 'utf8');
console.log('market.html now uses the single unified site-header!');

