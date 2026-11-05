const { pool } = require('../config/db');

function parseImages(row) {
  if (row && typeof row.images === 'string') {
    try { row.images = JSON.parse(row.images); } catch { row.images = []; }
  }
  return row;
}

/** Turns "wireless mouse" into "+wireless* +mouse*" for FULLTEXT BOOLEAN MODE prefix matching. */
function toBooleanQuery(q) {
  return q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `+${term.replace(/[+\-<>()~*"@]/g, '')}*`)
    .join(' ');
}

const PRODUCT_SORTS = {
  relevance: null, // handled specially — only valid when q is present
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  newest: 'p.created_at DESC',
};

async function searchProducts({
  q, categoryId, minPrice, maxPrice, brand, condition, availability, sort, page, limit,
}) {
  const conditions = [`p.status IN ('ACTIVE_SHOP', 'OUT_OF_STOCK')`];
  const params = {};
  let relevanceSelect = '0 AS relevance';

  if (q && q.trim()) {
    const boolQuery = toBooleanQuery(q);
    relevanceSelect = 'MATCH(p.title, p.description, p.brand) AGAINST (:boolQuery IN BOOLEAN MODE) AS relevance';
    params.boolQuery = boolQuery;
    conditions.push(
      `(MATCH(p.title, p.description, p.brand) AGAINST (:boolQuery IN BOOLEAN MODE)
        OR p.title LIKE :qLike OR p.brand LIKE :qLike OR c.name LIKE :qLike OR u.name LIKE :qLike)`
    );
    params.qLike = `%${q.trim()}%`;
  }
  if (categoryId) {
    conditions.push('p.category_id = :categoryId');
    params.categoryId = categoryId;
  }
  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    conditions.push('p.price >= :minPrice');
    params.minPrice = minPrice;
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    conditions.push('p.price <= :maxPrice');
    params.maxPrice = maxPrice;
  }
  if (brand) {
    conditions.push('p.brand = :brand');
    params.brand = brand;
  }
  if (condition) {
    conditions.push('p.`condition` = :condition');
    params.condition = condition;
  }
  if (availability === 'IN_STOCK') {
    conditions.push('p.status = \'ACTIVE_SHOP\' AND COALESCE(i.available_qty, 0) > 0');
  } else if (availability === 'OUT_OF_STOCK') {
    conditions.push('(p.status = \'OUT_OF_STOCK\' OR COALESCE(i.available_qty, 0) = 0)');
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let orderBy = PRODUCT_SORTS[sort] || null;
  if (!orderBy) {
    orderBy = q && q.trim() ? 'relevance DESC, p.created_at DESC' : 'p.created_at DESC';
  }

  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.brand, p.\`condition\`, p.images, p.price, p.status, p.sku,
            c.name AS category_name, u.name AS seller_name,
            COALESCE(i.available_qty, 0) AS available_qty,
            ${relevanceSelect}
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN users u ON u.id = p.seller_id
     LEFT JOIN inventory i ON i.product_id = p.id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN users u ON u.id = p.seller_id
     LEFT JOIN inventory i ON i.product_id = p.id
     ${whereClause}`,
    params
  );

  return {
    items: rows.map(parseImages),
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

async function searchAuctions({
  q, categoryId, minBid, maxBid, sellerId, condition, endingSoon, minBids, sort, page, limit,
}) {
  const conditions = [`au.status = 'OPEN'`];
  const params = {};
  let relevanceSelect = '0 AS relevance';

  if (q && q.trim()) {
    const boolQuery = toBooleanQuery(q);
    relevanceSelect = 'MATCH(p.title, p.description, p.brand) AGAINST (:boolQuery IN BOOLEAN MODE) AS relevance';
    params.boolQuery = boolQuery;
    conditions.push(
      `(MATCH(p.title, p.description, p.brand) AGAINST (:boolQuery IN BOOLEAN MODE)
        OR p.title LIKE :qLike OR p.brand LIKE :qLike OR c.name LIKE :qLike OR u.name LIKE :qLike)`
    );
    params.qLike = `%${q.trim()}%`;
  }
  if (categoryId) {
    conditions.push('p.category_id = :categoryId');
    params.categoryId = categoryId;
  }
  if (minBid !== undefined && minBid !== null && minBid !== '') {
    conditions.push('au.current_price >= :minBid');
    params.minBid = minBid;
  }
  if (maxBid !== undefined && maxBid !== null && maxBid !== '') {
    conditions.push('au.current_price <= :maxBid');
    params.maxBid = maxBid;
  }
  if (sellerId) {
    conditions.push('p.seller_id = :sellerId');
    params.sellerId = sellerId;
  }
  if (condition) {
    conditions.push('p.`condition` = :condition');
    params.condition = condition;
  }
  if (endingSoon === 'true' || endingSoon === true) {
    conditions.push('au.ends_at <= DATE_ADD(NOW(), INTERVAL 24 HOUR)');
  }

  const havingClause = minBids ? `HAVING bid_count >= :minBids` : '';
  if (minBids) params.minBids = minBids;

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let orderBy = 'au.ends_at ASC'; // "ending soon" is the natural default for an auction browse
  if (sort === 'newest') orderBy = 'au.created_at DESC';
  else if (sort === 'bid_asc') orderBy = 'au.current_price ASC';
  else if (sort === 'bid_desc') orderBy = 'au.current_price DESC';
  else if (sort === 'relevance' && q && q.trim()) orderBy = 'relevance DESC, au.ends_at ASC';

  const [rows] = await pool.query(
    `SELECT au.id, au.current_price, au.ends_at, au.starts_at, au.status,
            p.id AS product_id, p.title, p.brand, p.\`condition\`, p.images,
            c.name AS category_name, u.name AS seller_name,
            ${relevanceSelect},
            (SELECT COUNT(*) FROM bids b WHERE b.auction_id = au.id) AS bid_count
     FROM auctions au
     JOIN products p ON p.id = au.product_id
     JOIN categories c ON c.id = p.category_id
     JOIN users u ON u.id = p.seller_id
     ${whereClause}
     ${havingClause}
     ORDER BY ${orderBy}
     LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );
  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM (
       SELECT au.id, (SELECT COUNT(*) FROM bids b WHERE b.auction_id = au.id) AS bid_count
       FROM auctions au
       JOIN products p ON p.id = au.product_id
       JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ${havingClause}
     ) x`,
    params
  );

  return {
    items: rows.map(parseImages),
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

/** Quick, small autocomplete list of titles/brands/categories matching a prefix. */
async function suggest(q) {
  const like = `${q.trim()}%`;
  const [titles] = await pool.query(
    `SELECT DISTINCT title AS value, 'PRODUCT' AS type FROM products
     WHERE status IN ('ACTIVE_SHOP', 'ACTIVE_AUCTION') AND title LIKE :like
     LIMIT 5`,
    { like }
  );
  const [brands] = await pool.query(
    `SELECT DISTINCT brand AS value, 'BRAND' AS type FROM products
     WHERE status IN ('ACTIVE_SHOP', 'ACTIVE_AUCTION') AND brand LIKE :like
     LIMIT 3`,
    { like }
  );
  const [categories] = await pool.query(
    `SELECT DISTINCT name AS value, 'CATEGORY' AS type FROM categories WHERE name LIKE :like LIMIT 3`,
    { like }
  );
  return [...titles, ...brands, ...categories].slice(0, 8);
}

async function logSearch({ userId, query, resultCount }) {
  await pool.query(
    'INSERT INTO search_queries (user_id, query, result_count) VALUES (:userId, :query, :resultCount)',
    { userId: userId || null, query: query.trim().slice(0, 190), resultCount: resultCount || 0 }
  );
}

async function recentSearches(userId, { limit = 5 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);
  const [rows] = await pool.query(
    `SELECT query, MAX(created_at) AS last_searched_at
     FROM search_queries
     WHERE user_id = :userId
     GROUP BY query
     ORDER BY last_searched_at DESC
     LIMIT ${safeLimit}`,
    { userId }
  );
  return rows.map((r) => r.query);
}

async function popularSearches({ limit = 8 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
  const [rows] = await pool.query(
    `SELECT query, COUNT(*) AS times
     FROM search_queries
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY query
     ORDER BY times DESC, MAX(created_at) DESC
     LIMIT ${safeLimit}`
  );
  return rows.map((r) => r.query);
}

async function clearRecentSearches(userId) {
  await pool.query('DELETE FROM search_queries WHERE user_id = :userId', { userId });
}

module.exports = {
  searchProducts,
  searchAuctions,
  suggest,
  logSearch,
  recentSearches,
  popularSearches,
  clearRecentSearches,
};
