const fs = require('fs');
const path = require('path');
const Database = require('./backend/node_modules/better-sqlite3');

const db = new Database(path.join(__dirname, 'db', 'marketplace.sqlite'));

const seedPath = path.join(__dirname, 'db', 'seed.sql');
let seed = fs.readFileSync(seedPath, 'utf8');

// Replace JSON_ARRAY
seed = seed.replace(/JSON_ARRAY\(([^)]*)\)/gi, (match, p1) => {
  const items = p1.split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
  return `'` + JSON.stringify(items).replace(/'/g, "''") + `'`;
});

seed = seed.replace(/USE\s+[a-zA-Z0-9_]+;/gi, '');
seed = seed.replace(/SET\s+FOREIGN_KEY_CHECKS\s*=\s*[01];/gi, '');
seed = seed.replace(/ON DUPLICATE KEY UPDATE[^;]+;/gi, ';');
seed = seed.replace(/`condition`/gi, 'condition');

// Split cleanly into statements
const lines = seed.split(/\r?\n/);
let current = '';
let count = 0;
let errors = 0;

for (let line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('--')) continue;
  current += ' ' + line;
  if (trimmed.endsWith(';')) {
    try {
      db.exec(current);
      count++;
    } catch (e) {
      errors++;
      if (errors <= 3) {
        console.error('Error on:', current.slice(0, 100), e.message);
      }
    }
    current = '';
  }
}

console.log('Executed', count, 'statements. Errors:', errors);
const userCount = db.prepare('SELECT count(*) as c FROM users').get().c;
const productCount = db.prepare('SELECT count(*) as c FROM products').get().c;
const catCount = db.prepare('SELECT count(*) as c FROM categories').get().c;
console.log(`Loaded: ${userCount} users, ${catCount} categories, ${productCount} products.`);
db.close();
