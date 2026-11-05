/**
 * wallet.model.js
 * Manages wallet_balances, wallet_transactions, and wallet_holds tables.
 * Every bid hold/release must be atomic — callers should pass a conn from withTransaction.
 */

const { pool } = require('../config/db');

// ─── Balance ──────────────────────────────────────────────────────────────────

/**
 * Get or create a wallet row for a user. Uses INSERT IGNORE to avoid races.
 */
async function getOrCreate(conn, userId) {
  const runner = conn || pool;
  await runner.query(
    'INSERT IGNORE INTO wallet_balances (user_id, total_balance, reserved_balance) VALUES (:userId, 0, 0)',
    { userId }
  );
  const [rows] = await runner.query(
    'SELECT * FROM wallet_balances WHERE user_id = :userId FOR UPDATE',
    { userId }
  );
  return rows[0];
}

/**
 * Get wallet without locking (for display purposes).
 */
async function findByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM wallet_balances WHERE user_id = :userId LIMIT 1',
    { userId }
  );
  if (!rows[0]) {
    // Return a zero wallet if never created
    return { user_id: userId, total_balance: 0, reserved_balance: 0 };
  }
  return rows[0];
}

/**
 * Deposit funds into the wallet. Increases total_balance.
 * Must be called inside a transaction with a locked wallet row (getOrCreate).
 */
async function deposit(conn, userId, amount) {
  const runner = conn || pool;
  await runner.query(
    'UPDATE wallet_balances SET total_balance = total_balance + :amount WHERE user_id = :userId',
    { amount, userId }
  );
}

/**
 * Place a hold on funds for an active bid.
 * Increases reserved_balance by amount.
 * Returns false if insufficient available funds.
 */
async function reserveForBid(conn, userId, amount) {
  const runner = conn || pool;
  const wallet = await getOrCreate(conn, userId);
  const available = Number(wallet.total_balance) - Number(wallet.reserved_balance);
  if (available < amount) return false;
  await runner.query(
    'UPDATE wallet_balances SET reserved_balance = reserved_balance + :amount WHERE user_id = :userId',
    { amount, userId }
  );
  return true;
}

/**
 * Release a hold (on outbid or auction ended without win).
 * Decreases reserved_balance by amount.
 */
async function releaseReserve(conn, userId, amount) {
  const runner = conn || pool;
  await runner.query(
    'UPDATE wallet_balances SET reserved_balance = GREATEST(reserved_balance - :amount, 0) WHERE user_id = :userId',
    { amount, userId }
  );
}

/**
 * Capture (finalize) a hold on winning: deduct both total_balance AND reserved_balance.
 */
async function captureHold(conn, userId, amount) {
  const runner = conn || pool;
  await runner.query(
    `UPDATE wallet_balances
     SET total_balance    = total_balance    - :amount,
         reserved_balance = GREATEST(reserved_balance - :amount, 0)
     WHERE user_id = :userId`,
    { amount, userId }
  );
}

// ─── Holds ────────────────────────────────────────────────────────────────────

async function createHold(conn, { userId, auctionId, bidId, amount }) {
  const runner = conn || pool;
  const [result] = await runner.query(
    `INSERT INTO wallet_holds (user_id, auction_id, bid_id, amount, status)
     VALUES (:userId, :auctionId, :bidId, :amount, 'ACTIVE')`,
    { userId, auctionId, bidId: bidId || null, amount }
  );
  return result.insertId;
}

async function findActiveHoldForAuction(conn, userId, auctionId) {
  const runner = conn || pool;
  const [rows] = await runner.query(
    `SELECT * FROM wallet_holds WHERE user_id = :userId AND auction_id = :auctionId AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1`,
    { userId, auctionId }
  );
  return rows[0] || null;
}

async function findAllActiveHoldsForAuction(conn, auctionId) {
  const runner = conn || pool;
  const [rows] = await runner.query(
    `SELECT * FROM wallet_holds WHERE auction_id = :auctionId AND status = 'ACTIVE'`,
    { auctionId }
  );
  return rows;
}

async function releaseHold(conn, holdId) {
  const runner = conn || pool;
  await runner.query(
    `UPDATE wallet_holds SET status = 'RELEASED', released_at = NOW() WHERE id = :id`,
    { id: holdId }
  );
}

async function captureHoldById(conn, holdId) {
  const runner = conn || pool;
  await runner.query(
    `UPDATE wallet_holds SET status = 'CAPTURED', released_at = NOW() WHERE id = :id`,
    { id: holdId }
  );
}

async function findHoldsByUser(userId) {
  const [rows] = await pool.query(
    `SELECT wh.*, a.current_price, p.title AS product_title
     FROM wallet_holds wh
     JOIN auctions a ON a.id = wh.auction_id
     JOIN products p ON p.id = a.product_id
     WHERE wh.user_id = :userId AND wh.status = 'ACTIVE'
     ORDER BY wh.created_at DESC`,
    { userId }
  );
  return rows;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

async function createTransaction(conn, { userId, type, amount, referenceType, referenceId, description }) {
  const runner = conn || pool;
  await runner.query(
    `INSERT INTO wallet_transactions (user_id, type, amount, reference_type, reference_id, description, status)
     VALUES (:userId, :type, :amount, :referenceType, :referenceId, :description, 'COMPLETED')`,
    {
      userId, type, amount,
      referenceType: referenceType || null,
      referenceId: referenceId || null,
      description: description || null,
    }
  );
}

async function listTransactions(userId, { page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT * FROM wallet_transactions WHERE user_id = :userId ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
    { userId }
  );
  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS total FROM wallet_transactions WHERE user_id = :userId',
    { userId }
  );
  return {
    items: rows,
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

module.exports = {
  getOrCreate, findByUser,
  deposit, reserveForBid, releaseReserve, captureHold,
  createHold, findActiveHoldForAuction, findAllActiveHoldsForAuction,
  releaseHold, captureHoldById, findHoldsByUser,
  createTransaction, listTransactions,
};
