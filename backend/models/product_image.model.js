const { pool } = require('../config/db');

/**
 * Inserts one image record for a product.
 */
async function create(conn, { productId, imageUrl, storagePath = null, isPrimary = false, sortOrder = 0 }) {
  const runner = conn || pool;
  const [result] = await runner.query(
    `INSERT INTO product_images (product_id, image_url, storage_path, is_primary, sort_order)
     VALUES (:productId, :imageUrl, :storagePath, :isPrimary, :sortOrder)`,
    {
      productId,
      imageUrl,
      storagePath: storagePath || null,
      isPrimary: isPrimary ? 1 : 0,
      sortOrder: Number(sortOrder) || 0,
    }
  );
  return result.insertId;
}

/**
 * Inserts multiple image records for a product in bulk/order.
 * @param {object} conn DB connection (for transactions)
 * @param {number} productId
 * @param {Array<string|object>} images Array of URLs or objects { url, imageUrl, storagePath, isPrimary, sortOrder }
 */
async function createMany(conn, productId, images) {
  if (!images || images.length === 0) return [];
  const runner = conn || pool;
  const created = [];

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const imageUrl = typeof item === 'string' ? item : (item.url || item.image_url || item.imageUrl);
    const storagePath = typeof item === 'object' ? (item.storagePath || item.storage_path || null) : null;
    const isPrimary = typeof item === 'object' && item.isPrimary !== undefined
      ? Boolean(item.isPrimary)
      : (i === 0);
    const sortOrder = typeof item === 'object' && item.sortOrder !== undefined
      ? Number(item.sortOrder)
      : i;

    if (!imageUrl) continue;

    // eslint-disable-next-line no-await-in-loop
    const id = await create(runner, {
      productId,
      imageUrl,
      storagePath,
      isPrimary,
      sortOrder,
    });
    created.push({
      id,
      product_id: productId,
      image_url: imageUrl,
      storage_path: storagePath,
      is_primary: isPrimary,
      sort_order: sortOrder,
    });
  }

  return created;
}

/**
 * Fetches all image records for a given product.
 */
async function findByProduct(productId, conn = null) {
  const runner = conn || pool;
  const [rows] = await runner.query(
    `SELECT id, product_id, image_url, storage_path, is_primary, sort_order, created_at, updated_at
     FROM product_images
     WHERE product_id = :productId
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    { productId }
  );
  return rows.map((r) => ({
    ...r,
    is_primary: Boolean(r.is_primary),
  }));
}

/**
 * Fetches single image record by ID.
 */
async function findById(conn, id) {
  const runner = conn || pool;
  const [rows] = await runner.query(
    `SELECT id, product_id, image_url, storage_path, is_primary, sort_order, created_at, updated_at
     FROM product_images
     WHERE id = :id LIMIT 1`,
    { id }
  );
  if (!rows.length) return null;
  return {
    ...rows[0],
    is_primary: Boolean(rows[0].is_primary),
  };
}

/**
 * Sets one image as the primary image for a product, marking others non-primary.
 */
async function setPrimary(conn, productId, imageId) {
  const runner = conn || pool;
  await runner.query('UPDATE product_images SET is_primary = 0 WHERE product_id = :productId', { productId });
  await runner.query('UPDATE product_images SET is_primary = 1 WHERE product_id = :productId AND id = :imageId', {
    productId,
    imageId,
  });
  return findByProduct(productId, runner);
}

/**
 * Deletes single image record by ID.
 */
async function deleteSingleImage(conn, productId, imageId) {
  const runner = conn || pool;
  const [result] = await runner.query(
    'DELETE FROM product_images WHERE product_id = :productId AND id = :imageId',
    { productId, imageId }
  );
  return result.affectedRows > 0;
}

/**
 * Deletes all image records for a given product.
 */
async function deleteByProduct(conn, productId) {
  const runner = conn || pool;
  await runner.query('DELETE FROM product_images WHERE product_id = :productId', { productId });
}

/**
 * Replaces all image records for a product.
 */
async function replaceForProduct(conn, productId, images) {
  await deleteByProduct(conn, productId);
  return createMany(conn, productId, images);
}

module.exports = {
  create,
  createMany,
  findByProduct,
  findById,
  setPrimary,
  deleteSingleImage,
  deleteByProduct,
  replaceForProduct,
};
