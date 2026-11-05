/**
 * wallet.service.js
 * Business logic for wallet operations: deposit, balance inquiry, hold management.
 */

const walletModel = require('../models/wallet.model');
const { withTransaction } = require('../config/db');
const { ApiError } = require('../utils/apiResponse');

async function getMyWallet(user) {
  const balance = await walletModel.findByUser(user.id);
  const holds = await walletModel.findHoldsByUser(user.id);
  const available = Number(balance.total_balance) - Number(balance.reserved_balance);
  return {
    total_balance: Number(balance.total_balance),
    reserved_balance: Number(balance.reserved_balance),
    available_balance: available,
    active_holds: holds,
  };
}

async function deposit(user, amount) {
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0 || amt > 1000000) {
    throw new ApiError('Deposit amount must be between ₹1 and ₹10,00,000.', 400, 'INVALID_AMOUNT');
  }

  return withTransaction(async (conn) => {
    await walletModel.getOrCreate(conn, user.id);
    await walletModel.deposit(conn, user.id, amt);
    await walletModel.createTransaction(conn, {
      userId: user.id,
      type: 'DEPOSIT',
      amount: amt,
      description: `Wallet deposit of ₹${amt.toLocaleString('en-IN')}`,
    });
    const balance = await walletModel.findByUser(user.id);
    return {
      total_balance: Number(balance.total_balance),
      reserved_balance: Number(balance.reserved_balance),
      available_balance: Number(balance.total_balance) - Number(balance.reserved_balance),
    };
  });
}

async function getTransactions(user, query) {
  const { page, limit } = query;
  return walletModel.listTransactions(user.id, { page, limit });
}

module.exports = { getMyWallet, deposit, getTransactions };
