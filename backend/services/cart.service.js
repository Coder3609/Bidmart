const cartModel = require('../models/cart.model');
const productModel = require('../models/product.model');
const { ApiError } = require('../utils/apiResponse');

function withTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  return { items, subtotal, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
}

async function getCart(userId) {
  const items = await cartModel.findByUser(userId);
  return withTotals(items);
}

async function addToCart(userId, productId, quantity = 1) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError('Quantity must be a whole number of at least 1.', 400, 'INVALID_QUANTITY');
  }

  const product = await productModel.findById(productId);
  if (!product || product.status !== 'ACTIVE_SHOP') {
    throw new ApiError('This product is not available for purchase right now.', 409, 'PRODUCT_NOT_AVAILABLE');
  }

  const existing = await cartModel.findItem(userId, productId);
  const desiredQty = (existing ? existing.quantity : 0) + quantity;

  if (desiredQty > product.available_qty) {
    throw new ApiError(
      `Only ${product.available_qty} unit(s) of "${product.title}" left in stock.`,
      409,
      'INSUFFICIENT_STOCK'
    );
  }

  await cartModel.upsertQuantity(userId, productId, quantity);
  return getCart(userId);
}

async function updateCartItem(userId, productId, quantity) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new ApiError('Quantity must be a whole number of 0 or more.', 400, 'INVALID_QUANTITY');
  }

  if (quantity === 0) {
    await cartModel.removeItem(userId, productId);
    return getCart(userId);
  }

  const product = await productModel.findById(productId);
  if (!product || product.status !== 'ACTIVE_SHOP') {
    throw new ApiError('This product is not available for purchase right now.', 409, 'PRODUCT_NOT_AVAILABLE');
  }
  if (quantity > product.available_qty) {
    throw new ApiError(`Only ${product.available_qty} unit(s) left in stock.`, 409, 'INSUFFICIENT_STOCK');
  }

  await cartModel.setQuantity(userId, productId, quantity);
  return getCart(userId);
}

async function removeCartItem(userId, productId) {
  await cartModel.removeItem(userId, productId);
  return getCart(userId);
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
