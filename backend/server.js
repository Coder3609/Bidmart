const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const { checkConnection } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const addressRoutes = require('./routes/address.routes');
const orderRoutes = require('./routes/order.routes');
const auctionRoutes = require('./routes/auction.routes');
const auctionService = require('./services/auction.service');
const dashboardRoutes = require('./routes/dashboard.routes');
const searchRoutes = require('./routes/search.routes');
const scanRoutes = require('./routes/scan.routes');
const notificationRoutes = require('./routes/notification.routes');
const reviewRoutes = require('./routes/review.routes');
const returnRoutes = require('./routes/return.routes');
const walletRoutes = require('./routes/wallet.routes');
const kycRoutes = require('./routes/kyc.routes');
const sellerRoutes = require('./routes/seller.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Core middleware ----------
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Lightweight request logger (kept dependency-free on purpose)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // eslint-disable-next-line no-console
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

// ---------- API routes ----------
// Phase 1: health check. Phase 2: authentication. Phase 3: products + categories.
// Phase 4: cart, wishlist, addresses, orders/checkout.
// Phase 5: auctions (shift-to-auction, bidding, closing, relist/return).
// Phase 6: role-scoped dashboard aggregates (buyer/seller/admin).
// Phase 7: global search (products + auctions, filters, autocomplete) and scan (barcode/QR/image).
// Phase 8: notifications, reviews, and the return/refund lifecycle.
// Phase 9: dedicated seller auth, onboarding, KYC & payout verification.
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/seller', sellerRoutes);

// ---------- Serve static files & uploads ----------
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// Fallback to index.html for the root frontend app shell.
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});


// ---------- 404 + error handling (must be last) ----------
app.use('/api', notFound);
app.use(errorHandler);

// ---------- Start server ----------
async function start() {
  if (!process.env.JWT_SECRET) {
    // eslint-disable-next-line no-console
    console.warn('⚠ JWT_SECRET is not set in .env — /api/auth routes will fail. See backend/.env.example.');
  }

  try {
    await checkConnection();
    // eslint-disable-next-line no-console
    console.log('✔ Connected to MySQL database.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('✘ Could not connect to the database. Check your .env file.');
    console.error(`  Reason: ${err.message}`);
    console.error('  Start MySQL, then set DB_PASSWORD in backend/.env and run "node start.js" again.');
    process.exitCode = 1;
    return;
  }

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`✔ Marketplace API running at http://localhost:${PORT}`);
    console.log(`✔ Health check: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`✘ Port ${PORT} is already in use. Stop the existing server or change PORT in backend/.env.`);
    } else {
      console.error(`✘ Server could not start: ${err.message}`);
    }
    process.exitCode = 1;
  });

  // ---------- Auction scheduler ----------
  // Opens SCHEDULED auctions whose start time has arrived and closes OPEN
  // auctions whose end time has passed (winner selection, reserve check,
  // notifications — see auction.service.js#closeAuctionById). Every tick
  // is idempotent, so overlapping ticks or a slow closing auction can never
  // double-run. Individual auction pages also lazily self-sync on read
  // (see auction.service.js#syncAuctionIfDue), so results are correct even
  // in the seconds between ticks.
  const SCHEDULER_INTERVAL_MS = Number(process.env.AUCTION_SCHEDULER_INTERVAL_MS) || 15000;
  setInterval(() => {
    auctionService.runScheduler().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('✘ Auction scheduler tick failed:', err.message);
    });
  }, SCHEDULER_INTERVAL_MS);
}

start();

module.exports = app;
