const { pool } = require('./config/db');

async function fixAuctionImages() {
  await pool.query("UPDATE products SET images = '[\"/assets/real/ps5.jpg\"]' WHERE id = 5");
  await pool.query("UPDATE products SET images = '[\"/assets/real/iphone15pro.jpg\"]' WHERE id = 6");
  await pool.query("UPDATE products SET images = '[\"/assets/real/rolex_watch.jpg\"]' WHERE id = 7");
  await pool.query("UPDATE products SET images = '[\"/assets/real/car_dashcam.jpg\"]' WHERE id = 8");
  console.log("Successfully updated auction product images to /assets/real/*!");
  process.exit(0);
}

fixAuctionImages().catch(err => {
  console.error(err);
  process.exit(1);
});

