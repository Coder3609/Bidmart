const { pool } = require('../config/db');

async function create(conn, { productId, availableQty }) {
  const runner = conn || pool;
  await runner.query(
    `INSERT INTO inventory (product_id, available_qty, reserved_qty, sold_qty)
     VALUES (:productId, :availableQty, 0, 0)`,
    { productId, availableQty }
  );
}

async function findByProductId(productId) {
  const [rows] = await pool.query('SELECT * FROM inventory WHERE product_id = :productId LIMIT 1', { productId });
  return rows[0] || null;
}

async function setAvailableQty(conn, productId, availableQty) {
  const runner = conn || pool;
  await runner.query(
    'UPDATE inventory SET available_qty = :availableQty WHERE product_id = :productId',
    { availableQty, productId }
  );
}

module.exports = { create, findByProductId, setAvailableQty };
