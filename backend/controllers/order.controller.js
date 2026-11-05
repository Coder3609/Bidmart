const orderService = require('../services/order.service');
const { success } = require('../utils/apiResponse');

async function checkout(req, res, next) {
  try {
    const { addressId, paymentMethod } = req.body;
    const order = await orderService.checkout(req.user, { addressId, paymentMethod });
    return success(res, order, 'Order placed successfully.', 201);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await orderService.listMyOrders(req.user, { page, limit });
    return success(res, result, 'Your orders fetched.');
  } catch (err) {
    next(err);
  }
}

async function listMySales(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await orderService.listMySales(req.user, { page, limit });
    return success(res, result, 'Your sales fetched.');
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const order = await orderService.getOrderDetail(req.params.id, req.user);
    return success(res, order, 'Order fetched.');
  } catch (err) {
    next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const { status, note } = req.body;
    const order = await orderService.changeOrderStatus(req.params.id, req.user, status, note);
    return success(res, order, `Order status changed to ${order.status}.`);
  } catch (err) {
    next(err);
  }
}

async function availableTransitions(req, res, next) {
  try {
    const transitions = await orderService.getAvailableOrderTransitions(req.params.id, req.user);
    return success(res, transitions, 'Available order status transitions.');
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout, listMine, listMySales, getById, changeStatus, availableTransitions };
