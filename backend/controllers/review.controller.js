const reviewService = require('../services/review.service');
const { success } = require('../utils/apiResponse');

async function create(req, res, next) {
  try {
    const { orderItemId, rating, comment } = req.body;
    const review = await reviewService.createReview(req.user, { orderItemId, rating, comment });
    return success(res, review, 'Review submitted.', 201);
  } catch (err) {
    next(err);
  }
}

async function byProduct(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getProductReviews(req.params.productId, { page, limit });
    return success(res, result, 'Reviews fetched.');
  } catch (err) {
    next(err);
  }
}

async function pending(req, res, next) {
  try {
    const items = await reviewService.getMyPendingReviews(req.user);
    return success(res, items, 'Items awaiting review fetched.');
  } catch (err) {
    next(err);
  }
}

async function mine(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getMyReviews(req.user, { page, limit });
    return success(res, result, 'Your reviews fetched.');
  } catch (err) {
    next(err);
  }
}

async function forSeller(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.getSellerReviews(req.user, { page, limit });
    return success(res, result, 'Customer reviews on your products fetched.');
  } catch (err) {
    next(err);
  }
}

module.exports = { create, byProduct, pending, mine, forSeller };

