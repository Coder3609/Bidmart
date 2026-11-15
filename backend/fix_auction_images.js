const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve('c:/Users/d2424/Desktop/Amit/Shopping-Site/db/marketplace.sqlite'));

db.prepare("UPDATE products SET images = '[\"/assets/products/prod_1.jpg\"]' WHERE id = 5").run();
db.prepare("UPDATE products SET images = '[\"/assets/products/prod_2.jpg\"]' WHERE id = 6").run();
db.prepare("UPDATE products SET images = '[\"/assets/products/prod_3.jpg\"]' WHERE id = 7").run();
db.prepare("UPDATE products SET images = '[\"/assets/products/prod_4.jpg\"]' WHERE id = 8").run();

console.log('Auction product photos mapped cleanly to prod_1..4.jpg!');

