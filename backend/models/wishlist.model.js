const { pool } = require('../config/db');

async function findByUser(userId) {
  const [rows] = await pool.query(
    `SELECT
       w.id, w.product_id, w.created_at,
       p.title, p.price, p.images, p.status AS product_status
     FROM wishlist_items w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = :userId
     ORDER BY w.created_at DESC`,
    { userId }
  );
  return rows.map((row) => {
    if (typeof row.images === 'string') {
      try { row.images = JSON.parse(row.images); } catch { row.images = []; }
    }
    return row;
  });
}

async function add(userId, productId) {
  await pool.query(
    'INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (:userId, :productId)',
    { userId, productId }
  );
}

async function remove(userId, productId) {
  await pool.query(
    'DELETE FROM wishlist_items WHERE user_id = :userId AND product_id = :productId',
    { userId, productId }
  );
}

module.exports = { findByUser, add, remove };
