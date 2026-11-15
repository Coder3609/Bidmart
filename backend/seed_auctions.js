const { pool } = require('./config/db');

async function seed() {
  const now = new Date();
  const future1 = new Date(now.getTime() + 6 * 3600 * 1000).toISOString();
  const future2 = new Date(now.getTime() + 28 * 3600 * 1000).toISOString();
  const future3 = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
  const pastStart = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const pastEnd = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();

  // Check if already seeded
  const [existing] = await pool.query("SELECT COUNT(*) as cnt FROM auctions WHERE product_id IN (9, 13, 15)");
  if (existing && existing[0] && existing[0].cnt > 0) {
    console.log("Already seeded auction samples.");
    process.exit(0);
  }

  // Insert SCHEDULED
  await pool.query(
    "INSERT INTO auctions (product_id, starting_price, reserve_price, bid_increment, current_price, status, starts_at, ends_at) VALUES (9, 22000, 35000, 500, 22000, 'SCHEDULED', ?, ?)",
    [future1, future3]
  );
  await pool.query(
    "INSERT INTO auctions (product_id, starting_price, reserve_price, bid_increment, current_price, status, starts_at, ends_at) VALUES (15, 18000, 26000, 500, 18000, 'SCHEDULED', ?, ?)",
    [future2, future3]
  );

  // Insert CLOSED
  await pool.query(
    "INSERT INTO auctions (product_id, starting_price, reserve_price, bid_increment, current_price, status, starts_at, ends_at, closed_at) VALUES (13, 8000, 11000, 200, 10600, 'CLOSED', ?, ?, ?)",
    [pastStart, pastEnd, pastEnd]
  );

  console.log("Seeded upcoming & ended auctions successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});

