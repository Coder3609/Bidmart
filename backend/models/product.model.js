const { pool } = require('../config/db');

/**
 * Shared SELECT list joining category + inventory + seller name so every
 * "read" query returns everything the frontend needs in one round trip.
 */
const BASE_SELECT = `
  SELECT
    p.id, p.seller_id, p.category_id, p.title, p.description, p.brand,
    p.\`condition\`, p.images, p.price, p.status, p.version, p.sku,
    p.created_at, p.updated_at,
    c.name  AS category_name,
    c.slug  AS category_slug,
    u.name  AS seller_name,
    i.available_qty, i.reserved_qty, i.sold_qty
  FROM products p
  JOIN categories c ON c.id = p.category_id
  JOIN users u       ON u.id = p.seller_id
  LEFT JOIN inventory i ON i.product_id = p.id
`;

function parseImages(row) {
  if (!row) return row;
  // mysql2 already parses JSON columns into JS values in most configs,
  // but guard here in case the driver returns a raw string.
  if (typeof row.images === 'string') {
    try {
      row.images = JSON.parse(row.images);
    } catch {
      row.images = [];
    }
  }
  if (!Array.isArray(row.images)) {
    row.images = row.images ? [row.images] : [];
  }
  row.primary_image = row.images.length > 0 ? row.images[0] : null;
  return row;
}

async function create({ sellerId, categoryId, title, description, brand, condition, images, sku }) {
  const [result] = await pool.query(
    `INSERT INTO products (seller_id, category_id, title, description, brand, \`condition\`, images, sku, price, status, version)
     VALUES (:sellerId, :categoryId, :title, :description, :brand, :condition, :images, :sku, 0, 'DRAFT', 1)`,
    {
      sellerId,
      categoryId,
      title,
      description: description || null,
      brand: brand || null,
      condition,
      images: JSON.stringify(images || []),
      sku: sku || null,
    }
  );
  return result.insertId;
}

async function findBySku(sku) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE p.sku = :sku LIMIT 1`, { sku });
  return parseImages(rows[0] || null);
}

async function findById(id, conn = null) {
  const runner = conn || pool;
  const [rows] = await runner.query(`${BASE_SELECT} WHERE p.id = :id LIMIT 1`, { id });
  return parseImages(rows[0] || null);
}

/**
 * Locks the product row for update inside an active transaction.
 * Used by services that transition status (state machine) to prevent
 * two concurrent requests from racing on the same product.
 */
async function findByIdForUpdate(conn, id) {
  const [rows] = await conn.query('SELECT * FROM products WHERE id = :id FOR UPDATE', { id });
  return rows[0] || null;
}

/**
 * Public/browsable listing with optional filters, search, and pagination.
 * `statuses` defaults to the publicly visible ones (Shop + Auction),
 * callers with elevated access (seller viewing own products, admin) can
 * override it.
 */
async function list({
  statuses = ['ACTIVE_SHOP', 'ACTIVE_AUCTION'],
  categoryId = null,
  sellerId = null,
  search = null,
  minPrice = null,
  maxPrice = null,
  brand = null,
  condition = null,
  availability = null, // 'IN_STOCK' | 'OUT_OF_STOCK'
  sort = null,          // 'price_asc' | 'price_desc' | 'newest' | null (relevance-if-search, else newest)
  page = 1,
  limit = 20,
}) {
  const conditions = [];
  const params = {};

  if (statuses && statuses.length > 0) {
    conditions.push(`p.status IN (${statuses.map((_, i) => `:status${i}`).join(', ')})`);
    statuses.forEach((s, i) => { params[`status${i}`] = s; });
  }
  if (categoryId) {
    if (isNaN(Number(categoryId))) {
      conditions.push('(c.slug = :categorySlug OR c.name = :categorySlug)');
      params.categorySlug = categoryId;
    } else {
      conditions.push('p.category_id = :categoryId');
      params.categoryId = Number(categoryId);
    }
  }
  if (sellerId) {
    conditions.push('p.seller_id = :sellerId');
    params.sellerId = sellerId;
  }
  if (search) {
    conditions.push('(MATCH(p.title, p.description, p.brand) AGAINST (:search IN NATURAL LANGUAGE MODE) OR p.title LIKE :searchLike)');
    params.search = search;
    params.searchLike = `%${search}%`;
  }
  if (minPrice !== null && minPrice !== undefined && minPrice !== '') {
    conditions.push('p.price >= :minPrice');
    params.minPrice = minPrice;
  }
  if (maxPrice !== null && maxPrice !== undefined && maxPrice !== '') {
    conditions.push('p.price <= :maxPrice');
    params.maxPrice = maxPrice;
  }
  if (brand) {
    conditions.push('p.brand LIKE :brandLike');
    params.brandLike = `%${brand}%`;
  }
  if (condition) {
    conditions.push('p.`condition` = :condition');
    params.condition = condition;
  }
  if (availability === 'IN_STOCK') {
    conditions.push('COALESCE(i.available_qty, 0) > 0');
  } else if (availability === 'OUT_OF_STOCK') {
    conditions.push('COALESCE(i.available_qty, 0) = 0');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  else if (sort === 'price_desc') orderBy = 'p.price DESC';
  else if (sort === 'newest') orderBy = 'p.created_at DESC';
  else if (search) orderBy = '(CASE WHEN p.title LIKE :searchLike THEN 0 ELSE 1 END) ASC, p.created_at DESC';

  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereClause} ORDER BY ${orderBy} LIMIT ${safeLimit} OFFSET ${offset}`,
    params
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id LEFT JOIN inventory i ON i.product_id = p.id ${whereClause}`,
    params
  );

  return {
    items: rows.map(parseImages),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: countRows[0].total,
      totalPages: Math.ceil(countRows[0].total / safeLimit) || 1,
    },
  };
}

/**
 * Updates only editable fields. Status is intentionally excluded — status
 * changes must go through the state machine (see productStateMachine.js).
 */
async function update(id, fields) {
  const allowed = ['title', 'description', 'brand', 'condition', 'images', 'price', 'category_id', 'sku'];
  const setClauses = [];
  const params = { id };

  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key) || value === undefined) continue;
    const column = key === 'condition' ? '`condition`' : key;
    setClauses.push(`${column} = :${key}`);
    params[key] = key === 'images' ? JSON.stringify(value) : value;
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push('version = version + 1');
  await pool.query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = :id`, params);
  return findById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM products WHERE id = :id', { id });
}

module.exports = { create, findById, findBySku, findByIdForUpdate, list, update, remove };
