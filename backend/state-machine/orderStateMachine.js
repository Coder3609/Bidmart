/**
 * Order state machine.
 *
 * Mirrors productStateMachine.js in spirit: one place that defines which
 * `orders.status` transitions are legal, and who is allowed to trigger
 * each one. Unlike products, "who" here isn't a single owner — it's a
 * *relationship* to the order:
 *
 *   - 'BUYER'  -> the order's buyer (orders.buyer_id)
 *   - 'SELLER' -> a seller who has at least one item in the order
 *                 (order_items.seller_id)
 *   - 'ADMIN'  -> role = ADMIN can always do anything (checked separately
 *                 by the caller, not encoded here)
 *
 * order.service.js resolves which relationship(s) the requesting user has
 * to a specific order, then checks that set against the rule's actor.
 *
 * Simplification (documented in README): status is tracked at the whole-
 * order level even though one order can contain items from multiple
 * sellers. Any seller with an item in the order can advance fulfillment
 * for the whole order. Splitting fulfillment per seller is a good later
 * enhancement but out of scope here.
 */

const { ApiError } = require('../utils/apiResponse');

const ORDER_TRANSITIONS = {
  CONFIRMED: [
    { to: 'PROCESSING', actor: 'SELLER', label: 'Start processing' },
    { to: 'CANCELLED', actor: 'BUYER', label: 'Cancel order' },
  ],
  PROCESSING: [
    { to: 'SHIPPED', actor: 'SELLER', label: 'Mark as shipped' },
    { to: 'CANCELLED', actor: 'SELLER', label: 'Cancel order' },
  ],
  SHIPPED: [
    { to: 'OUT_FOR_DELIVERY', actor: 'SELLER', label: 'Out for delivery' },
  ],
  OUT_FOR_DELIVERY: [
    { to: 'DELIVERED', actor: 'SELLER', label: 'Mark as delivered' },
  ],
  DELIVERED: [
    { to: 'RETURN_REQUESTED', actor: 'BUYER', label: 'Request a return' },
  ],
  RETURN_REQUESTED: [
    { to: 'RETURNED', actor: 'SELLER', label: 'Confirm item received' },
    { to: 'DELIVERED', actor: 'SELLER', label: 'Reject return' },
  ],
  RETURNED: [
    { to: 'REFUNDED', actor: 'ADMIN', label: 'Process refund' },
  ],
  CANCELLED: [],
  REFUNDED: [],
};

function findRule(fromStatus, toStatus) {
  const options = ORDER_TRANSITIONS[fromStatus] || [];
  return options.find((opt) => opt.to === toStatus) || null;
}

/** Throws if the from->to pair isn't a legal transition at all. Returns the rule otherwise. */
function assertTransitionExists(fromStatus, toStatus) {
  const rule = findRule(fromStatus, toStatus);
  if (!rule) {
    throw new ApiError(
      `Cannot change order status from ${fromStatus} to ${toStatus}.`,
      409,
      'INVALID_ORDER_TRANSITION'
    );
  }
  return rule;
}

/** All transitions available from a status, optionally filtered to one actor type. */
function getAvailableTransitions(fromStatus, actorFilter = null) {
  const options = ORDER_TRANSITIONS[fromStatus] || [];
  return actorFilter ? options.filter((opt) => opt.actor === actorFilter) : options;
}

module.exports = { ORDER_TRANSITIONS, assertTransitionExists, getAvailableTransitions };
