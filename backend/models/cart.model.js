const { pool } = require('../config/db');

async function findByUser(userId) {
  const [rows] = await pool.query(
    `SELECT
       ci.id, ci.product_id, ci.quantity, ci.created_at,
       p.title, p.price, p.images, p.status AS product_status,
       i.available_qty
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE ci.user_id = :userId
     ORDER BY ci.created_at DESC`,
    { userId }
  );
  return rows.map((row) => {
    if (typeof row.images === 'string') {
      try { row.images = JSON.parse(row.images); } catch { row.images = []; }
    }
    return row;
  });
}

async function findItem(userId, productId) {
  const [rows] = await pool.query(
    'SELECT * FROM cart_items WHERE user_id = :userId AND product_id = :productId LIMIT 1',
    { userId, productId }
  );
  return rows[0] || null;
}

async function upsertQuantity(userId, productId, quantityToAdd) {
  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES (:userId, :productId, :quantity)
     ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    { userId, productId, quantity: quantityToAdd }
  );
}

async function setQuantity(userId, productId, quantity) {
  await pool.query(
    'UPDATE cart_items SET quantity = :quantity WHERE user_id = :userId AND product_id = :productId',
    { userId, productId, quantity }
  );
}

async function removeItem(userId, productId) {
  await pool.query(
    'DELETE FROM cart_items WHERE user_id = :userId AND product_id = :productId',
    { userId, productId }
  );
}

async function clear(conn, userId) {
  const runner = conn || pool;
  await runner.query('DELETE FROM cart_items WHERE user_id = :userId', { userId });
}

module.exports = { findByUser, findItem, upsertQuantity, setQuantity, removeItem, clear };
