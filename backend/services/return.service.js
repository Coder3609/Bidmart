const returnModel = require('../models/return.model');
const orderModel = require('../models/order.model');
const notificationModel = require('../models/notification.model');
const { withTransaction, pool } = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const orderStateMachine = require('../state-machine/orderStateMachine');

/**
 * Moves the parent order through the order state machine as a side effect
 * of a return-request lifecycle step. Reuses the same transition table
 * order.service.js uses, so the two stay consistent, but is driven here by
 * the return's own event rather than a direct manual status change.
 */
async function transitionOrder(conn, { orderId, fromStatus, toStatus, changedBy, note }) {
  orderStateMachine.assertTransitionExists(fromStatus, toStatus);
  await conn.query('UPDATE orders SET status = :status WHERE id = :id', { status: toStatus, id: orderId });
  await orderModel.createStatusHistory(conn, { orderId, fromStatus, toStatus, changedBy, note });
}

/** Buyer requests a return on a delivered order item. */
async function requestReturn(buyer, { orderItemId, reason }) {
  if (!reason || !reason.trim()) {
    throw new ApiError('Please provide a reason for the return.', 400, 'REASON_REQUIRED');
  }

  const [itemRows] = await pool.query(
    `SELECT oi.id, oi.order_id, oi.seller_id, p.title, o.buyer_id, o.status AS order_status
     FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id
     WHERE oi.id = :orderItemId LIMIT 1`,
    { orderItemId }
  );
  const item = itemRows[0];
  if (!item || item.buyer_id !== buyer.id) {
    throw new ApiError('Order item not found.', 404, 'ORDER_ITEM_NOT_FOUND');
  }

  const existing = await returnModel.findActiveByOrderItem(orderItemId);
  if (existing) {
    throw new ApiError('A return request already exists for this item.', 409, 'RETURN_ALREADY_EXISTS');
  }

  return withTransaction(async (conn) => {
    const order = await orderModel.findByIdForUpdate(conn, item.order_id);
    if (order.status !== 'DELIVERED') {
      throw new ApiError(
        `Returns can only be requested for delivered orders (this order is ${order.status}).`,
        409,
        'ORDER_NOT_DELIVERED'
      );
    }

    await transitionOrder(conn, {
      orderId: order.id, fromStatus: 'DELIVERED', toStatus: 'RETURN_REQUESTED',
      changedBy: buyer.id, note: `Return requested: ${reason.trim()}`,
    });

    const returnId = await returnModel.create(conn, { orderItemId, buyerId: buyer.id, reason: reason.trim() });

    await notificationModel.create(conn, {
      userId: item.seller_id,
      type: 'RETURN_REQUESTED',
      title: 'Return request received',
      message: `${buyer.name} requested a return for "${item.title}": ${reason.trim()}`,
      metadata: { returnId, orderId: order.id },
    });
    await notificationModel.notifyAdmins(conn, {
      type: 'RETURN_REQUESTED',
      title: 'New return request',
      message: `A return was requested for "${item.title}" (order #${order.id}).`,
      metadata: { returnId, orderId: order.id },
    });

    return returnModel.findById(returnId);
  });
}

/** Seller approves or rejects a pending return request. */
async function respondToReturn(seller, returnId, decision) {
  if (!['APPROVE', 'REJECT'].includes(decision)) {
    throw new ApiError('Decision must be APPROVE or REJECT.', 400, 'INVALID_DECISION');
  }

  return withTransaction(async (conn) => {
    const returnRequest = await returnModel.findByIdForUpdate(conn, returnId);
    if (!returnRequest) {
      throw new ApiError('Return request not found.', 404, 'RETURN_NOT_FOUND');
    }

    const [itemRows] = await conn.query(
      `SELECT oi.seller_id, oi.order_id, p.title FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.id = :id`,
      { id: returnRequest.order_item_id }
    );
    const item = itemRows[0];
    if (seller.role !== 'ADMIN' && item.seller_id !== seller.id) {
      throw new ApiError('You do not have permission to act on this return request.', 403, 'FORBIDDEN');
    }
    if (returnRequest.status !== 'REQUESTED') {
      throw new ApiError(`This return request is already ${returnRequest.status}.`, 409, 'RETURN_NOT_PENDING');
    }

    if (decision === 'APPROVE') {
      await returnModel.updateStatus(conn, returnId, 'APPROVED');
      await notificationModel.create(conn, {
        userId: returnRequest.buyer_id,
        type: 'RETURN_UPDATED',
        title: 'Return approved',
        message: `Your return for "${item.title}" was approved. Please ship the item back.`,
        metadata: { returnId },
      });
    } else {
      await returnModel.updateStatus(conn, returnId, 'REJECTED');
      await transitionOrder(conn, {
        orderId: item.order_id, fromStatus: 'RETURN_REQUESTED', toStatus: 'DELIVERED',
        changedBy: seller.id, note: 'Return request rejected',
      });
      await notificationModel.create(conn, {
        userId: returnRequest.buyer_id,
        type: 'RETURN_UPDATED',
        title: 'Return rejected',
        message: `Your return for "${item.title}" was rejected.`,
        metadata: { returnId },
      });
    }

    return returnModel.findById(returnId);
  });
}

/** Seller confirms the returned item was received back. */
async function markPickedUp(seller, returnId) {
  return withTransaction(async (conn) => {
    const returnRequest = await returnModel.findByIdForUpdate(conn, returnId);
    if (!returnRequest) {
      throw new ApiError('Return request not found.', 404, 'RETURN_NOT_FOUND');
    }
    const [itemRows] = await conn.query(
      `SELECT oi.seller_id, oi.order_id, p.title FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.id = :id`,
      { id: returnRequest.order_item_id }
    );
    const item = itemRows[0];
    if (seller.role !== 'ADMIN' && item.seller_id !== seller.id) {
      throw new ApiError('You do not have permission to act on this return request.', 403, 'FORBIDDEN');
    }
    if (returnRequest.status !== 'APPROVED') {
      throw new ApiError('Only an approved return can be marked as picked up.', 409, 'RETURN_NOT_APPROVED');
    }

    await returnModel.updateStatus(conn, returnId, 'PICKED_UP');
    await transitionOrder(conn, {
      orderId: item.order_id, fromStatus: 'RETURN_REQUESTED', toStatus: 'RETURNED',
      changedBy: seller.id, note: 'Returned item received by seller',
    });
    await notificationModel.create(conn, {
      userId: returnRequest.buyer_id,
      type: 'RETURN_UPDATED',
      title: 'Return received',
      message: `We received your returned item ("${item.title}"). Your refund is being processed.`,
      metadata: { returnId },
    });

    return returnModel.findById(returnId);
  });
}

/** Admin processes the refund, closing out the return. */
async function processRefund(admin, returnId) {
  return withTransaction(async (conn) => {
    const returnRequest = await returnModel.findByIdForUpdate(conn, returnId);
    if (!returnRequest) {
      throw new ApiError('Return request not found.', 404, 'RETURN_NOT_FOUND');
    }
    if (returnRequest.status !== 'PICKED_UP') {
      throw new ApiError('Only a received (picked up) return can be refunded.', 409, 'RETURN_NOT_PICKED_UP');
    }
    const [itemRows] = await conn.query(
      `SELECT oi.order_id, p.title FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.id = :id`,
      { id: returnRequest.order_item_id }
    );
    const item = itemRows[0];

    await returnModel.updateStatus(conn, returnId, 'REFUNDED');
    await transitionOrder(conn, {
      orderId: item.order_id, fromStatus: 'RETURNED', toStatus: 'REFUNDED',
      changedBy: admin.id, note: 'Refund processed',
    });
    await conn.query(`UPDATE payments SET status = 'REFUNDED' WHERE order_id = :orderId`, { orderId: item.order_id });
    await notificationModel.create(conn, {
      userId: returnRequest.buyer_id,
      type: 'RETURN_UPDATED',
      title: 'Refund processed',
      message: `Your refund for "${item.title}" has been processed.`,
      metadata: { returnId },
    });

    return returnModel.findById(returnId);
  });
}

async function listMyReturns(buyer, query) {
  const { page, limit } = query;
  return returnModel.listByBuyer(buyer.id, { page, limit });
}

async function listSellerReturns(seller, query) {
  const { page, limit, status } = query;
  return returnModel.listBySeller(seller.id, { page, limit, status });
}

async function listAllReturns(query) {
  const { page, limit, status } = query;
  return returnModel.listAll({ page, limit, status });
}

module.exports = {
  requestReturn, respondToReturn, markPickedUp, processRefund,
  listMyReturns, listSellerReturns, listAllReturns,
};
