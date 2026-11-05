const { pool } = require('../config/db');

async function create(conn, { productId, buyerId, orderItemId, rating, comment }) {
  const runner = conn || pool;
  const [result] = await runner.query(
    `INSERT INTO reviews (product_id, buyer_id, order_item_id, rating, comment)
     VALUES (:productId, :buyerId, :orderItemId, :rating, :comment)`,
    { productId, buyerId, orderItemId, rating, comment: comment || null }
  );
  return result.insertId;
}

async function findByOrderItem(orderItemId) {
  const [rows] = await pool.query('SELECT * FROM reviews WHERE order_item_id = :orderItemId LIMIT 1', { orderItemId });
  return rows[0] || null;
}

async function findByProduct(productId, { page = 1, limit = 10 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT r.*, u.name AS buyer_name
     FROM reviews r JOIN users u ON u.id = r.buyer_id
     WHERE r.product_id = :productId
     ORDER BY r.created_at DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    { productId }
  );
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM reviews WHERE product_id = :productId', { productId });

  return {
    items: rows,
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

async function getProductSummary(productId) {
  const [[row]] = await pool.query(
    'SELECT COUNT(*) AS totalReviews, COALESCE(AVG(rating), 0) AS averageRating FROM reviews WHERE product_id = :productId',
    { productId }
  );
  return {
    totalReviews: Number(row.totalReviews) || 0,
    averageRating: Math.round(Number(row.averageRating) * 10) / 10,
  };
}

/** Bulk rating summary for a set of products — used by search/shop listings to show a star rating on cards without an N+1 query per card. */
async function getSummariesForProducts(productIds) {
  if (!productIds || productIds.length === 0) return {};
  const [rows] = await pool.query(
    `SELECT product_id, COUNT(*) AS totalReviews, COALESCE(AVG(rating), 0) AS averageRating
     FROM reviews WHERE product_id IN (${productIds.map((_, i) => `:id${i}`).join(', ')})
     GROUP BY product_id`,
    Object.fromEntries(productIds.map((id, i) => [`id${i}`, id]))
  );
  const map = {};
  rows.forEach((r) => {
    map[r.product_id] = { totalReviews: Number(r.totalReviews), averageRating: Math.round(Number(r.averageRating) * 10) / 10 };
  });
  return map;
}

async function findByBuyer(buyerId, { page = 1, limit = 10 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT r.*, p.title, p.images
     FROM reviews r JOIN products p ON p.id = r.product_id
     WHERE r.buyer_id = :buyerId
     ORDER BY r.created_at DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    { buyerId }
  );
  rows.forEach((row) => {
    if (typeof row.images === 'string') {
      try { row.images = JSON.parse(row.images); } catch { row.images = []; }
    }
  });
  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM reviews WHERE buyer_id = :buyerId', { buyerId });

  return {
    items: rows,
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

/**
 * Order items this buyer has received (order reached DELIVERED at some
 * point in its history — checked via order_status_history rather than the
 * order's *current* status, so an item stays reviewable even if it later
 * moved on to RETURN_REQUESTED/RETURNED) but hasn't reviewed yet.
 */
async function findPendingReviews(buyerId) {
  const [rows] = await pool.query(
    `SELECT oi.id AS order_item_id, oi.order_id, oi.product_id, oi.unit_price,
            p.title, p.images, o.placed_at
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.buyer_id = :buyerId
       AND EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id AND h.to_status = 'DELIVERED')
       AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_item_id = oi.id)
     ORDER BY o.placed_at DESC`,
    { buyerId }
  );
  rows.forEach((row) => {
    if (typeof row.images === 'string') {
      try { row.images = JSON.parse(row.images); } catch { row.images = []; }
    }
  });
  return rows;
}

async function findBySeller(sellerId, { page = 1, limit = 10 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT r.*, p.title AS product_title, p.images AS product_images, u.name AS buyer_name
     FROM reviews r
     JOIN products p ON p.id = r.product_id
     JOIN users u ON u.id = r.buyer_id
     WHERE p.seller_id = :sellerId
     ORDER BY r.created_at DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    { sellerId }
  );
  rows.forEach((row) => {
    if (typeof row.product_images === 'string') {
      try { row.product_images = JSON.parse(row.product_images); } catch { row.product_images = []; }
    }
  });
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(AVG(r.rating), 0) AS averageRating
     FROM reviews r
     JOIN products p ON p.id = r.product_id
     WHERE p.seller_id = :sellerId`,
    { sellerId }
  );

  return {
    items: rows,
    summary: {
      totalReviews: Number(countRows[0].total) || 0,
      averageRating: Math.round(Number(countRows[0].averageRating) * 10) / 10,
    },
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

module.exports = {
  create, findByOrderItem, findByProduct, getProductSummary, getSummariesForProducts, findByBuyer, findPendingReviews, findBySeller,
};

