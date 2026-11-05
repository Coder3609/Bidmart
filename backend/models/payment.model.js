const { pool } = require('../config/db');

async function create(conn, { orderId, method, amount, status, providerRef }) {
  const runner = conn || pool;
  const [result] = await runner.query(
    `INSERT INTO payments (order_id, method, provider_ref, amount, status)
     VALUES (:orderId, :method, :providerRef, :amount, :status)`,
    { orderId, method, providerRef: providerRef || null, amount, status }
  );
  return result.insertId;
}

async function findByOrder(orderId) {
  const [rows] = await pool.query('SELECT * FROM payments WHERE order_id = :orderId', { orderId });
  return rows;
}

module.exports = { create, findByOrder };
