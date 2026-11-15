const productService = require('../services/product.service');
const productViewLogModel = require('../models/product_view_log.model');
const { success } = require('../utils/apiResponse');

function parseProductFormData(body, files) {
  const payload = { ...body };

  // Parse numerical fields when sent via FormData
  if (payload.categoryId !== undefined) payload.categoryId = Number(payload.categoryId);
  if (payload.price !== undefined) payload.price = Number(payload.price);
  if (payload.initialQty !== undefined) payload.initialQty = Number(payload.initialQty);
  if (payload.stock !== undefined) payload.stock = Number(payload.stock);
  if (payload.available_qty !== undefined) payload.available_qty = Number(payload.available_qty);

  let imageList = [];

  // Parse any existingImages or images sent in body
  if (payload.existingImages) {
    try {
      const parsed = typeof payload.existingImages === 'string' ? JSON.parse(payload.existingImages) : payload.existingImages;
      if (Array.isArray(parsed)) imageList.push(...parsed);
      else if (typeof parsed === 'object') imageList.push(parsed);
    } catch {}
  } else if (payload.images && typeof payload.images === 'string') {
    try {
      const parsed = JSON.parse(payload.images);
      if (Array.isArray(parsed)) imageList.push(...parsed);
      else if (typeof parsed === 'string') imageList.push(parsed);
      else if (typeof parsed === 'object') imageList.push(parsed);
    } catch {
      imageList.push(payload.images);
    }
  } else if (Array.isArray(payload.images)) {
    imageList.push(...payload.images);
  }

  // Append new files uploaded via multer
  if (files && files.length > 0) {
    const primaryIndex = payload.primaryIndex !== undefined ? Number(payload.primaryIndex) : 0;
    const uploadedImages = files.map((f, idx) => ({
      url: `/uploads/products/${f.filename}`,
      imageUrl: `/uploads/products/${f.filename}`,
      originalName: f.originalname,
      isPrimary: idx === primaryIndex,
      sortOrder: imageList.length + idx,
    }));

    // If primary was set to an existing image or newly uploaded image
    if (primaryIndex >= 0 && primaryIndex < uploadedImages.length && imageList.length === 0) {
      uploadedImages.forEach((img, idx) => {
        img.isPrimary = idx === primaryIndex;
      });
    }

    imageList.push(...uploadedImages);
  }

  if (imageList.length > 0) {
    payload.images = imageList;
  }

  return payload;
}

async function create(req, res, next) {
  try {
    const payload = parseProductFormData(req.body, req.files);
    const product = await productService.createProduct(req.user, payload);
    return success(res, product, 'Product created as a draft.', 201);
  } catch (err) {
    next(err);
  }
}

async function uploadImages(req, res, next) {
  try {
    const files = (req.files || []).map((f, idx) => ({
      url: `/uploads/products/${f.filename}`,
      imageUrl: `/uploads/products/${f.filename}`,
      originalName: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
      isPrimary: idx === 0,
      sortOrder: idx,
    }));
    return success(res, { files }, 'Images uploaded successfully.');
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const categoryId = req.query.categoryId || req.query.category_id || req.query.category;
    const { search, page, limit } = req.query;
    const result = await productService.listPublicProducts({ categoryId, search, page, limit });
    return success(res, result, 'Products fetched.');
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await productService.listMyProducts(req.user, { status, page, limit });
    return success(res, result, 'Your products fetched.');
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const product = await productService.getProductDetail(req.params.id, req.user);
    if (product && (product.status === 'ACTIVE_SHOP' || product.status === 'ACTIVE_AUCTION')) {
      productViewLogModel.trackView(product.id).catch(() => {});
    }
    return success(res, product, 'Product fetched.');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const payload = parseProductFormData(req.body, req.files);
    const product = await productService.updateProduct(req.params.id, req.user, payload);
    return success(res, product, 'Product updated successfully.');
  } catch (err) {
    next(err);
  }
}

async function setPrimaryImage(req, res, next) {
  try {
    const images = await productService.setProductPrimaryImage(req.params.id, req.user, req.params.imageId);
    return success(res, { images }, 'Primary product image updated.');
  } catch (err) {
    next(err);
  }
}

async function deleteImage(req, res, next) {
  try {
    const images = await productService.deleteProductImage(req.params.id, req.user, req.params.imageId);
    return success(res, { images }, 'Product image deleted.');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id, req.user);
    return success(res, null, 'Product deleted.');
  } catch (err) {
    next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const { status, reason } = req.body;
    const updated = await productService.changeProductStatus(req.params.id, req.user, status, reason);
    return success(res, updated, `Product status changed to ${updated.status}.`);
  } catch (err) {
    next(err);
  }
}

async function availableTransitions(req, res, next) {
  try {
    const transitions = await productService.getAvailableTransitions(req.params.id, req.user);
    return success(res, transitions, 'Available status transitions.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  uploadImages,
  list,
  listMine,
  getById,
  update,
  setPrimaryImage,
  deleteImage,
  remove,
  changeStatus,
  availableTransitions,
};
