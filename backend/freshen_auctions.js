const { pool } = require('./config/db');

async function freshenAuctions() {
  const now = new Date();
  // 1, 2, 3: LIVE (ends in 2 days, 3 days, 4 days)
  const liveEnd1 = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
  const liveEnd2 = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();
  const liveEnd3 = new Date(now.getTime() + 96 * 3600 * 1000).toISOString();
  const liveStart = new Date(now.getTime() - 12 * 3600 * 1000).toISOString();

  await pool.query("UPDATE auctions SET status = 'OPEN', starts_at = ?, ends_at = ?, closed_at = null WHERE id = 1", [liveStart, liveEnd1]);
  await pool.query("UPDATE auctions SET status = 'OPEN', starts_at = ?, ends_at = ?, closed_at = null WHERE id = 2", [liveStart, liveEnd2]);
  await pool.query("UPDATE auctions SET status = 'OPEN', starts_at = ?, ends_at = ?, closed_at = null WHERE id = 3", [liveStart, liveEnd3]);

  // 5, 6: SCHEDULED (starts in 1 day, 2 days)
  const upStart1 = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
  const upEnd1 = new Date(now.getTime() + 72 * 3600 * 1000).toISOString();
  const upStart2 = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
  const upEnd2 = new Date(now.getTime() + 96 * 3600 * 1000).toISOString();

  await pool.query("UPDATE auctions SET status = 'SCHEDULED', starts_at = ?, ends_at = ?, closed_at = null WHERE id = 5", [upStart1, upEnd1]);
  await pool.query("UPDATE auctions SET status = 'SCHEDULED', starts_at = ?, ends_at = ?, closed_at = null WHERE id = 6", [upStart2, upEnd2]);

  // 4, 7: CLOSED (already ended)
  const pastStart = new Date(now.getTime() - 72 * 3600 * 1000).toISOString();
  const pastEnd = new Date(now.getTime() - 10 * 3600 * 1000).toISOString();
  await pool.query("UPDATE auctions SET status = 'CLOSED', starts_at = ?, ends_at = ?, closed_at = ? WHERE id = 4", [pastStart, pastEnd, pastEnd]);
  await pool.query("UPDATE auctions SET status = 'CLOSED', starts_at = ?, ends_at = ?, closed_at = ? WHERE id = 7", [pastStart, pastEnd, pastEnd]);

  console.log("Successfully freshened auction schedules for live bidding demo!");
  process.exit(0);
}

freshenAuctions().catch(err => {
  console.error(err);
  process.exit(1);
});

