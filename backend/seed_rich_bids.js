const { pool } = require('./config/db');

async function seedRichAuctionData() {
  // 1. Add winning bid for Auction 4 (DSLR Camera)
  // Let bid #10 (Rahul Sharma, 42000) be WON
  await pool.query("UPDATE bids SET status = 'WON' WHERE id = 10");
  await pool.query("UPDATE auctions SET winning_bid_id = 10 WHERE id = 4");

  // 2. Add bids for Auction 7 (Philips Speaker System, CLOSED)
  await pool.query("INSERT INTO bids (auction_id, bidder_id, amount, status, created_at) VALUES (7, 2, 8500, 'LOST', '2026-11-10 10:00:00')");
  await pool.query("INSERT INTO bids (auction_id, bidder_id, amount, status, created_at) VALUES (7, 3, 9800, 'LOST', '2026-11-10 14:00:00')");
  const [b7Win] = await pool.query("INSERT INTO bids (auction_id, bidder_id, amount, status, created_at) VALUES (7, 2, 10600, 'WON', '2026-11-11 12:00:00')");
  
  // Update winning bid ID for auction 7
  const [lastBids] = await pool.query("SELECT id FROM bids WHERE auction_id = 7 AND status = 'WON' LIMIT 1");
  if (lastBids.length > 0) {
    await pool.query("UPDATE auctions SET winning_bid_id = ? WHERE id = 7", [lastBids[0].id]);
  }

  // 3. Add more live bids for ongoing auctions (Auction 1, 2, 3)
  // Check if bids exist for Auction 3
  await pool.query("UPDATE bids SET status = 'LOST' WHERE auction_id = 3");
  await pool.query("INSERT INTO bids (auction_id, bidder_id, amount, status, created_at) VALUES (3, 3, 270000, 'WINNING', CURRENT_TIMESTAMP)");
  await pool.query("UPDATE auctions SET current_price = 270000 WHERE id = 3");

  // Auction 2: Priya leading at 52,000
  await pool.query("INSERT INTO bids (auction_id, bidder_id, amount, status, created_at) VALUES (2, 2, 50000, 'LOST', CURRENT_TIMESTAMP)");
  await pool.query("INSERT INTO bids (auction_id, bidder_id, amount, status, created_at) VALUES (2, 3, 52000, 'WINNING', CURRENT_TIMESTAMP)");
  await pool.query("UPDATE auctions SET current_price = 52000 WHERE id = 2");

  console.log("Seeded rich auction history with winners and competitive bids!");
  process.exit(0);
}

seedRichAuctionData().catch(err => {
  console.error(err);
  process.exit(1);
});

