const { pool } = require('../config/db');

// store_name added for SELLER accounts (Migration 001). Falls back to name when NULL.
const PUBLIC_FIELDS = 'id, name, store_name, email, phone, role, status, created_at, updated_at';

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT id, name, store_name, email, password_hash, phone, role, status, created_at, updated_at
     FROM users WHERE email = :email LIMIT 1`,
    { email }
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

async function emailExists(email) {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = :email LIMIT 1', { email });
  return rows.length > 0;
}

async function create({ name, email, passwordHash, phone, role }) {
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, phone, role, status)
     VALUES (:name, :email, :passwordHash, :phone, :role, 'ACTIVE')`,
    { name, email, passwordHash, phone: phone || null, role }
  );
  return findById(result.insertId);
}

async function findAdminIds() {
  const [rows] = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'`);
  return rows.map((r) => r.id);
}

/**
 * Updates safe profile fields for the currently logged-in user.
 * Only allows: name, phone, store_name (sellers).
 * Password changes are intentionally NOT handled here (separate flow needed).
 */
async function updateProfile(id, fields) {
  const allowed = ['name', 'phone', 'store_name'];
  const setClauses = [];
  const params = { id };
  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key) || value === undefined) continue;
    setClauses.push(`${key} = :${key}`);
    params[key] = value === '' ? null : value;
  }
  if (setClauses.length === 0) return findById(id);
  await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = :id`, params);
  return findById(id);
}

module.exports = { findByEmail, findById, emailExists, create, findAdminIds, updateProfile, PUBLIC_FIELDS };
