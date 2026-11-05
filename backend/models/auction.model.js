const { pool } = require('../config/db');

const BASE_SELECT = `
  SELECT
    au.id, au.product_id, au.starting_price, au.reserve_price, au.bid_increment,
    au.current_price, au.status, au.starts_at, au.ends_at, au.closed_at,
    au.winning_bid_id, au.created_at, au.updated_at,
    p.title, p.images, p.description, p.brand, p.\`condition\`, p.status AS product_status,
    p.seller_id, u.name AS seller_name,
    c.name AS category_name,
    (SELECT COUNT(*) FROM bids b WHERE b.auction_id = au.id) AS bid_count
  FROM auctions au
  JOIN products p ON p.id = au.product_id
  JOIN users u ON u.id = p.seller_id
  JOIN categories c ON c.id = p.category_id
`;

function parseImages(row) {
  if (!row) return row;
  if (typeof row.images === 'string') {
    try { row.images = JSON.parse(row.images); } catch { row.images = []; }
  }
  return row;
}

async function create(conn, { productId, startingPrice, reservePrice, bidIncrement, startsAt, endsAt, status }) {
  const runner = conn || pool;
  const [result] = await runner.query(
    `INSERT INTO auctions (product_id, starting_price, reserve_price, bid_increment, current_price, status, starts_at, ends_at)
     VALUES (:productId, :startingPrice, :reservePrice, :bidIncrement, :startingPrice, :status, :startsAt, :endsAt)`,
    {
      productId,
      startingPrice,
      reservePrice: reservePrice || null,
      bidIncrement,
      status,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    }
  );
  return result.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE au.id = :id LIMIT 1`, { id });
  return parseImages(rows[0] || null);
}

async function findByIdForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM auctions WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

/** SCHEDULED or OPEN auction currently tied to a product (there should only ever be one at a time). */
async function findActiveByProduct(productId) {
  const [rows] = await pool.query(
    `SELECT * FROM auctions WHERE product_id = :productId AND status IN ('SCHEDULED', 'OPEN') LIMIT 1`,
    { productId }
  );
  return rows[0] || null;
}

/** Most recent auction (any status) for a product — used to find the CLOSED one when relisting/returning to shop. */
async function findLatestByProduct(productId) {
  const [rows] = await pool.query(
    `SELECT * FROM auctions WHERE product_id = :productId ORDER BY created_at DESC LIMIT 1`,
    { productId }
  );
  return rows[0] || null;
}

async function findByAuctionIdRaw(conn, id) {
  const runner = conn || pool;
  const [rows] = await runner.query('SELECT * FROM auctions WHERE id = :id LIMIT 1', { id });
  return rows[0] || null;
}

async function updateStatus(conn, id, fields) {
  const runner = conn || pool;
  const allowed = ['status', 'current_price', 'closed_at', 'winning_bid_id'];
  const sets = [];
  const params = { id };
  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key)) continue;
    sets.push(`${key} = :${key}`);
    params[key] = value;
  }
  if (!sets.length) return;
  await runner.query(`UPDATE auctions SET ${sets.join(', ')} WHERE id = :id`, params);
}

async function list({
  status = null,
  page = 1,
  limit = 12,
  sort = 'ending_soon',
  q = null,
  categoryId = null,
  sellerId = null,
  minBid = null,
  maxBid = null,
  condition = null,
  endingSoon = false,
  startingSoon = false,
}) {
  const conditions = [];
  const params = {};

  if (status === 'LIVE') {
    conditions.push(`au.status = 'OPEN'`);
  } else if (status === 'SCHEDULED') {
    conditions.push(`au.status = 'SCHEDULED'`);
  } else if (status === 'CLOSED') {
    conditions.push(`au.status = 'CLOSED'`);
  } else {
    // 'ALL' (or unspecified): every auction that's meaningful to show publicly
    conditions.push(`au.status IN ('SCHEDULED', 'OPEN', 'CLOSED')`);
  }

  if (q) {
    conditions.push('(MATCH(p.title, p.description, p.brand) AGAINST (:q IN NATURAL LANGUAGE MODE) OR p.title LIKE :qLike)');
    params.q = q;
    params.qLike = `%${q}%`;
  }
  if (categoryId) {
    conditions.push('p.category_id = :categoryId');
    params.categoryId = categoryId;
  }
  if (sellerId) {
    conditions.push('p.seller_id = :sellerId');
    params.sellerId = sellerId;
  }
  if (minBid !== null && minBid !== undefined && minBid !== '') {
    conditions.push('au.current_price >= :minBid');
    params.minBid = minBid;
  }
  if (maxBid !== null && maxBid !== undefined && maxBid !== '') {
    conditions.push('au.current_price <= :maxBid');
    params.maxBid = maxBid;
  }
  if (condition) {
    conditions.push('p.`condition` = :condition');
    params.condition = condition;
  }
  if (endingSoon) {
    conditions.push(`au.status = 'OPEN' AND au.ends_at <= DATE_ADD(NOW(), INTERVAL 24 HOUR)`);
  }
  if (startingSoon) {
    conditions.push(`au.status = 'SCHEDULED' AND au.starts_at <= DATE_ADD(NOW(), INTERVAL 24 HOUR)`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let orderBy = "au.status = 'OPEN' DESC, au.ends_at ASC"; // default: ending soonest
  if (sort === 'newest') orderBy = 'au.created_at DESC';
  else if (sort === 'bid_asc') orderBy = 'au.current_price ASC';
  else if (sort === 'bid_desc') orderBy = 'au.current_price DESC';
  else if (sort === 'most_bids') {
    orderBy = '(SELECT COUNT(*) FROM bids b WHERE b.auction_id = au.id) DESC';
  }

  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereClause} ORDER BY ${orderBy} LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM auctions au
     JOIN products p ON p.id = au.product_id
     ${whereClause}`,
    params
  );

  return {
    items: rows.map(parseImages),
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

async function listBySeller(sellerId, { page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `${BASE_SELECT} WHERE p.seller_id = :sellerId ORDER BY au.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
    { sellerId }
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM auctions au JOIN products p ON p.id = au.product_id WHERE p.seller_id = :sellerId`,
    { sellerId }
  );

  return {
    items: rows.map(parseImages),
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

/** Auctions due to open (SCHEDULED, starts_at has arrived). */
async function listDueToOpen() {
  const [rows] = await pool.query(
    `SELECT id FROM auctions WHERE status = 'SCHEDULED' AND starts_at <= NOW()`
  );
  return rows.map((r) => r.id);
}

/** Auctions due to close (OPEN, ends_at has passed). */
async function listDueToClose() {
  const [rows] = await pool.query(
    `SELECT id FROM auctions WHERE status = 'OPEN' AND ends_at <= NOW()`
  );
  return rows.map((r) => r.id);
}

module.exports = {
  create,
  findById,
  findByIdForUpdate,
  findActiveByProduct,
  findLatestByProduct,
  findByAuctionIdRaw,
  updateStatus,
  list,
  listBySeller,
  listDueToOpen,
  listDueToClose,
};
