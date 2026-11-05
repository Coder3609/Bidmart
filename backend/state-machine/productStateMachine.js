/**
 * Product state machine.
 *
 * This is the ONE place that decides which product.status transitions are
 * legal. Every part of the app that changes a product's status — the
 * product routes here, and the auction/order services in later phases —
 * must go through `transitionProduct()` instead of writing to
 * `products.status` directly. That's what makes the lifecycle diagram in
 * the README actually true, instead of just documentation.
 *
 * Lifecycle:
 *
 *   DRAFT -> ACTIVE_SHOP <-> OUT_OF_STOCK
 *              |
 *              v
 *      SHIFTING_TO_AUCTION -> ACTIVE_AUCTION -> AUCTION_ENDED
 *                                                   |        \
 *                                                   v         v
 *                                            AUCTION_WON   AUCTION_UNSOLD
 *                                                   |           |    \
 *                                                   v           v     v
 *                                                 SOLD   ACTIVE_AUCTION  RETURNED_TO_SHOP
 *                                                                            |
 *                                                                            v
 *                                                                      ACTIVE_SHOP
 *
 * Each transition is tagged with who is allowed to trigger it:
 *   - 'OWNER_OR_ADMIN' -> the product's seller, or an admin, via the API
 *   - 'SYSTEM'         -> only backend services can trigger it (the Auction
 *                          module in Phase 5, the Order module in Phase 4).
 *                          Not reachable through the manual status-change
 *                          endpoint, so a seller can't fake an auction win.
 */

const { ApiError } = require('../utils/apiResponse');

const TRANSITIONS = {
  DRAFT: [
    { to: 'ACTIVE_SHOP', actor: 'OWNER_OR_ADMIN', label: 'Publish to Shop' },
  ],
  ACTIVE_SHOP: [
    { to: 'OUT_OF_STOCK', actor: 'OWNER_OR_ADMIN', label: 'Mark out of stock' },
    { to: 'SHIFTING_TO_AUCTION', actor: 'SYSTEM', label: 'Move to auction (Phase 5)' },
  ],
  OUT_OF_STOCK: [
    { to: 'ACTIVE_SHOP', actor: 'OWNER_OR_ADMIN', label: 'Restock' },
  ],
  SHIFTING_TO_AUCTION: [
    { to: 'ACTIVE_AUCTION', actor: 'SYSTEM', label: 'Auction opens (Phase 5)' },
  ],
  ACTIVE_AUCTION: [
    { to: 'AUCTION_ENDED', actor: 'SYSTEM', label: 'Auction closes (Phase 5)' },
  ],
  AUCTION_ENDED: [
    { to: 'AUCTION_WON', actor: 'SYSTEM', label: 'Reserve met, has winner (Phase 5)' },
    { to: 'AUCTION_UNSOLD', actor: 'SYSTEM', label: 'No bids / reserve not met (Phase 5)' },
  ],
  AUCTION_WON: [
    { to: 'SOLD', actor: 'SYSTEM', label: 'Order created (Phase 4/5)' },
  ],
  AUCTION_UNSOLD: [
    { to: 'ACTIVE_AUCTION', actor: 'OWNER_OR_ADMIN', label: 'Relist' },
    { to: 'RETURNED_TO_SHOP', actor: 'OWNER_OR_ADMIN', label: 'Return to shop' },
  ],
  RETURNED_TO_SHOP: [
    { to: 'ACTIVE_SHOP', actor: 'SYSTEM', label: 'Re-enter shop catalog' },
  ],
  SOLD: [],
};

/**
 * Looks up the transition rule for fromStatus -> toStatus, if any.
 * Returns null when the transition doesn't exist at all.
 */
function findRule(fromStatus, toStatus) {
  const options = TRANSITIONS[fromStatus] || [];
  return options.find((opt) => opt.to === toStatus) || null;
}

/**
 * Throws a descriptive ApiError if the transition is not allowed.
 *
 * `isSystemCall: true` means a trusted backend service is calling this
 * (checkout reducing stock to zero, the Auction module closing a listing,
 * etc.) — system calls may perform ANY defined transition, including ones
 * tagged 'OWNER_OR_ADMIN'. `isSystemCall: false` (the default, used by the
 * manual status-change route) is restricted to transitions explicitly
 * tagged 'OWNER_OR_ADMIN' — a user can never trigger a 'SYSTEM' transition
 * by hand, no matter their role.
 */
function assertCanTransition(fromStatus, toStatus, { isSystemCall = false } = {}) {
  const rule = findRule(fromStatus, toStatus);

  if (!rule) {
    throw new ApiError(
      `Cannot change product status from ${fromStatus} to ${toStatus}.`,
      409,
      'INVALID_STATE_TRANSITION'
    );
  }

  if (!isSystemCall && rule.actor !== 'OWNER_OR_ADMIN') {
    throw new ApiError(
      `The ${fromStatus} → ${toStatus} transition (${rule.label}) is managed automatically ` +
        'by the system and cannot be triggered manually.',
      403,
      'SYSTEM_ONLY_TRANSITION'
    );
  }

  return rule;
}

/** Returns the list of transitions a seller/admin can manually trigger from a given status. */
function getManualTransitions(fromStatus) {
  return (TRANSITIONS[fromStatus] || []).filter((opt) => opt.actor === 'OWNER_OR_ADMIN');
}

/**
 * Performs the transition inside an existing DB transaction (`conn` must be
 * a connection from `withTransaction`, already holding a row lock via
 * `SELECT ... FOR UPDATE` on the product). Updates products.status,
 * bumps the optimistic-lock `version`, and writes a product_state_history row.
 *
 * Returns nothing — callers re-select the product if they need the new row.
 */
async function transitionProduct(conn, { productId, fromStatus, toStatus, changedBy = null, reason = null, isSystemCall = false }) {
  assertCanTransition(fromStatus, toStatus, { isSystemCall });

  await conn.query(
    `UPDATE products SET status = :toStatus, version = version + 1 WHERE id = :productId`,
    { toStatus, productId }
  );

  await conn.query(
    `INSERT INTO product_state_history (product_id, from_status, to_status, changed_by, reason)
     VALUES (:productId, :fromStatus, :toStatus, :changedBy, :reason)`,
    { productId, fromStatus, toStatus, changedBy, reason }
  );
}

module.exports = { TRANSITIONS, assertCanTransition, getManualTransitions, transitionProduct };
