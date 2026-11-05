const wishlistService = require('../services/wishlist.service');
const { success } = require('../utils/apiResponse');

async function getWishlist(req, res, next) {
  try {
    const wishlist = await wishlistService.getWishlist(req.user.id);
    return success(res, wishlist, 'Wishlist fetched.');
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const wishlist = await wishlistService.addToWishlist(req.user.id, req.body.productId);
    return success(res, wishlist, 'Added to wishlist.', 201);
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const wishlist = await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
    return success(res, wishlist, 'Removed from wishlist.');
  } catch (err) {
    next(err);
  }
}

module.exports = { getWishlist, addItem, removeItem };
