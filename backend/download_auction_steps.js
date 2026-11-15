const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'frontend', 'assets', 'auction-steps');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

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

// 3 distinct high-res photos:
// 1. Auction starting / bidding has begun (lady / gavel auctioneer)
// 2. Woman bidding now (excited woman raising bid paddle / smartphone)
// 3. Congrats! Bidding won by you (happy celebration winning)
const images = {
  'step1_bidding_begun.jpg': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80', // Professional woman presenting / auctioneer
  'step2_bid_yours.jpg': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80', // Confident stylish woman placing bid
  'step3_bidding_won.jpg': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80'  // Happy triumphant woman celebrating win
};

async function main() {
  for (const [filename, url] of Object.entries(images)) {
    const dest = path.join(targetDir, filename);
    try {
      await dl(url, dest);
      console.log('Saved', filename);
    } catch (e) {
      console.error('Failed', filename, e.message);
    }
  }
  console.log('Done downloading auction step images!');
  process.exit(0);
}

main();

