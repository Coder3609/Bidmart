const { pool } = require('../config/db');
const userModel = require('./user.model');

/**
 * Minimal notification model. Full notification-center UI (mark-read,
 * filters, etc.) is Phase 8 — for now this just needs to support inserting
 * rows from the auction lifecycle (outbid, won, unsold, seller updates)
 * and a simple list so the bell icon has something real to show.
 */
async function create(conn, { userId, type, title, message, metadata }) {
  const runner = conn || pool;
  await runner.query(
    `INSERT INTO notifications (user_id, type, title, message, metadata)
     VALUES (:userId, :type, :title, :message, :metadata)`,
    { userId, type, title, message, metadata: metadata ? JSON.stringify(metadata) : null }
  );
}

async function createMany(conn, notifications) {
  for (const n of notifications) {
    // eslint-disable-next-line no-await-in-loop
    await create(conn, n);
  }
}

/** Sends the same notification to every active admin — used for platform-wide events (new seller, new product, new order, new return). */
async function notifyAdmins(conn, { type, title, message, metadata }) {
  const adminIds = await userModel.findAdminIds();
  await createMany(conn, adminIds.map((userId) => ({ userId, type, title, message, metadata })));
}

async function listByUser(userId, { page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE user_id = :userId
     ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`,
    { userId }
  );
  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS total, SUM(is_read = 0) AS unread FROM notifications WHERE user_id = :userId',
    { userId }
  );

  return {
    items: rows,
    unreadCount: Number(countRows[0].unread) || 0,
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

async function markRead(userId, id) {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :userId', { id, userId });
}

async function markAllRead(userId) {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = :userId', { userId });
}

module.exports = { create, createMany, notifyAdmins, listByUser, markRead, markAllRead };
