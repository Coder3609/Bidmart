const { pool } = require('../config/db');

async function findByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM addresses WHERE user_id = :userId ORDER BY is_default DESC, created_at DESC',
    { userId }
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM addresses WHERE id = :id LIMIT 1', { id });
  return rows[0] || null;
}

async function countByUser(userId) {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM addresses WHERE user_id = :userId', { userId });
  return rows[0].total;
}

async function create({ userId, label, fullName, phone, line1, line2, city, state, postalCode, country, isDefault }) {
  const [result] = await pool.query(
    `INSERT INTO addresses (user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
     VALUES (:userId, :label, :fullName, :phone, :line1, :line2, :city, :state, :postalCode, :country, :isDefault)`,
    {
      userId, label: label || null, fullName, phone, line1, line2: line2 || null,
      city, state, postalCode, country: country || 'India', isDefault: isDefault ? 1 : 0,
    }
  );
  return findById(result.insertId);
}

async function remove(id) {
  await pool.query('DELETE FROM addresses WHERE id = :id', { id });
}

module.exports = { findByUser, findById, countByUser, create, remove };
