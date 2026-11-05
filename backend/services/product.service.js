const path = require('path');
const fs = require('fs');
const productModel = require('../models/product.model');
const productImageModel = require('../models/product_image.model');
const categoryModel = require('../models/category.model');
const inventoryModel = require('../models/inventory.model');
const notificationModel = require('../models/notification.model');
const { withTransaction } = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const stateMachine = require('../state-machine/productStateMachine');
const {
  isValidProductTitle,
  isValidPrice,
  isValidCondition,
  isValidQuantity,
  isValidSku,
} = require('../utils/validators');

/** Statuses that are visible to the public (anyone browsing without owning the product). */
const PUBLIC_STATUSES = ['ACTIVE_SHOP', 'ACTIVE_AUCTION'];

function isOwnerOrAdmin(product, user) {
  return user.role === 'ADMIN' || product.seller_id === user.id;
}

function assertOwnerOrAdmin(product, user) {
  if (!isOwnerOrAdmin(product, user)) {
    throw new ApiError('You do not have permission to modify this product.', 403, 'FORBIDDEN');
  }
}

async function assertCategoryExists(categoryId) {
  const category = await categoryModel.findById(categoryId);
  if (!category) {
    throw new ApiError('Selected category does not exist.', 400, 'INVALID_CATEGORY');
  }
}

/**
 * Safely removes a file from the uploads directory if it matches /uploads/products/
 */
function cleanupUploadedFile(fileUrl) {
  if (typeof fileUrl === 'string' && fileUrl.startsWith('/uploads/products/')) {
    const filename = path.basename(fileUrl);
    const fullPath = path.join(__dirname, '..', '..', 'uploads', 'products', filename);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch {}
  }
}

/**
 * Normalize and structure images input
 */
function normalizeImageList(rawImages) {
  let list = [];
  if (Array.isArray(rawImages)) {
    list = rawImages;
  } else if (typeof rawImages === 'string') {
    try {
      const parsed = JSON.parse(rawImages);
      list = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      list = [rawImages];
    }
  }

  const structured = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    if (typeof item === 'string') {
      structured.push({
        url: item.trim(),
        imageUrl: item.trim(),
        isPrimary: i === 0,
        sortOrder: i,
      });
    } else if (typeof item === 'object') {
      const url = (item.url || item.image_url || item.imageUrl || '').trim();
      if (url) {
        structured.push({
          url,
          imageUrl: url,
          isPrimary: Boolean(item.isPrimary || item.is_primary),
          sortOrder: item.sortOrder !== undefined ? Number(item.sortOrder) : i,
        });
      }
    }
  }

  // Ensure at most 8 images
  if (structured.length > 8) {
    throw new ApiError('You can upload a maximum of 8 images.', 400, 'TOO_MANY_IMAGES');
  }

  // Ensure exactly one image has isPrimary = true if images exist
  if (structured.length > 0) {
    const hasPrimary = structured.some((x) => x.isPrimary);
    if (!hasPrimary) {
      structured[0].isPrimary = true;
    }
  }

  // Sort so primary is first, then by sortOrder
  structured.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });

  return structured;
}

async function createProduct(seller, input) {
  const categoryId = input.categoryId !== undefined ? input.categoryId : input.category_id;
  const { title, description, brand, condition, images, price, initialQty } = input;
  const sku = input.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  if (!isValidProductTitle(title)) {
    throw new ApiError('Title must be between 3 and 190 characters.', 400, 'INVALID_TITLE');
  }
  if (!isValidPrice(price)) {
    throw new ApiError('Price must be a positive number.', 400, 'INVALID_PRICE');
  }
  if (!isValidCondition(condition)) {
    throw new ApiError('Condition must be one of NEW, LIKE_NEW, USED, REFURBISHED.', 400, 'INVALID_CONDITION');
  }
  if (!isValidSku(sku)) {
    throw new ApiError('SKU must be 3-64 letters, numbers, dashes, or underscores.', 400, 'INVALID_SKU');
  }
  const qty = initialQty === undefined ? 0 : initialQty;
  if (!isValidQuantity(qty)) {
    throw new ApiError('Initial quantity must be a whole number of 0 or more.', 400, 'INVALID_QUANTITY');
  }
  await assertCategoryExists(categoryId);

  const imageList = normalizeImageList(images);
  const imageUrlStrings = imageList.map((item) => item.url);

  return withTransaction(async (conn) => {
    let productId;
    try {
      const [result] = await conn.query(
        `INSERT INTO products (seller_id, category_id, title, description, brand, \`condition\`, images, sku, price, status, version)
         VALUES (:sellerId, :categoryId, :title, :description, :brand, :condition, :images, :sku, :price, 'DRAFT', 1)`,
        {
          sellerId: seller.id,
          categoryId,
          title: title.trim(),
          description: description ? description.trim() : null,
          brand: brand ? brand.trim() : null,
          condition,
          images: JSON.stringify(imageUrlStrings),
          sku: sku || null,
          price,
        }
      );
      productId = result.insertId;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new ApiError('That SKU is already in use by another product.', 409, 'DUPLICATE_SKU');
      }
      throw err;
    }

    // Save relational images into product_images table
    if (imageList.length > 0) {
      await productImageModel.createMany(conn, productId, imageList);
    }

    await inventoryModel.create(conn, { productId, availableQty: qty });

    await conn.query(
      `INSERT INTO product_state_history (product_id, from_status, to_status, changed_by, reason)
       VALUES (:productId, NULL, 'DRAFT', :changedBy, 'Product created')`,
      { productId, changedBy: seller.id }
    );

    const created = await productModel.findById(productId, conn);
    const imageRecords = await productImageModel.findByProduct(productId, conn);
    return { ...created, image_records: imageRecords };
  });
}

async function getProductDetail(id, requestingUser) {
  const product = await productModel.findById(id);
  if (!product) {
    throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  const isPublic = PUBLIC_STATUSES.includes(product.status);
  const isOwnerOrAdminView = requestingUser && isOwnerOrAdmin(product, requestingUser);

  if (!isPublic && !isOwnerOrAdminView) {
    throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  const imageRecords = await productImageModel.findByProduct(product.id);
  return { ...product, image_records: imageRecords };
}

async function listPublicProducts(query) {
  const { categoryId, search, page, limit } = query;
  return productModel.list({
    statuses: PUBLIC_STATUSES,
    categoryId: categoryId || null,
    search: search || null,
    page,
    limit,
  });
}

async function listMyProducts(seller, query) {
  const { status, page, limit } = query;
  return productModel.list({
    statuses: status ? [status] : undefined,
    sellerId: seller.id,
    page,
    limit,
  });
}

async function updateProduct(id, requestingUser, fields) {
  const product = await productModel.findById(id);
  if (!product) {
    throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }
  assertOwnerOrAdmin(product, requestingUser);

  if (!['DRAFT', 'ACTIVE_SHOP', 'OUT_OF_STOCK'].includes(product.status)) {
    throw new ApiError(
      `Product details cannot be edited while status is ${product.status}.`,
      409,
      'PRODUCT_NOT_EDITABLE'
    );
  }

  if (fields.title !== undefined && !isValidProductTitle(fields.title)) {
    throw new ApiError('Title must be between 3 and 190 characters.', 400, 'INVALID_TITLE');
  }
  if (fields.price !== undefined && !isValidPrice(fields.price)) {
    throw new ApiError('Price must be a positive number.', 400, 'INVALID_PRICE');
  }
  if (fields.condition !== undefined && !isValidCondition(fields.condition)) {
    throw new ApiError('Condition must be one of NEW, LIKE_NEW, USED, REFURBISHED.', 400, 'INVALID_CONDITION');
  }
  if (fields.category_id !== undefined) {
    await assertCategoryExists(fields.category_id);
  }
  if (fields.sku !== undefined && !isValidSku(fields.sku)) {
    throw new ApiError('SKU must be 3-64 letters, numbers, dashes, or underscores.', 400, 'INVALID_SKU');
  }

  if (fields.available_qty !== undefined || fields.stock !== undefined) {
    const qtyVal = fields.available_qty !== undefined ? fields.available_qty : fields.stock;
    const qtyNum = Number(qtyVal);
    if (!isValidQuantity(qtyNum)) {
      throw new ApiError('Stock quantity must be a whole number of 0 or more.', 400, 'INVALID_QUANTITY');
    }
    await inventoryModel.setAvailableQty(null, id, qtyNum);
  }

  if (fields.images !== undefined) {
    const imageList = normalizeImageList(fields.images);
    const imageUrlStrings = imageList.map((item) => item.url);
    fields.images = imageUrlStrings;
    await productImageModel.replaceForProduct(null, id, imageList);
  }

  try {
    const updated = await productModel.update(id, fields);
    const imageRecords = await productImageModel.findByProduct(id);
    return { ...updated, image_records: imageRecords };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new ApiError('That SKU is already in use by another product.', 409, 'DUPLICATE_SKU');
    }
    throw err;
  }
}

async function deleteProduct(id, requestingUser) {
  const product = await productModel.findById(id);
  if (!product) {
    throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }
  assertOwnerOrAdmin(product, requestingUser);

  if (product.status !== 'DRAFT') {
    throw new ApiError('Only draft products can be deleted. Use status change instead.', 409, 'PRODUCT_NOT_DELETABLE');
  }

  // Clean up physical uploaded files from disk safely
  const imageRecords = await productImageModel.findByProduct(id);
  for (const img of imageRecords) {
    cleanupUploadedFile(img.image_url);
  }

  if (Array.isArray(product.images)) {
    product.images.forEach(cleanupUploadedFile);
  }

  await productImageModel.deleteByProduct(null, id);
  await productModel.remove(id);
}

async function setProductPrimaryImage(productId, requestingUser, imageId) {
  const product = await productModel.findById(productId);
  if (!product) {
    throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }
  assertOwnerOrAdmin(product, requestingUser);

  return withTransaction(async (conn) => {
    await productImageModel.setPrimary(conn, productId, imageId);
    const images = await productImageModel.findByProduct(productId, conn);
    const urlStrings = images.map((x) => x.image_url);

    await conn.query('UPDATE products SET images = :images WHERE id = :productId', {
      images: JSON.stringify(urlStrings),
      productId,
    });

    return images;
  });
}

async function deleteProductImage(productId, requestingUser, imageId) {
  const product = await productModel.findById(productId);
  if (!product) {
    throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }
  assertOwnerOrAdmin(product, requestingUser);

  return withTransaction(async (conn) => {
    const targetImage = await productImageModel.findById(conn, imageId);
    if (!targetImage || targetImage.product_id !== Number(productId)) {
      throw new ApiError('Image not found for this product.', 404, 'IMAGE_NOT_FOUND');
    }

    const allImages = await productImageModel.findByProduct(productId, conn);
    if (allImages.length <= 1) {
      throw new ApiError('Product must have at least one image remaining.', 400, 'CANNOT_DELETE_LAST_IMAGE');
    }

    await productImageModel.deleteSingleImage(conn, productId, imageId);
    cleanupUploadedFile(targetImage.image_url);

    // If deleted image was primary, make the first remaining image primary
    const remaining = await productImageModel.findByProduct(productId, conn);
    if (targetImage.is_primary && remaining.length > 0) {
      await productImageModel.setPrimary(conn, productId, remaining[0].id);
    }

    const updatedImages = await productImageModel.findByProduct(productId, conn);
    const urlStrings = updatedImages.map((x) => x.image_url);
    await conn.query('UPDATE products SET images = :images WHERE id = :productId', {
      images: JSON.stringify(urlStrings),
      productId,
    });

    return updatedImages;
  });
}

async function changeProductStatus(id, requestingUser, toStatus, reason) {
  const AUCTION_MANAGED_TARGETS = ['ACTIVE_AUCTION', 'RETURNED_TO_SHOP'];
  if (AUCTION_MANAGED_TARGETS.includes(toStatus)) {
    throw new ApiError(
      `Use the Auctions endpoints to move a product to ${toStatus} (relist or return-to-shop), not this generic status change.`,
      409,
      'USE_AUCTION_ENDPOINT'
    );
  }

  return withTransaction(async (conn) => {
    const product = await productModel.findByIdForUpdate(conn, id);
    if (!product) {
      throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }
    assertOwnerOrAdmin(product, requestingUser);

    await stateMachine.transitionProduct(conn, {
      productId: id,
      fromStatus: product.status,
      toStatus,
      changedBy: requestingUser.id,
      reason: reason || null,
      isSystemCall: false,
    });

    if (product.status === 'DRAFT' && toStatus === 'ACTIVE_SHOP') {
      await notificationModel.notifyAdmins(conn, {
        type: 'NEW_PRODUCT',
        title: 'New product published',
        message: `"${product.title}" was published to the Shop.`,
        metadata: { productId: id },
      });
    }

    const [rows] = await conn.query('SELECT status, version FROM products WHERE id = :id', { id });
    return rows[0];
  });
}

async function getAvailableTransitions(id, requestingUser) {
  const product = await productModel.findById(id);
  if (!product) {
    throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }
  assertOwnerOrAdmin(product, requestingUser);
  const AUCTION_MANAGED_TARGETS = ['ACTIVE_AUCTION', 'RETURNED_TO_SHOP'];
  return stateMachine.getManualTransitions(product.status)
    .filter((t) => !AUCTION_MANAGED_TARGETS.includes(t.to));
}

module.exports = {
  createProduct,
  getProductDetail,
  listPublicProducts,
  listMyProducts,
  updateProduct,
  deleteProduct,
  setProductPrimaryImage,
  deleteProductImage,
  changeProductStatus,
  getAvailableTransitions,
};
