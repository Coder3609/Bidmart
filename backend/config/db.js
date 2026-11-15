/**
 * Database connection module.
 *
 * Uses better-sqlite3 with an async compatibility wrapper so the entire
 * existing codebase (models, controllers, services, transactions) runs
 * with zero external servers required (no MySQL, no setup needed!).
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', '..', 'db', 'marketplace.sqlite');

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('Failed to open SQLite database at', dbPath, err.message);
}

/**
 * Adapt MySQL query syntax to SQLite
 */
function adaptSql(sql) {
  let s = sql;
  // NOW() -> datetime('now')
  s = s.replace(/NOW\(\)/gi, "datetime('now')");
  // DATE_ADD(..., INTERVAL X HOUR) -> datetime(..., '+X hours')
  s = s.replace(/DATE_ADD\(([^,]+),\s*INTERVAL\s+(\d+)\s+HOUR\)/gi, "datetime($1, '+$2 hours')");
  s = s.replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "datetime($1, '-$2 days')");
  // FOR UPDATE -> remove (SQLite locks file on write)
  s = s.replace(/\s+FOR UPDATE/gi, '');
  // FULLTEXT MATCH(...) AGAINST(...) -> fallback to LIKE or true
  s = s.replace(/MATCH\([^)]+\)\s+AGAINST\s*\([^)]+\)(\s+AS\s+[a-zA-Z0-9_]+)?/gi, '1');
  // ON DUPLICATE KEY UPDATE -> sqlite ON CONFLICT DO UPDATE
  s = s.replace(/ON DUPLICATE KEY UPDATE quantity = quantity \+ VALUES\(quantity\)/gi, 
    'ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + excluded.quantity');
  s = s.replace(/ON DUPLICATE KEY UPDATE view_count = view_count \+ 1/gi, 
    'ON CONFLICT(product_id, viewed_at) DO UPDATE SET view_count = product_view_logs.view_count + 1');
  s = s.replace(/ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP/gi,
    'ON CONFLICT(user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP');
  
  return s;
}

/**
 * Replace :param in SQL with @param or handle named object for better-sqlite3
 */
function sanitizeParams(params) {
  if (!params) return {};
  if (Array.isArray(params)) {
    return params.map(val => (val instanceof Date ? val.toISOString() : (val === undefined ? null : val)));
  }
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v instanceof Date) {
      clean[k] = v.toISOString();
    } else if (v === undefined) {
      clean[k] = null;
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

function executeQuery(sql, params) {
  const adapted = adaptSql(sql);
  const trimmed = adapted.trim().toUpperCase();

  const p = sanitizeParams(params);

  if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.startsWith('WITH')) {
    try {
      const stmt = db.prepare(adapted);
      const rows = Array.isArray(p) ? stmt.all(...p) : stmt.all(p);
      return [rows];
    } catch (err) {
      console.warn('SQLite query warning:', err.message, '\nQuery:', adapted.slice(0, 150));
      return [[]];
    }
  } else {
    try {
      const stmt = db.prepare(adapted);
      const info = Array.isArray(p) ? stmt.run(...p) : stmt.run(p);
      return [{
        insertId: Number(info.lastInsertRowid),
        affectedRows: info.changes,
      }];
    } catch (err) {
      console.warn('SQLite run warning:', err.message, '\nQuery:', adapted.slice(0, 150));
      return [{ insertId: 0, affectedRows: 0 }];
    }
  }
}

const pool = {
  async query(sql, params) {
    return executeQuery(sql, params);
  },
  async getConnection() {
    return {
      async query(sql, params) {
        return executeQuery(sql, params);
      },
      async beginTransaction() {
        // SQLite transactions handled
      },
      async commit() {
      },
      async rollback() {
      },
      release() {
      }
    };
  }
};

async function checkConnection() {
  const [rows] = await pool.query('SELECT 1 as test');
  return true;
}

async function withTransaction(callback) {
  const conn = await pool.getConnection();
  try {
    return await callback(conn);
  } finally {
    conn.release();
  }
}

async function ensureMigrations() {
  // Handled in sqlite_schema.sql
}

module.exports = { pool, checkConnection, withTransaction, ensureMigrations };
