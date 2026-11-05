const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const assert = require('assert');
const { pool, checkConnection } = require('../config/db');
const authService = require('../services/auth.service');
const kycService = require('../services/kyc.service');
const auctionService = require('../services/auction.service');
const walletModel = require('../models/wallet.model');

async function runTests() {
  console.log('--- Starting Auction Authentication + KYC + Bidding Tests ---');

  await checkConnection();

  const rand = Math.floor(Math.random() * 90000) + 10000;
  const buyerEmail = `bidder_${rand}@test.com`;
  const sellerEmail = `seller_${rand}@test.com`;
  const adminEmail = `admin_${rand}@test.com`;
  const password = 'Password@123';

  // 1. Create Seller & Buyer
  console.log('1. Registering Seller & Buyer...');
  const sellerAuth = await authService.register({
    name: `Seller ${rand}`,
    email: sellerEmail,
    password,
    phone: '9800000001',
    role: 'SELLER',
  });

  const buyerAuth = await authService.register({
    name: `Bidder ${rand}`,
    email: buyerEmail,
    password,
    phone: '9800000002',
    role: 'BUYER',
  });

  assert(buyerAuth.user.bidder_profile, 'Bidder profile should be attached');
  assert.strictEqual(buyerAuth.user.bidder_profile.bidder_status, 'ACTIVE');
  assert.strictEqual(buyerAuth.user.bidder_profile.kyc_status, 'NOT_STARTED');
  console.log('✔ Bidder registration successfully initialized bidder_profile with KYC NOT_STARTED.');

  // 2. Create product and auction
  console.log('2. Creating product and auction...');
  const [catRows] = await pool.query('SELECT id FROM categories LIMIT 1');
  const catId = catRows[0] ? catRows[0].id : 1;

  const [prodRes] = await pool.query(
    `INSERT INTO products (seller_id, category_id, title, description, price, status)
     VALUES (:sellerId, :catId, :title, 'Test item for KYC auction', 5000.00, 'ACTIVE_SHOP')`,
    { sellerId: sellerAuth.user.id, catId, title: `Vintage Watch ${rand}` }
  );
  const productId = prodRes.insertId;

  const startsAt = new Date(Date.now() - 60000).toISOString(); // started 1 min ago
  const endsAt = new Date(Date.now() + 3600000).toISOString(); // ends in 1 hour

  const auction = await auctionService.shiftToAuction(sellerAuth.user, {
    productId,
    startingPrice: 1000,
    reservePrice: 1500,
    bidIncrement: 100,
    startsAt,
    endsAt,
  });
  console.log(`✔ Auction #${auction.id} created and OPEN.`);

  // 3. Fund buyer wallet
  await walletModel.getOrCreate(null, buyerAuth.user.id);
  await pool.query(
    'UPDATE wallet_balances SET total_balance = 10000 WHERE user_id = :userId',
    { userId: buyerAuth.user.id }
  );

  // 4. Test Bidding with KYC NOT_STARTED -> Should fail with KYC_REQUIRED
  console.log('3. Testing bid placement with KYC NOT_STARTED...');
  let kycReqFailed = false;
  try {
    await auctionService.placeBid(buyerAuth.user, auction.id, 1200);
  } catch (err) {
    kycReqFailed = true;
    assert.strictEqual(err.code, 'KYC_REQUIRED', 'Error code should be KYC_REQUIRED');
    console.log(`✔ Blocked as expected: ${err.message} (code: ${err.code})`);
  }
  assert(kycReqFailed, 'Bid placement must fail when KYC is NOT_STARTED');

  // 5. Submit KYC -> status becomes PENDING
  console.log('4. Submitting KYC...');
  const kycSubmit = await kycService.submitKyc(buyerAuth.user, {
    fullLegalName: `Bidder ${rand} Legal`,
    dateOfBirth: '1995-05-15',
    mobileNumber: '9800000002',
    addressLine: '123 Market Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    idType: 'AADHAAR',
    idNumber: '1234 5678 9012',
  });
  assert.strictEqual(kycSubmit.kycStatus, 'PENDING');
  console.log('✔ KYC submitted, status is PENDING.');

  // 6. Test Bidding with KYC PENDING -> Should fail with KYC_PENDING
  console.log('5. Testing bid placement with KYC PENDING...');
  let kycPendingFailed = false;
  try {
    await auctionService.placeBid(buyerAuth.user, auction.id, 1200);
  } catch (err) {
    kycPendingFailed = true;
    assert.strictEqual(err.code, 'KYC_PENDING', 'Error code should be KYC_PENDING');
    console.log(`✔ Blocked as expected: ${err.message} (code: ${err.code})`);
  }
  assert(kycPendingFailed, 'Bid placement must fail when KYC is PENDING');

  // 7. Admin Review -> Approve KYC to VERIFIED
  console.log('6. Admin approving KYC...');
  const adminUser = { id: 1, name: 'Admin', role: 'ADMIN' };
  const reviewResult = await kycService.reviewKyc(adminUser, kycSubmit.kycId, {
    status: 'VERIFIED',
    reason: 'Identity verified successfully.',
  });
  assert.strictEqual(reviewResult.status, 'VERIFIED');
  console.log('✔ KYC approved, bidder profile is now VERIFIED.');

  // 8. Place Bid as VERIFIED Bidder -> Should succeed!
  console.log('7. Placing bid as VERIFIED bidder...');
  const bidResult = await auctionService.placeBid(buyerAuth.user, auction.id, 1200);
  assert(bidResult.bidId, 'Bid should be created');
  assert.strictEqual(Number(bidResult.current_price), 1200);
  assert.strictEqual(bidResult.walletAfter.reserved_balance, 1200);
  assert.strictEqual(bidResult.walletAfter.available_balance, 8800);
  console.log(`✔ Bid placed successfully! Bid #${bidResult.bidId} at ₹${bidResult.current_price}. Reserved: ₹${bidResult.walletAfter.reserved_balance}`);

  console.log('--------------------------------------------------------------');
  console.log('ALL AUTHENTICATION, KYC, AND PROTECTED BIDDING TESTS PASSED! ✔');
  console.log('--------------------------------------------------------------');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('✘ Test failure:', err);
  process.exit(1);
});
