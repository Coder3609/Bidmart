const fs = require('fs');
const path = require('path');
const https = require('https');
const { pool } = require('./config/db');

const targetDir = path.join(__dirname, '..', 'frontend', 'assets', 'products');

function dl(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return dl(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('Status ' + res.statusCode));
      const f = fs.createWriteStream(dest);
      res.pipe(f);
      f.on('finish', () => f.close(() => resolve(dest)));
      f.on('error', reject);
    }).on('error', reject);
  });
}

const moreImages = {
  // --- Home & Kitchen (id 109-118) ---
  109: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&auto=format&fit=crop&q=80', // Air fryer
  110: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80', // Electric kettle
  111: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80', // Mixer grinder
  112: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80', // Nutri blend mixer
  113: 'https://images.unsplash.com/photo-1584990347449-3990d0b812f8?w=600&auto=format&fit=crop&q=80', // Non-stick cookware
  114: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&auto=format&fit=crop&q=80', // Dinnerware plates
  115: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80', // Steel water bottle
  116: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=600&auto=format&fit=crop&q=80', // Egg boiler / kitchen pot
  117: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80', // Microwave oven
  118: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80', // Rice cooker

  // --- Furniture (id 119-128) ---
  119: 'https://images.unsplash.com/photo-1580481077195-c3a821a5060f?w=600&auto=format&fit=crop&q=80', // Office chair
  120: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80', // Study table
  121: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80', // Bookshelf
  122: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&auto=format&fit=crop&q=80', // Dining chairs
  123: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop&q=80', // Coffee table
  124: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&auto=format&fit=crop&q=80', // Shoe rack
  125: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80', // Armchair
  126: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=600&auto=format&fit=crop&q=80', // Nightstand table
  127: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?w=600&auto=format&fit=crop&q=80', // Wardrobe
  128: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80', // Laptop desk

  // --- Sports & Fitness (id 139-148) ---
  139: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80', // Yoga mat
  140: 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=600&auto=format&fit=crop&q=80', // Dumbbell set
  141: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=80', // Resistance band
  142: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80', // Cricket bat
  143: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80', // Football
  144: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80', // Basketball
  145: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80', // Badminton racket
  146: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80', // Skipping rope
  147: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80', // Home gym weights
  148: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'  // Gym duffle bag
};

async function run() {
  for (const [id, url] of Object.entries(moreImages)) {
    const dest = path.join(targetDir, `prod_${id}.jpg`);
    const webPath = `/assets/products/prod_${id}.jpg`;
    try {
      await dl(url, dest);
      await pool.query('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify([webPath]), Number(id)]);
      console.log('Saved product #', id);
    } catch (e) {
      console.error('Failed #', id, e.message);
    }
  }
  console.log('Done!');
  process.exit(0);
}

run();

