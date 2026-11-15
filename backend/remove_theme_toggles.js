const fs = require('fs');

// 1. Remove theme toggle button from market.html
let market = fs.readFileSync('Shopping-Site/frontend/market.html', 'utf8');
market = market.replace(/<!-- Compact Icon Theme Toggle -->[\s\S]*?<\/button>/, '');
fs.writeFileSync('Shopping-Site/frontend/market.html', market, 'utf8');
console.log('Removed theme toggle from market.html');

// 2. Remove segmented switch from shop/shop.html
let shop = fs.readFileSync('Shopping-Site/frontend/shop/shop.html', 'utf8');
shop = shop.replace(/<!-- Segmented Theme Toggle Pill -->[\s\S]*?<\/div>/, '');
fs.writeFileSync('Shopping-Site/frontend/shop/shop.html', shop, 'utf8');
console.log('Removed theme toggle from shop.html');

