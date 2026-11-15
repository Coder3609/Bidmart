const fs = require('fs');
const path = require('path');
const Database = require('./backend/node_modules/better-sqlite3');

const schemaPath = path.join(__dirname, 'db', 'schema.sql');
let s = fs.readFileSync(schemaPath, 'utf8');

// Transformations for SQLite
s = s.replace(/CREATE DATABASE[\s\S]*?USE marketplace_db;/i, '');
s = s.replace(/SET NAMES utf8mb4;/i, '');
s = s.replace(/SET FOREIGN_KEY_CHECKS\s*=\s*[01];/gi, '');
s = s.replace(/ENGINE=InnoDB[^;]*;/gi, ';');
s = s.replace(/BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
s = s.replace(/INT UNSIGNED AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
s = s.replace(/BIGINT UNSIGNED/gi, 'INTEGER');
s = s.replace(/INT UNSIGNED/gi, 'INTEGER');
s = s.replace(/TINYINT\s*\(1\)/gi, 'INTEGER');
s = s.replace(/TINYINT UNSIGNED/gi, 'INTEGER');
s = s.replace(/ENUM\([^)]+\)/gi, 'TEXT');
s = s.replace(/JSON/gi, 'TEXT');
s = s.replace(/DATETIME/gi, 'TEXT');
s = s.replace(/TIMESTAMP/gi, 'TEXT');
s = s.replace(/DECIMAL\([0-9]+,[0-9]+\)/gi, 'NUMERIC');
s = s.replace(/VARCHAR\([0-9]+\)/gi, 'TEXT');
s = s.replace(/FULLTEXT KEY[^,)]+(,|\n|\))/gi, '$1');
s = s.replace(/UNIQUE KEY [a-zA-Z0-9_]+\s*\(([^)]+)\)/gi, 'UNIQUE ($1)');
s = s.replace(/KEY [a-zA-Z0-9_]+\s*\([^)]+\)(,?)/gi, '');
s = s.replace(/ALTER TABLE auctions[\s\S]*?;/gi, '');
s = s.replace(/,\s*\)/g, '\n)');
s = s.replace(/CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'CURRENT_TIMESTAMP');

const db = new Database(path.join(__dirname, 'db', 'local.sqlite'));
try {
  db.exec(s);
  console.log('Tables created successfully in SQLite!');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Created tables:', tables.map(t => t.name).join(', '));
} catch (e) {
  console.error('Error:', e.message);
}
db.close();

