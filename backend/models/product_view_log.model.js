const { pool } = require('../config/db');

/**
 * Tracks a product page-view by upserting a daily aggregate row.
 * Called fire-and-forget from product.controller.js — never throws to the caller.
 *
 * @param {number|string} productId
 */
async function trackView(productId) {
  await pool.query(
    `INSERT INTO product_view_logs (product_id, viewed_at, view_count)
     VALUES (:productId, CURDATE(), 1)
     ON DUPLICATE KEY UPDATE view_count = view_count + 1`,
    { productId }
  );
}

/**
 * Total view count across all time for one product.
 * @param {number} productId
 * @returns {Promise<number>}
 */
async function getTotalViews(productId) {
  const [[row]] = await pool.query(
    'SELECT COALESCE(SUM(view_count), 0) AS total FROM product_view_logs WHERE product_id = :productId',
    { productId }
  );
  return Number(row.total) || 0;
}

/**
 * Aggregate views for all products owned by a seller over a date range.
 * Returns an array of { day: 'YYYY-MM-DD', views: N } for chart rendering.
 *
 * @param {number} sellerId
 * @param {Date}   fromDate  inclusive
 * @param {Date}   toDate    inclusive
 */
async function getSellerViewsByDay(sellerId, fromDate, toDate) {
  const [rows] = await pool.query(
    `SELECT pvl.viewed_at AS day, SUM(pvl.view_count) AS views
     FROM product_view_logs pvl
     JOIN products p ON p.id = pvl.product_id
     WHERE p.seller_id = :sellerId
       AND pvl.viewed_at BETWEEN :fromDate AND :toDate
     GROUP BY pvl.viewed_at
     ORDER BY pvl.viewed_at ASC`,
    {
      sellerId,
      fromDate: fromDate.toISOString().slice(0, 10),
      toDate:   toDate.toISOString().slice(0, 10),
    }
  );
  return rows.map((r) => ({ day: r.day, views: Number(r.views) }));
}

/**
 * Total views across all seller's products.
 * @param {number} sellerId
 * @returns {Promise<number>}
 */
async function getTotalViewsBySeller(sellerId) {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(pvl.view_count), 0) AS total
     FROM product_view_logs pvl
     JOIN products p ON p.id = pvl.product_id
     WHERE p.seller_id = :sellerId`,
    { sellerId }
  );
  return Number(row.total) || 0;
}

/**
 * Views in the last N days for a seller.
 * @param {number} sellerId
 * @param {number} days
 */
async function getRecentViewsBySeller(sellerId, days = 7) {
  const [[row]] = await pool.query(
    `SELECT COALESCE(SUM(pvl.view_count), 0) AS total
     FROM product_view_logs pvl
     JOIN products p ON p.id = pvl.product_id
     WHERE p.seller_id = :sellerId
       AND pvl.viewed_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)`,
    { sellerId, days }
  );
  return Number(row.total) || 0;
}

module.exports = { trackView, getTotalViews, getSellerViewsByDay, getTotalViewsBySeller, getRecentViewsBySeller };
