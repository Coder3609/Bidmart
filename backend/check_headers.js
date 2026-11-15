const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) res = res.concat(walk(full));
    else if (f.endsWith('.html')) res.push(path.resolve(full));
  }
  return res;
}

walk('Shopping-Site/frontend').forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const hasSiteHeader = c.includes('id="site-header"');
  const hasBmHeader = c.includes('class="bm-header"');
  const hasShopHeader = c.includes('class="shop-master-nav"');
  const hasSellerHeader = c.includes('id="seller-header"');
  console.log(path.relative('Shopping-Site/frontend', f), {
    siteHeader: hasSiteHeader,
    bmHeader: hasBmHeader,
    shopHeader: hasShopHeader,
    sellerHeader: hasSellerHeader
  });
});

