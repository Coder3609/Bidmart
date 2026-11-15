const { pool } = require('./config/db');

async function setupBidderProfiles() {
  await pool.query(`CREATE TABLE IF NOT EXISTS bidder_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    display_name TEXT,
    mobile_number TEXT,
    bidder_status TEXT DEFAULT 'ACTIVE',
    kyc_status TEXT DEFAULT 'VERIFIED',
    bidder_verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query("INSERT OR REPLACE INTO bidder_profiles (user_id, display_name, mobile_number, bidder_status, kyc_status) VALUES (2, 'Rahul Sharma', '9876543210', 'ACTIVE', 'VERIFIED')");
  await pool.query("INSERT OR REPLACE INTO bidder_profiles (user_id, display_name, mobile_number, bidder_status, kyc_status) VALUES (3, 'Priya Verma', '9876543211', 'ACTIVE', 'VERIFIED')");

  console.log("bidder_profiles table verified and bidders initialized!");
  process.exit(0);
}

setupBidderProfiles().catch(err => {
  console.error(err);
  process.exit(1);
});

