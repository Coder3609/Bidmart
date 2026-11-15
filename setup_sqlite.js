const fs = require('fs');
const path = require('path');
const Database = require('./backend/node_modules/better-sqlite3');

const dbPath = path.join(__dirname, 'db', 'marketplace.sqlite');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);
const schema = fs.readFileSync(path.join(__dirname, 'db', 'sqlite_schema.sql'), 'utf8');
db.exec(schema);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables created (' + tables.length + '): ' + tables.map(t => t.name).join(', '));
db.close();

