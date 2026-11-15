const fs = require('fs');
const path = require('path');
const https = require('https');
const { pool } = require('./config/db');

// Ensure directory exists
const targetDir = path.join(__dirname, '..', 'frontend', 'assets', 'products');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Download helper with redirects
function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
}

// Direct high-quality curated images for specific categories where duplication was seen
const productImagesMap = {
  // --- Category 9: Shoes (id 89-98) ---
  89: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', // Nike red sneaker
  90: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&auto=format&fit=crop&q=80', // Adidas ultraboost
  91: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80', // Puma sneaker
  92: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80', // Running shoe
  93: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&auto=format&fit=crop&q=80', // Leather formal shoe
  94: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80', // Loafers
  95: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600&auto=format&fit=crop&q=80', // Outdoor boots
  96: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=80', // Slip-ons
  97: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&auto=format&fit=crop&q=80', // Converse Chuck Taylor
  98: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80', // Sports shoe

  // --- Category 10: Bags & Accessories (id 4, 7, 99-108) ---
  4: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80', // Smart watch
  7: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80', // Rolex luxury watch
  99: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', // Backpack
  100: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80', // Laptop backpack
  101: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80', // Leather wallet
  102: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80', // Handbag
  103: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=80', // Sling bag
  104: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&auto=format&fit=crop&q=80', // Luggage suitcase
  105: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80', // Card holder
  106: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&auto=format&fit=crop&q=80', // Duffle bag
  107: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80', // Aviator Sunglasses
  108: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80', // Wayfarer Sunglasses

  // --- Category 13: Beauty & Personal Care (id 129-138) ---
  129: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80', // Moisturizing cream
  130: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80', // Sunscreen tube
  131: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80', // Shampoo bottle
  132: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80', // Hair dryer
  133: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&auto=format&fit=crop&q=80', // Beard trimmer
  134: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80', // Face wash cleanser
  135: 'https://images.unsplash.com/photo-1608248597359-25f05b5f6b21?w=600&auto=format&fit=crop&q=80', // Body lotion
  136: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80', // Hair styling iron
  137: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80', // Men luxury perfume
  138: 'https://images.unsplash.com/photo-1503236021815-5629c1e405a2?w=600&auto=format&fit=crop&q=80', // Shaving kit

  // --- Category 15: Books (id 149-158) ---
  149: 'https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=600&auto=format&fit=crop&q=80', // Algorithm code book
  150: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', // Clean code software book
  151: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80', // Python book
  152: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80', // Data architecture book
  153: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80', // Pragmatic programming
  154: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80', // Atomic habits
  155: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=80', // Finance books
  156: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80', // AI modern book
  157: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&auto=format&fit=crop&q=80', // Cloud performance
  158: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80', // Algorithms textbook

  // --- Category 18: Automotive (id 179-188) ---
  179: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80', // Car phone holder
  180: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&auto=format&fit=crop&q=80', // Car cleaning kit
  181: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80', // Car perfume freshener
  182: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80', // Tyre inflator pump
  183: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80', // Car dashcam
  184: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80', // Car vacuum cleaner
  185: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80', // Bike cover
  186: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80', // LED headlight
  187: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80', // Car seat interior
  188: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80', // Emergency jumper cable

  // --- Category 6 & 7: Clothes / Men's Fashion (id 59-78) ---
  59: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80', // Casual t-shirt
  60: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80', // Denim jacket
  61: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80', // Chino pants
  62: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80', // Hoodie
  63: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80', // Button-down shirt
  64: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80', // Streetwear hoodie
  65: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', // Leather belt
  66: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&auto=format&fit=crop&q=80', // Windbreaker jacket
  67: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&auto=format&fit=crop&q=80', // Sweatshirt
  68: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80', // Summer shorts
  69: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80', // Formal shirt
  70: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80', // Regular jeans
  71: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80', // Suit blazer
  72: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', // Ethnic Kurta
  73: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80', // Formal trousers
  74: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80', // Polo t-shirt
  75: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80', // Slim denim
  76: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80', // Silk tie set
  77: 'https://images.unsplash.com/photo-1616258734679-58b2e3f5e557?w=600&auto=format&fit=crop&q=80', // Woolen sweater
  78: 'https://images.unsplash.com/photo-1589310243389-9685613133b5?w=600&auto=format&fit=crop&q=80', // Checkered shirt

  // --- Category 8: Women's Fashion (id 79-88) ---
  79: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80', // Anarkali Kurti
  80: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&auto=format&fit=crop&q=80', // Casual top
  81: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', // Salwar suit
  82: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80', // Summer dress
  83: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80', // Skinny jeans
  84: 'https://images.unsplash.com/photo-1610030469854-9464e8aa4bca?w=600&auto=format&fit=crop&q=80', // Silk saree
  85: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80', // Women denim jacket
  86: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80', // Floral maxi dress
  87: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80', // Palazzo pants
  88: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80'  // Women blazer
};

async function run() {
  console.log('Downloading distinct high-res product photos...');
  const total = Object.keys(productImagesMap).length;
  let count = 0;

  for (const [idStr, url] of Object.entries(productImagesMap)) {
    const id = Number(idStr);
    const filename = `prod_${id}.jpg`;
    const dest = path.join(targetDir, filename);
    const localWebPath = `/assets/products/${filename}`;

    try {
      await downloadImage(url, dest);
      await pool.query('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify([localWebPath]), id]);
      count++;
      console.log(`[${count}/${total}] Saved & updated product #${id} -> ${localWebPath}`);
    } catch (err) {
      console.error(`Failed product #${id}:`, err.message);
    }
  }

  console.log(`Finished downloading and assigning ${count} distinct product images!`);
  process.exit(0);
}

run();

