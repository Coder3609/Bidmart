const fs = require('fs');
const path = require('path');

const target = path.resolve('Shopping-Site/frontend/shop/product.html');
let c = fs.readFileSync(target, 'utf8');
c = c.replace(/<script src="\/shared\/footer\.js"><\/script>/, '<script src="/shared/footer.js"></script>\n  <script src="/shared/explore-dialog.js"></script>');
fs.writeFileSync(target, c, 'utf8');
console.log('Successfully linked explore-dialog.js in product.html');

