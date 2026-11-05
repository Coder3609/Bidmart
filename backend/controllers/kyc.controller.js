const kycService = require('../services/kyc.service');
const { success } = require('../utils/apiResponse');

async function getStatus(req, res, next) {
  try {
    const status = await kycService.getKycStatus(req.user.id);
    return success(res, status, 'KYC status fetched.');
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    const result = await kycService.submitKyc(req.user, req.body);
    return success(res, result, 'KYC submitted successfully.', 201);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const history = await kycService.getKycHistory(req.user.id);
    return success(res, history, 'KYC history fetched.');
  } catch (err) {
    next(err);
  }
}

async function listPending(req, res, next) {
  try {
    const result = await kycService.listPending(req.query);
    return success(res, result, 'Pending KYC verifications fetched.');
  } catch (err) {
    next(err);
  }
}

async function review(req, res, next) {
  try {
    const result = await kycService.reviewKyc(req.user, req.params.id, req.body);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStatus,
  submit,
  getHistory,
  listPending,
  review,
};
