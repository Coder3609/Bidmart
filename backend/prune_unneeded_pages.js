const fs = require('fs');
const path = require('path');

const keepFiles = new Set([
  path.resolve('Shopping-Site/frontend/index.html'),
  path.resolve('Shopping-Site/frontend/market.html'),
  path.resolve('Shopping-Site/frontend/auth/login.html'),
  path.resolve('Shopping-Site/frontend/auth/register.html'),
  path.resolve('Shopping-Site/frontend/shop/shop.html'),
  path.resolve('Shopping-Site/frontend/shop/product.html'),
  path.resolve('Shopping-Site/frontend/shop/cart.html'),
  path.resolve('Shopping-Site/frontend/shop/checkout.html'),
  path.resolve('Shopping-Site/frontend/auction/guide.html'),
  path.resolve('Shopping-Site/frontend/auction/auctions.html'),
  path.resolve('Shopping-Site/frontend/auction/auction-detail.html')
]);

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res = res.concat(walk(full));
    else if (f.endsWith('.html')) res.push(path.resolve(full));
  }
  return res;
}

const allHtmls = walk('Shopping-Site/frontend');
const removed = [];

allHtmls.forEach(file => {
  if (!keepFiles.has(file)) {
    fs.unlinkSync(file);
    removed.push(path.relative('Shopping-Site/frontend', file));
  }
});

console.log('Removed ' + removed.length + ' previous/unneeded HTML pages:');
removed.forEach(r => console.log(' - ' + r));

