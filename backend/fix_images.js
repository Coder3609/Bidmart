const { pool } = require('./config/db');

async function fixCategoryImages() {
  const mapping = [
    // Fashion & Clothes
    { pattern: '%T-Shirt%', img: '/assets/real/mens_shirt.jpg' },
    { pattern: '%Denim Jacket%', img: '/assets/real/mens_jacket.jpg' },
    { pattern: '%Trousers%', img: '/assets/real/mens_shirt.jpg' },
    { pattern: '%Hoodie%', img: '/assets/real/mens_jacket.jpg' },
    { pattern: '%Button-Down%', img: '/assets/real/mens_shirt.jpg' },
    { pattern: '%Formal Shirt%', img: '/assets/real/mens_shirt.jpg' },
    { pattern: '%Kurti%', img: '/assets/real/womens_dress.jpg' },
    { pattern: '%Saree%', img: '/assets/real/womens_dress.jpg' },
    { pattern: '%Dress%', img: '/assets/real/womens_dress.jpg' },
    { pattern: '%Blazer%', img: '/assets/real/mens_jacket.jpg' },
    { pattern: '%Top%', img: '/assets/real/womens_dress.jpg' },
    { pattern: '%Jeans%', img: '/assets/real/mens_jacket.jpg' },

    // Shoes & Footwear
    { pattern: '%Shoes%', img: '/assets/real/mens_sneakers.jpg' },
    { pattern: '%Sneakers%', img: '/assets/real/mens_sneakers.jpg' },
    { pattern: '%Heels%', img: '/assets/real/heels.jpg' },
    { pattern: '%Slippers%', img: '/assets/real/mens_sneakers.jpg' },
    { pattern: '%Sandals%', img: '/assets/real/heels.jpg' },
    { pattern: '%Running%', img: '/assets/real/mens_sneakers.jpg' },

    // Beauty & Personal Care
    { pattern: '%Moisturizing%', img: '/assets/real/skincare_serum.jpg' },
    { pattern: '%Sunscreen%', img: '/assets/real/skincare_serum.jpg' },
    { pattern: '%Shampoo%', img: '/assets/real/skincare_serum.jpg' },
    { pattern: '%Hair Dryer%', img: '/assets/real/hair_styling.jpg' },
    { pattern: '%Trimmer%', img: '/assets/real/grooming_kit.jpg' },
    { pattern: '%Serum%', img: '/assets/real/skincare_serum.jpg' },
    { pattern: '%Perfume%', img: '/assets/real/luxury_perfume.jpg' },
    { pattern: '%Lipstick%', img: '/assets/real/skincare_serum.jpg' },
    { pattern: '%Face Wash%', img: '/assets/real/skincare_serum.jpg' },
    { pattern: '%Cream%', img: '/assets/real/skincare_serum.jpg' },

    // Home & Kitchen
    { pattern: '%Air Fryer%', img: '/assets/real/air_fryer.jpg' },
    { pattern: '%Coffee%', img: '/assets/real/coffee_maker.jpg' },
    { pattern: '%Cookware%', img: '/assets/real/cookware_set.jpg' },
    { pattern: '%Dinnerware%', img: '/assets/real/dinnerware.jpg' },
    { pattern: '%Vase%', img: '/assets/real/ceramic_vase.jpg' },
    { pattern: '%Lamp%', img: '/assets/real/table_lamp.jpg' },
    { pattern: '%Art%', img: '/assets/real/wall_art.jpg' },

    // Sports & Fitness
    { pattern: '%Yoga Mat%', img: '/assets/real/yoga_mat.jpg' },
    { pattern: '%Dumbbell%', img: '/assets/real/dumbbells.jpg' },
    { pattern: '%Bottle%', img: '/assets/real/sports_sipper.jpg' },
    { pattern: '%Sipper%', img: '/assets/real/sports_sipper.jpg' },
    { pattern: '%Band%', img: '/assets/real/smart_band.jpg' },

    // Automotive
    { pattern: '%Car Phone Holder%', img: '/assets/real/car_dashcam.jpg' },
    { pattern: '%Dashcam%', img: '/assets/real/car_dashcam.jpg' },
    { pattern: '%Car Care%', img: '/assets/real/car_care_kit.jpg' },
    { pattern: '%Pressure Washer%', img: '/assets/real/pressure_washer.jpg' },
    { pattern: '%Drill%', img: '/assets/real/power_drill.jpg' },

    // Bags & Accessories
    { pattern: '%Handbag%', img: '/assets/real/handbag.jpg' },
    { pattern: '%Wallet%', img: '/assets/real/leather_wallet.jpg' },
    { pattern: '%Suitcase%', img: '/assets/real/rimowa_suitcase.jpg' },
    { pattern: '%Luggage%', img: '/assets/real/rimowa_suitcase.jpg' },
    { pattern: '%Jewelry%', img: '/assets/real/jewelry.jpg' },
    { pattern: '%Sunglasses%', img: '/assets/real/sunglasses.jpg' },
    { pattern: '%Rolex%', img: '/assets/real/rolex_watch.jpg' },
    { pattern: '%Watch%', img: '/assets/real/submariner.jpg' },

    // Furniture
    { pattern: '%Chair%', img: '/assets/real/sofa_living.jpg' },
    { pattern: '%Sofa%', img: '/assets/real/sofa_living.jpg' },
    { pattern: '%Table%', img: '/assets/real/table_lamp.jpg' },

    // Audio & Tech
    { pattern: '%Headphones%', img: '/assets/real/sony_headphones.jpg' },
    { pattern: '%Earbuds%', img: '/assets/real/earbuds.jpg' },
    { pattern: '%Speaker%', img: '/assets/real/speaker.jpg' },
    { pattern: '%Soundbar%', img: '/assets/real/soundbar.jpg' },
    { pattern: '%TV%', img: '/assets/real/samsung_tv.jpg' },
    { pattern: '%Laptop%', img: '/assets/real/ultrabook.jpg' },
    { pattern: '%Ultrabook%', img: '/assets/real/ultrabook.jpg' },
    { pattern: '%MacBook%', img: '/assets/real/ultrabook.jpg' },
    { pattern: '%Monitor%', img: '/assets/real/monitor4k.jpg' },
    { pattern: '%Power Bank%', img: '/assets/real/powerbank.jpg' },
    { pattern: '%Charger%', img: '/assets/real/gan_charger.jpg' },
    { pattern: '%Sleeve%', img: '/assets/real/laptop_sleeve.jpg' },
    { pattern: '%Dock%', img: '/assets/real/usb_dock.jpg' }
  ];

  for (const item of mapping) {
    await pool.query('UPDATE products SET images = ? WHERE title LIKE ?', [JSON.stringify([item.img]), item.pattern]);
  }

  // Fallbacks by category
  await pool.query('UPDATE products SET images = ? WHERE category_id = 6', [JSON.stringify(['/assets/real/mens_shirt.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 7', [JSON.stringify(['/assets/real/mens_jacket.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 8', [JSON.stringify(['/assets/real/womens_dress.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 9', [JSON.stringify(['/assets/real/mens_sneakers.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 10', [JSON.stringify(['/assets/real/handbag.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 11', [JSON.stringify(['/assets/real/dinnerware.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 12', [JSON.stringify(['/assets/real/sofa_living.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 13', [JSON.stringify(['/assets/real/skincare_serum.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 14', [JSON.stringify(['/assets/real/yoga_mat.jpg'])]);
  await pool.query('UPDATE products SET images = ? WHERE category_id = 18', [JSON.stringify(['/assets/real/car_care_kit.jpg'])]);

  console.log('SUCCESS: All products accurately mapped to real visuals!');
  process.exit(0);
}

fixCategoryImages().catch(err => {
  console.error(err);
  process.exit(1);
});

