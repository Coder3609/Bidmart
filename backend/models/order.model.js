const { pool } = require('../config/db');

async function createOrder(conn, { buyerId, addressId, source, auctionId, status, subtotal, discount, deliveryFee, total }) {
  const [result] = await conn.query(
    `INSERT INTO orders (buyer_id, address_id, source, auction_id, status, subtotal, discount, delivery_fee, total)
     VALUES (:buyerId, :addressId, :source, :auctionId, :status, :subtotal, :discount, :deliveryFee, :total)`,
    {
      buyerId, addressId, source, auctionId: auctionId || null, status,
      subtotal, discount: discount || 0, deliveryFee: deliveryFee || 0, total,
    }
  );
  return result.insertId;
}

async function createOrderItem(conn, { orderId, productId, sellerId, quantity, unitPrice }) {
  await conn.query(
    `INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, line_total)
     VALUES (:orderId, :productId, :sellerId, :quantity, :unitPrice, :lineTotal)`,
    { orderId, productId, sellerId, quantity, unitPrice, lineTotal: quantity * unitPrice }
  );
}

async function createStatusHistory(conn, { orderId, fromStatus, toStatus, changedBy, note }) {
  await conn.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
     VALUES (:orderId, :fromStatus, :toStatus, :changedBy, :note)`,
    { orderId, fromStatus: fromStatus || null, toStatus, changedBy: changedBy || null, note: note || null }
  );
}

async function updateStatus(conn, orderId, status) {
  await conn.query('UPDATE orders SET status = :status WHERE id = :orderId', { status, orderId });
}

const ORDER_SELECT = `
  SELECT o.*, a.full_name, a.phone AS address_phone, a.line1, a.line2, a.city, a.state, a.postal_code, a.country
  FROM orders o
  JOIN addresses a ON a.id = o.address_id
`;

async function findById(id) {
  const [rows] = await pool.query(`${ORDER_SELECT} WHERE o.id = :id LIMIT 1`, { id });
  return rows[0] || null;
}

async function findByIdForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM orders WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

async function findItemsByOrder(orderId) {
  const [rows] = await pool.query(
    `SELECT oi.*, p.title, p.images
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = :orderId`,
    { orderId }
  );
  return rows.map((row) => {
    if (typeof row.images === 'string') {
      try { row.images = JSON.parse(row.images); } catch { row.images = []; }
    }
    return row;
  });
}

async function findStatusHistory(orderId) {
  const [rows] = await pool.query(
    'SELECT * FROM order_status_history WHERE order_id = :orderId ORDER BY created_at ASC',
    { orderId }
  );
  return rows;
}

async function findByBuyer(buyerId, { page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `${ORDER_SELECT} WHERE o.buyer_id = :buyerId ORDER BY o.placed_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
    { buyerId }
  );
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM orders WHERE buyer_id = :buyerId', { buyerId });

  return {
    items: rows,
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

/** Orders that contain at least one item sold by this seller. */
async function findBySeller(sellerId, { page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `${ORDER_SELECT}
     WHERE o.id IN (SELECT DISTINCT order_id FROM order_items WHERE seller_id = :sellerId)
     ORDER BY o.placed_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
    { sellerId }
  );
  const [countRows] = await pool.query(
    'SELECT COUNT(DISTINCT order_id) AS total FROM order_items WHERE seller_id = :sellerId',
    { sellerId }
  );

  return {
    items: rows,
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

module.exports = {
  createOrder,
  createOrderItem,
  createStatusHistory,
  updateStatus,
  findById,
  findByIdForUpdate,
  findItemsByOrder,
  findStatusHistory,
  findByBuyer,
  findBySeller,
};
