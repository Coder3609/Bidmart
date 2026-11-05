const { pool } = require('../config/db');

function parseImages(row) {
  if (row && typeof row.images === 'string') {
    try { row.images = JSON.parse(row.images); } catch { row.images = []; }
  }
  return row;
}

const BASE_SELECT = `
  SELECT rr.*, oi.order_id, oi.product_id, oi.seller_id, oi.unit_price,
         p.title, p.images, o.buyer_id, o.status AS order_status,
         ub.name AS buyer_name, us.name AS seller_name
  FROM return_requests rr
  JOIN order_items oi ON oi.id = rr.order_item_id
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  JOIN users ub ON ub.id = o.buyer_id
  JOIN users us ON us.id = oi.seller_id
`;

async function create(conn, { orderItemId, buyerId, reason }) {
  const runner = conn || pool;
  const [result] = await runner.query(
    `INSERT INTO return_requests (order_item_id, buyer_id, reason, status) VALUES (:orderItemId, :buyerId, :reason, 'REQUESTED')`,
    { orderItemId, buyerId, reason }
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE rr.id = :id LIMIT 1`, { id });
  return parseImages(rows[0] || null);
}

async function findByIdForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM return_requests WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

/** An active (not yet rejected/refunded) return request already exists for this order item. */
async function findActiveByOrderItem(orderItemId) {
  const [rows] = await pool.query(
    `SELECT * FROM return_requests WHERE order_item_id = :orderItemId AND status NOT IN ('REJECTED', 'REFUNDED') LIMIT 1`,
    { orderItemId }
  );
  return rows[0] || null;
}

async function updateStatus(conn, id, status) {
  const runner = conn || pool;
  await runner.query('UPDATE return_requests SET status = :status WHERE id = :id', { status, id });
}

async function listByBuyer(buyerId, { page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE rr.buyer_id = :buyerId ORDER BY rr.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
    { buyerId }
  );
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM return_requests WHERE buyer_id = :buyerId', { buyerId });

  return {
    items: rows.map(parseImages),
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

async function listBySeller(sellerId, { page = 1, limit = 20, status = null } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const params = { sellerId };
  const statusClause = status ? 'AND rr.status = :status' : '';
  if (status) params.status = status;

  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE oi.seller_id = :sellerId ${statusClause} ORDER BY rr.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM return_requests rr JOIN order_items oi ON oi.id = rr.order_item_id WHERE oi.seller_id = :sellerId ${statusClause}`,
    params
  );

  return {
    items: rows.map(parseImages),
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

async function listAll({ page = 1, limit = 20, status = null } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;
  const params = {};
  const statusClause = status ? 'WHERE rr.status = :status' : '';
  if (status) params.status = status;

  const [rows] = await pool.query(
    `${BASE_SELECT} ${statusClause} ORDER BY rr.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM return_requests rr ${statusClause}`, params);

  return {
    items: rows.map(parseImages),
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

async function countPendingBySeller(sellerId) {
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS count FROM return_requests rr JOIN order_items oi ON oi.id = rr.order_item_id
     WHERE oi.seller_id = :sellerId AND rr.status IN ('REQUESTED', 'APPROVED')`,
    { sellerId }
  );
  return Number(row.count) || 0;
}

module.exports = {
  create, findById, findByIdForUpdate, findActiveByOrderItem, updateStatus,
  listByBuyer, listBySeller, listAll, countPendingBySeller,
};
