const { pool } = require('../config/db');

async function create(conn, { auctionId, bidderId, amount, bidderName, bidderAge, status = 'WINNING' }) {
  const runner = conn || pool;
  const [result] = await runner.query(
    `INSERT INTO bids (auction_id, bidder_id, amount, bidder_name, bidder_age, status) VALUES (:auctionId, :bidderId, :amount, :bidderName, :bidderAge, :status)`,
    { auctionId, bidderId, amount, bidderName: bidderName || null, bidderAge: bidderAge || null, status }
  );
  return result.insertId;
}

/**
 * The single currently-winning bid for an auction, if any. Because every
 * bid placement first locks the parent `auctions` row (see auction.service),
 * a plain SELECT here is already safe from races — there is never more
 * than one caller inside a bid transaction for the same auction at once.
 */
async function findCurrentWinning(conn, auctionId) {
  const runner = conn || pool;
  const [rows] = await runner.query(
    `SELECT * FROM bids WHERE auction_id = :auctionId AND status = 'WINNING' ORDER BY amount DESC LIMIT 1`,
    { auctionId }
  );
  return rows[0] || null;
}

async function markStatus(conn, id, status) {
  const runner = conn || pool;
  await runner.query('UPDATE bids SET status = :status WHERE id = :id', { status, id });
}

/** Marks every bid on an auction except `keepId` with `status`. Used when closing (LOST) and on outbid (OUTBID). */
async function markOthersStatus(conn, auctionId, keepId, status, fromStatuses) {
  const runner = conn || pool;
  const params = { auctionId, keepId: keepId || 0, status };
  let statusFilter = '';
  if (fromStatuses && fromStatuses.length) {
    statusFilter = `AND status IN (${fromStatuses.map((_, i) => `:fs${i}`).join(', ')})`;
    fromStatuses.forEach((s, i) => { params[`fs${i}`] = s; });
  }
  await runner.query(
    `UPDATE bids SET status = :status WHERE auction_id = :auctionId AND id != :keepId ${statusFilter}`,
    params
  );
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM bids WHERE id = :id LIMIT 1', { id });
  return rows[0] || null;
}

async function listByAuction(auctionId, { limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const [rows] = await pool.query(
    `SELECT b.*, COALESCE(b.bidder_name, u.name) AS bidder_name
     FROM bids b JOIN users u ON u.id = b.bidder_id
     WHERE b.auction_id = :auctionId
     ORDER BY b.amount DESC, b.created_at ASC
     LIMIT ${safeLimit}`,
    { auctionId }
  );
  return rows;
}

/** Distinct bidder ids that have ever bid on an auction — used to notify losing bidders on close. */
async function listDistinctBidderIds(conn, auctionId, excludeUserId) {
  const runner = conn || pool;
  const [rows] = await runner.query(
    'SELECT DISTINCT bidder_id FROM bids WHERE auction_id = :auctionId AND bidder_id != :excludeUserId',
    { auctionId, excludeUserId: excludeUserId || 0 }
  );
  return rows.map((r) => r.bidder_id);
}

async function listByBidder(bidderId, { page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const [rows] = await pool.query(
    `SELECT b.id AS bid_id, b.amount, b.status AS bid_status, b.created_at AS bid_at,
            a.id AS auction_id, a.status AS auction_status, a.current_price, a.ends_at, a.winning_bid_id,
            p.id AS product_id, p.title, p.images, p.status AS product_status
     FROM bids b
     JOIN auctions a ON a.id = b.auction_id
     JOIN products p ON p.id = a.product_id
     WHERE b.bidder_id = :bidderId
       AND b.id IN (SELECT MAX(id) FROM bids WHERE bidder_id = :bidderId GROUP BY auction_id)
     ORDER BY b.created_at DESC
     LIMIT ${safeLimit} OFFSET ${offset}`,
    { bidderId }
  );
  rows.forEach((row) => {
    if (typeof row.images === 'string') {
      try { row.images = JSON.parse(row.images); } catch { row.images = []; }
    }
  });
  const [countRows] = await pool.query(
    `SELECT COUNT(DISTINCT auction_id) AS total FROM bids WHERE bidder_id = :bidderId`,
    { bidderId }
  );

  return {
    items: rows,
    pagination: { page: safePage, limit: safeLimit, total: countRows[0].total, totalPages: Math.ceil(countRows[0].total / safeLimit) || 1 },
  };
}

module.exports = {
  create,
  findCurrentWinning,
  markStatus,
  markOthersStatus,
  findById,
  listByAuction,
  listDistinctBidderIds,
  listByBidder,
};
