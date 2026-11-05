const wishlistModel = require('../models/wishlist.model');
const productModel = require('../models/product.model');
const { ApiError } = require('../utils/apiResponse');

async function getWishlist(userId) {
  return wishlistModel.findByUser(userId);
}

async function addToWishlist(userId, productId) {
  const product = await productModel.findById(productId);
  if (!product) {
    throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }
  await wishlistModel.add(userId, productId);
  return getWishlist(userId);
}

async function removeFromWishlist(userId, productId) {
  await wishlistModel.remove(userId, productId);
  return getWishlist(userId);
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
