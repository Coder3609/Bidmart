const fs = require('fs');
const path = 'frontend/auction/auction-detail.html';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'renderSellerHeader();',
  'if (typeof renderHeader === "function") renderHeader();'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced renderSellerHeader with renderHeader() in auction-detail.html');

