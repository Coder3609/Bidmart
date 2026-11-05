const orderModel = require('../models/order.model');
const addressModel = require('../models/address.model');
const cartModel = require('../models/cart.model');
const paymentModel = require('../models/payment.model');
const notificationModel = require('../models/notification.model');
const { withTransaction, pool } = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const stateMachine = require('../state-machine/productStateMachine');
const orderStateMachine = require('../state-machine/orderStateMachine');

const PAYMENT_METHODS = ['COD', 'CARD', 'UPI', 'NET_BANKING', 'WALLET'];
const DELIVERY_FEE = 0; // free delivery for now — easy to make conditional later

/**
 * Places an order from everything currently in the buyer's cart.
 *
 * Runs as one transaction:
 *   1. Row-lock each product's inventory (SELECT ... FOR UPDATE) so two
 *      simultaneous checkouts can't both "win" the last unit.
 *   2. Re-validate price/availability against the DB, never trust the cart
 *      snapshot or client input for money.
 *   3. Decrement available_qty / bump sold_qty; if a product hits zero
 *      stock, flip it to OUT_OF_STOCK via the state machine (a SYSTEM call —
 *      this is exactly the case assertCanTransition's isSystemCall exists for).
 *   4. Create the order + order_items + a PENDING/SUCCESS payment row + the
 *      initial order_status_history entry.
 *   5. Empty the cart.
 */
async function checkout(buyer, { addressId, paymentMethod }) {
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ApiError(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}.`, 400, 'INVALID_PAYMENT_METHOD');
  }

  const address = await addressModel.findById(addressId);
  if (!address || address.user_id !== buyer.id) {
    throw new ApiError('Delivery address not found.', 404, 'ADDRESS_NOT_FOUND');
  }

  const cartItems = await cartModel.findByUser(buyer.id);
  if (cartItems.length === 0) {
    throw new ApiError('Your cart is empty.', 400, 'EMPTY_CART');
  }

  return withTransaction(async (conn) => {
    let subtotal = 0;
    const lineItems = [];

    for (const item of cartItems) {
      const [productRows] = await conn.query('SELECT * FROM products WHERE id = :id FOR UPDATE', { id: item.product_id });
      const product = productRows[0];

      if (!product || product.status !== 'ACTIVE_SHOP') {
        throw new ApiError(`"${item.title}" is no longer available for purchase.`, 409, 'PRODUCT_NOT_AVAILABLE');
      }

      const [invRows] = await conn.query('SELECT * FROM inventory WHERE product_id = :id FOR UPDATE', { id: item.product_id });
      const inventory = invRows[0];

      if (!inventory || inventory.available_qty < item.quantity) {
        throw new ApiError(
          `Only ${inventory ? inventory.available_qty : 0} unit(s) of "${item.title}" left in stock.`,
          409,
          'INSUFFICIENT_STOCK'
        );
      }

      const newAvailable = inventory.available_qty - item.quantity;
      await conn.query(
        'UPDATE inventory SET available_qty = :newAvailable, sold_qty = sold_qty + :qty WHERE product_id = :id',
        { newAvailable, qty: item.quantity, id: item.product_id }
      );

      if (newAvailable === 0) {
        await stateMachine.transitionProduct(conn, {
          productId: item.product_id,
          fromStatus: 'ACTIVE_SHOP',
          toStatus: 'OUT_OF_STOCK',
          changedBy: null,
          reason: 'Stock depleted at checkout',
          isSystemCall: true,
        });
      }

      const unitPrice = Number(product.price);
      subtotal += unitPrice * item.quantity;
      lineItems.push({ productId: item.product_id, sellerId: product.seller_id, quantity: item.quantity, unitPrice });
    }

    const total = subtotal + DELIVERY_FEE;

    const orderId = await orderModel.createOrder(conn, {
      buyerId: buyer.id,
      addressId,
      source: 'SHOP',
      status: 'CONFIRMED',
      subtotal,
      discount: 0,
      deliveryFee: DELIVERY_FEE,
      total,
    });

    for (const line of lineItems) {
      await orderModel.createOrderItem(conn, { orderId, ...line });
    }

    await orderModel.createStatusHistory(conn, {
      orderId, fromStatus: null, toStatus: 'CONFIRMED', changedBy: buyer.id, note: 'Order placed',
    });

    // COD is settled on delivery; other methods are simulated as paid
    // immediately since there's no real payment gateway wired up yet.
    const paymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'SUCCESS';
    await paymentModel.create(conn, { orderId, method: paymentMethod, amount: total, status: paymentStatus });

    await cartModel.clear(conn, buyer.id);

    await notificationModel.create(conn, {
      userId: buyer.id,
      type: 'ORDER_CONFIRMED',
      title: 'Order confirmed',
      message: `Your order #${orderId} for ₹${total.toLocaleString('en-IN')} has been placed.`,
      metadata: { orderId },
    });
    const distinctSellerIds = [...new Set(lineItems.map((l) => l.sellerId))];
    await notificationModel.createMany(conn, distinctSellerIds.map((sellerId) => ({
      userId: sellerId,
      type: 'NEW_ORDER',
      title: 'New order received',
      message: `You have a new order (#${orderId}) to fulfill.`,
      metadata: { orderId },
    })));
    await notificationModel.notifyAdmins(conn, {
      type: 'NEW_ORDER',
      title: 'New order placed',
      message: `Order #${orderId} was placed for ₹${total.toLocaleString('en-IN')}.`,
      metadata: { orderId },
    });

    return getOrderDetail(orderId, buyer, conn);
  });
}

/**
 * Fetches an order with its items, status history, and payment(s).
 * `conn` is optional — pass the transaction connection when calling this
 * from inside checkout() so it sees uncommitted rows; omit it for normal
 * reads outside a transaction.
 */
async function getOrderDetail(orderId, requestingUser, conn = null) {
  const runner = conn || pool;
  const [orderRows] = await runner.query(
    `SELECT o.*, a.full_name, a.phone AS address_phone, a.line1, a.line2, a.city, a.state, a.postal_code, a.country
     FROM orders o JOIN addresses a ON a.id = o.address_id WHERE o.id = :id LIMIT 1`,
    { id: orderId }
  );
  const order = orderRows[0];
  if (!order) {
    throw new ApiError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  const [items] = await runner.query(
    `SELECT oi.*, p.title, p.images FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = :id`,
    { id: orderId }
  );
  items.forEach((row) => {
    if (typeof row.images === 'string') {
      try { row.images = JSON.parse(row.images); } catch { row.images = []; }
    }
  });

  if (requestingUser) {
    const roles = resolveActorRoles(order, items, requestingUser);
    if (requestingUser.role !== 'ADMIN' && roles.length === 0) {
      throw new ApiError('Order not found.', 404, 'ORDER_NOT_FOUND');
    }
  }

  const [history] = await runner.query(
    'SELECT * FROM order_status_history WHERE order_id = :id ORDER BY created_at ASC',
    { id: orderId }
  );
  const [payments] = await runner.query('SELECT * FROM payments WHERE order_id = :id', { id: orderId });

  return { ...order, items, statusHistory: history, payments };
}

async function listMyOrders(buyer, query) {
  return orderModel.findByBuyer(buyer.id, query);
}

async function listMySales(seller, query) {
  return orderModel.findBySeller(seller.id, query);
}

/** Which relationships (BUYER / SELLER) the user has to this order. ADMIN is checked separately. */
function resolveActorRoles(order, items, user) {
  const roles = [];
  if (order.buyer_id === user.id) roles.push('BUYER');
  if (items.some((item) => item.seller_id === user.id)) roles.push('SELLER');
  return roles;
}

// DELIVERED -> RETURN_REQUESTED must go through POST /api/returns instead
// of this generic endpoint — that's what actually creates the
// return_requests row (with a reason) that sellers/admins act on. Firing
// this transition here would flip the order's status with no matching
// record for anyone to respond to.
const RETURN_MANAGED_TARGET = 'RETURN_REQUESTED';

async function changeOrderStatus(orderId, requestingUser, toStatus, note) {
  if (toStatus === RETURN_MANAGED_TARGET) {
    throw new ApiError(
      'Use POST /api/returns to request a return (it records your reason for the seller).',
      409,
      'USE_RETURNS_ENDPOINT'
    );
  }

  return withTransaction(async (conn) => {
    const order = await orderModel.findByIdForUpdate(conn, orderId);
    if (!order) {
      throw new ApiError('Order not found.', 404, 'ORDER_NOT_FOUND');
    }

    const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = :id', { id: orderId });
    const roles = resolveActorRoles(order, items, requestingUser);

    if (requestingUser.role !== 'ADMIN' && roles.length === 0) {
      throw new ApiError('Order not found.', 404, 'ORDER_NOT_FOUND');
    }

    const rule = orderStateMachine.assertTransitionExists(order.status, toStatus);

    if (requestingUser.role !== 'ADMIN' && !roles.includes(rule.actor)) {
      throw new ApiError(
        `Only the order's ${rule.actor.toLowerCase()} can perform this action.`,
        403,
        'FORBIDDEN'
      );
    }

    await conn.query('UPDATE orders SET status = :status WHERE id = :id', { status: toStatus, id: orderId });
    await orderModel.createStatusHistory(conn, {
      orderId, fromStatus: order.status, toStatus, changedBy: requestingUser.id, note,
    });

    if (toStatus === 'SHIPPED' || toStatus === 'DELIVERED') {
      await notificationModel.create(conn, {
        userId: order.buyer_id,
        type: `ORDER_${toStatus}`,
        title: toStatus === 'SHIPPED' ? 'Order shipped' : 'Order delivered',
        message: toStatus === 'SHIPPED'
          ? `Your order #${orderId} has shipped.`
          : `Your order #${orderId} has been delivered. Enjoy!`,
        metadata: { orderId },
      });
    }

    // Cancelling restocks inventory. We don't automatically flip a
    // product back from OUT_OF_STOCK to ACTIVE_SHOP here — the seller
    // reviews and restocks manually (see Phase 3's manual transitions).
    if (toStatus === 'CANCELLED') {
      for (const item of items) {
        await conn.query(
          'UPDATE inventory SET available_qty = available_qty + :qty, sold_qty = GREATEST(sold_qty - :qty, 0) WHERE product_id = :productId',
          { qty: item.quantity, productId: item.product_id }
        );
      }
    }

    return getOrderDetail(orderId, requestingUser, conn);
  });
}

async function getAvailableOrderTransitions(orderId, requestingUser) {
  const order = await getOrderDetail(orderId, requestingUser);
  const roles = requestingUser.role === 'ADMIN'
    ? null // admin sees everything regardless of actor tag
    : resolveActorRoles(order, order.items, requestingUser);

  const all = orderStateMachine.getAvailableTransitions(order.status);
  const filtered = all.filter((t) => t.to !== RETURN_MANAGED_TARGET);
  return roles ? filtered.filter((t) => roles.includes(t.actor)) : filtered;
}

module.exports = {
  checkout,
  getOrderDetail,
  listMyOrders,
  listMySales,
  changeOrderStatus,
  getAvailableOrderTransitions,
};
