const reviewModel = require('../models/review.model');
const orderModel = require('../models/order.model');
const { pool, withTransaction } = require('../config/db');
const { ApiError } = require('../utils/apiResponse');

/**
 * A buyer can review an order_item once it has ever reached DELIVERED
 * (checked via order_status_history, not the order's current status —
 * so an item that later moved on to a return is still reviewable), and
 * only once per order_item.
 */
async function createReview(buyer, { orderItemId, rating, comment }) {
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new ApiError('Rating must be a whole number from 1 to 5.', 400, 'INVALID_RATING');
  }

  const [itemRows] = await pool.query(
    `SELECT oi.id, oi.product_id, oi.order_id, o.buyer_id
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE oi.id = :orderItemId LIMIT 1`,
    { orderItemId }
  );
  const item = itemRows[0];
  if (!item || item.buyer_id !== buyer.id) {
    throw new ApiError('Order item not found.', 404, 'ORDER_ITEM_NOT_FOUND');
  }

  const [[deliveredCheck]] = await pool.query(
    `SELECT 1 AS ok FROM order_status_history WHERE order_id = :orderId AND to_status = 'DELIVERED' LIMIT 1`,
    { orderId: item.order_id }
  );
  if (!deliveredCheck) {
    throw new ApiError('You can only review items that have been delivered.', 409, 'NOT_YET_DELIVERED');
  }

  const existing = await reviewModel.findByOrderItem(orderItemId);
  if (existing) {
    throw new ApiError('You already reviewed this item.', 409, 'ALREADY_REVIEWED');
  }

  return withTransaction(async (conn) => {
    const id = await reviewModel.create(conn, {
      productId: item.product_id,
      buyerId: buyer.id,
      orderItemId,
      rating: ratingNum,
      comment: comment ? String(comment).slice(0, 2000) : null,
    });
    return { id, productId: item.product_id, rating: ratingNum, comment: comment || null };
  });
}

async function getProductReviews(productId, query) {
  const { page, limit } = query;
  const [summary, page1] = await Promise.all([
    reviewModel.getProductSummary(productId),
    reviewModel.findByProduct(productId, { page, limit }),
  ]);
  return { summary, ...page1 };
}

async function getMyPendingReviews(buyer) {
  return reviewModel.findPendingReviews(buyer.id);
}

async function getMyReviews(buyer, query) {
  const { page, limit } = query;
  return reviewModel.findByBuyer(buyer.id, { page, limit });
}

async function getSellerReviews(seller, query) {
  const { page, limit } = query;
  return reviewModel.findBySeller(seller.id, { page, limit });
}

module.exports = { createReview, getProductReviews, getMyPendingReviews, getMyReviews, getSellerReviews };

