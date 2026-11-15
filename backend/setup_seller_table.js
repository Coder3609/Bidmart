const { pool } = require('./config/db');

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS seller_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      store_name TEXT NOT NULL,
      business_type TEXT DEFAULT 'INDIVIDUAL',
      display_name TEXT,
      business_description TEXT,
      business_category TEXT,
      business_phone TEXT,
      business_email TEXT,
      seller_status TEXT DEFAULT 'APPROVED',
      is_top_rated INTEGER DEFAULT 0,
      commission_rate REAL DEFAULT 5.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query("INSERT OR IGNORE INTO seller_profiles (user_id, store_name, seller_status) VALUES (4, 'TechWorld Store', 'APPROVED')");
  await pool.query("INSERT OR IGNORE INTO seller_profiles (user_id, store_name, seller_status) VALUES (5, 'Urban Fashion', 'APPROVED')");

  const [rows] = await pool.query('SELECT * FROM seller_profiles');
  console.log('seller_profiles ready! Rows:', rows);
}

run().catch(console.error);

