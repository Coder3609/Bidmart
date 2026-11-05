const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query(
    `SELECT id, parent_id, name, slug FROM categories ORDER BY parent_id IS NULL DESC, name ASC`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT id, parent_id, name, slug FROM categories WHERE id = :id LIMIT 1', { id });
  return rows[0] || null;
}

module.exports = { findAll, findById };
