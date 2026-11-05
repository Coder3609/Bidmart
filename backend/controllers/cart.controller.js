const cartService = require('../services/cart.service');
const { success } = require('../utils/apiResponse');

async function getCart(req, res, next) {
  try {
    const cart = await cartService.getCart(req.user.id);
    return success(res, cart, 'Cart fetched.');
  } catch (err) {
    next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user.id, productId, quantity || 1);
    return success(res, cart, 'Added to cart.', 201);
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    const cart = await cartService.updateCartItem(req.user.id, req.params.productId, quantity);
    return success(res, cart, 'Cart updated.');
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const cart = await cartService.removeCartItem(req.user.id, req.params.productId);
    return success(res, cart, 'Item removed from cart.');
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };
