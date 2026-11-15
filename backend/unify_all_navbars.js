const fs = require('fs');

// 1. In auction/auctions.html, replace seller-header with site-header and load header.js
let auc = fs.readFileSync('Shopping-Site/frontend/auction/auctions.html', 'utf8');
auc = auc.replace('<div id="seller-header"></div>', '<div id="site-header"></div>');
auc = auc.replace('<script src="/shared/seller-header.js"></script>', '<script src="/shared/header.js"></script>');
auc = auc.replace('if (typeof renderSellerHeader === \'function\') renderSellerHeader();', 'if (typeof renderHeader === \'function\') renderHeader();');
fs.writeFileSync('Shopping-Site/frontend/auction/auctions.html', auc, 'utf8');
console.log('Unified header in auctions.html');

// 2. In auction/auction-detail.html, replace seller-header with site-header and load header.js
let aucDet = fs.readFileSync('Shopping-Site/frontend/auction/auction-detail.html', 'utf8');
aucDet = aucDet.replace('<div id="seller-header"></div>', '<div id="site-header"></div>');
aucDet = aucDet.replace('<script src="/shared/seller-header.js"></script>', '<script src="/shared/header.js"></script>');
aucDet = aucDet.replace('if (typeof renderSellerHeader === \'function\') renderSellerHeader();', 'if (typeof renderHeader === \'function\') renderHeader();');
fs.writeFileSync('Shopping-Site/frontend/auction/auction-detail.html', aucDet, 'utf8');
console.log('Unified header in auction-detail.html');

// 3. In shop/shop.html, replace custom shop-master-nav with site-header and load header.js
let shop = fs.readFileSync('Shopping-Site/frontend/shop/shop.html', 'utf8');
shop = shop.replace(/<header class="shop-master-nav">[\s\S]*?<\/header>/, '<div id="site-header"></div>');
if (!shop.includes('header.js')) {
  shop = shop.replace('</body>', '  <script src="/shared/header.js"></script>\n</body>');
}
fs.writeFileSync('Shopping-Site/frontend/shop/shop.html', shop, 'utf8');
console.log('Unified header in shop.html');

