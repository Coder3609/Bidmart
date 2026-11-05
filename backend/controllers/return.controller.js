const returnService = require('../services/return.service');
const { success } = require('../utils/apiResponse');

async function request(req, res, next) {
  try {
    const { orderItemId, reason } = req.body;
    const result = await returnService.requestReturn(req.user, { orderItemId, reason });
    return success(res, result, 'Return requested.', 201);
  } catch (err) {
    next(err);
  }
}

async function respond(req, res, next) {
  try {
    const { decision } = req.body; // 'APPROVE' | 'REJECT'
    const result = await returnService.respondToReturn(req.user, req.params.id, decision);
    return success(res, result, 'Return request updated.');
  } catch (err) {
    next(err);
  }
}

async function pickedUp(req, res, next) {
  try {
    const result = await returnService.markPickedUp(req.user, req.params.id);
    return success(res, result, 'Return marked as received.');
  } catch (err) {
    next(err);
  }
}

async function refund(req, res, next) {
  try {
    const result = await returnService.processRefund(req.user, req.params.id);
    return success(res, result, 'Refund processed.');
  } catch (err) {
    next(err);
  }
}

async function mine(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await returnService.listMyReturns(req.user, { page, limit });
    return success(res, result, 'Your returns fetched.');
  } catch (err) {
    next(err);
  }
}

async function forSeller(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await returnService.listSellerReturns(req.user, { page, limit, status });
    return success(res, result, 'Return requests fetched.');
  } catch (err) {
    next(err);
  }
}

async function all(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await returnService.listAllReturns({ page, limit, status });
    return success(res, result, 'All return requests fetched.');
  } catch (err) {
    next(err);
  }
}

module.exports = { request, respond, pickedUp, refund, mine, forSeller, all };
