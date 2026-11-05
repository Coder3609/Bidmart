const walletService = require('../services/wallet.service');
const { success } = require('../utils/apiResponse');

async function getWallet(req, res, next) {
  try {
    const data = await walletService.getMyWallet(req.user);
    return success(res, data, 'Wallet fetched.');
  } catch (err) { next(err); }
}

async function deposit(req, res, next) {
  try {
    const data = await walletService.deposit(req.user, req.body.amount);
    return success(res, data, 'Deposit successful.', 201);
  } catch (err) { next(err); }
}

async function getTransactions(req, res, next) {
  try {
    const data = await walletService.getTransactions(req.user, req.query);
    return success(res, data, 'Transactions fetched.');
  } catch (err) { next(err); }
}

module.exports = { getWallet, deposit, getTransactions };
