const auctionModel = require('../models/auction.model');
const bidModel = require('../models/bid.model');
const productModel = require('../models/product.model');
const inventoryModel = require('../models/inventory.model');
const addressModel = require('../models/address.model');
const orderModel = require('../models/order.model');
const paymentModel = require('../models/payment.model');
const notificationModel = require('../models/notification.model');
const walletModel = require('../models/wallet.model');
const bidderModel = require('../models/bidder.model');
const { withTransaction, pool } = require('../config/db');
const { ApiError } = require('../utils/apiResponse');
const stateMachine = require('../state-machine/productStateMachine');
const { isValidPrice, isValidDate } = require('../utils/validators');

const PAYMENT_METHODS = ['COD', 'CARD', 'UPI', 'NET_BANKING', 'WALLET'];

function isOwnerOrAdmin(product, user) {
  return user.role === 'ADMIN' || product.seller_id === user.id;
}

function assertOwnerOrAdmin(product, user) {
  if (!isOwnerOrAdmin(product, user)) {
    throw new ApiError('You do not have permission to manage this product\'s auction.', 403, 'FORBIDDEN');
  }
}

function validateAuctionInput({ startingPrice, reservePrice, bidIncrement, startsAt, endsAt }) {
  if (!isValidPrice(startingPrice)) {
    throw new ApiError('Starting price must be a positive number.', 400, 'INVALID_STARTING_PRICE');
  }
  if (!isValidPrice(bidIncrement)) {
    throw new ApiError('Bid increment must be a positive number.', 400, 'INVALID_BID_INCREMENT');
  }
  if (reservePrice !== undefined && reservePrice !== null && reservePrice !== '') {
    if (!isValidPrice(reservePrice)) {
      throw new ApiError('Reserve price must be a positive number.', 400, 'INVALID_RESERVE_PRICE');
    }
    if (Number(reservePrice) < Number(startingPrice)) {
      throw new ApiError('Reserve price cannot be lower than the starting price.', 400, 'RESERVE_BELOW_STARTING');
    }
  }
  if (!isValidDate(startsAt) || !isValidDate(endsAt)) {
    throw new ApiError('Start and end time must be valid dates.', 400, 'INVALID_DATE');
  }
  const starts = new Date(startsAt);
  const ends = new Date(endsAt);
  if (ends <= starts) {
    throw new ApiError('End time must be after the start time.', 400, 'INVALID_DATE_RANGE');
  }
  if (ends.getTime() <= Date.now()) {
    throw new ApiError('End time must be in the future.', 400, 'END_TIME_IN_PAST');
  }
}

/**
 * Seller action: move a Shop product into the auction flow.
 * ACTIVE_SHOP -> SHIFTING_TO_AUCTION happens here (a SYSTEM transition —
 * the auction service is the trusted caller the state machine comment
 * refers to, not the generic manual status-change endpoint). If the
 * auction's start time has already arrived, we immediately continue
 * SHIFTING_TO_AUCTION -> ACTIVE_AUCTION and open the auction for bidding.
 */
async function shiftToAuction(seller, { productId, startingPrice, reservePrice, bidIncrement, startsAt, endsAt }) {
  validateAuctionInput({ startingPrice, reservePrice, bidIncrement, startsAt, endsAt });

  return withTransaction(async (conn) => {
    const product = await productModel.findByIdForUpdate(conn, productId);
    if (!product) {
      throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }
    assertOwnerOrAdmin(product, seller);

    if (product.status !== 'ACTIVE_SHOP') {
      throw new ApiError(
        `Only products currently in the Shop (ACTIVE_SHOP) can be moved to auction. This product is ${product.status}.`,
        409,
        'PRODUCT_NOT_SHOP_ACTIVE'
      );
    }

    const existing = await auctionModel.findActiveByProduct(productId);
    if (existing) {
      throw new ApiError('This product already has an active or scheduled auction.', 409, 'AUCTION_ALREADY_ACTIVE');
    }

    await stateMachine.transitionProduct(conn, {
      productId,
      fromStatus: 'ACTIVE_SHOP',
      toStatus: 'SHIFTING_TO_AUCTION',
      changedBy: seller.id,
      reason: 'Seller moved product to auction',
      isSystemCall: true,
    });

    const opensNow = new Date(startsAt).getTime() <= Date.now();
    const initialStatus = opensNow ? 'OPEN' : 'SCHEDULED';

    const auctionId = await auctionModel.create(conn, {
      productId,
      startingPrice,
      reservePrice: reservePrice || null,
      bidIncrement,
      startsAt,
      endsAt,
      status: initialStatus,
    });

    if (opensNow) {
      await stateMachine.transitionProduct(conn, {
        productId,
        fromStatus: 'SHIFTING_TO_AUCTION',
        toStatus: 'ACTIVE_AUCTION',
        changedBy: seller.id,
        reason: 'Auction opened immediately (start time already reached)',
        isSystemCall: true,
      });
    }

    return getAuctionRow(conn, auctionId);
  });
}

async function getAuctionRow(conn, id) {
  const runner = conn || pool;
  const [rows] = await runner.query(
    `SELECT au.*, p.title FROM auctions au JOIN products p ON p.id = au.product_id WHERE au.id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

/**
 * Lazily brings a single auction up to date if its scheduled start/end time
 * has already passed. Called before returning auction detail so the state
 * is always correct for the caller even between scheduler ticks — the
 * background scheduler (see `runScheduler`) still handles bulk open/close.
 */
async function syncAuctionIfDue(id) {
  const raw = await auctionModel.findByAuctionIdRaw(null, id);
  if (!raw) return;

  if (raw.status === 'SCHEDULED' && new Date(raw.starts_at).getTime() <= Date.now()) {
    await openAuctionById(id);
  }
  const current = await auctionModel.findByAuctionIdRaw(null, id);
  if (current && current.status === 'OPEN' && new Date(current.ends_at).getTime() <= Date.now()) {
    await closeAuctionById(id);
  }
}

async function openAuctionById(id) {
  return withTransaction(async (conn) => {
    const auction = await auctionModel.findByIdForUpdate(conn, id);
    if (!auction || auction.status !== 'SCHEDULED') return; // already handled — idempotent
    if (new Date(auction.starts_at).getTime() > Date.now()) return;

    await auctionModel.updateStatus(conn, id, { status: 'OPEN' });

    const product = await productModel.findByIdForUpdate(conn, auction.product_id);
    if (product && product.status === 'SHIFTING_TO_AUCTION') {
      await stateMachine.transitionProduct(conn, {
        productId: auction.product_id,
        fromStatus: 'SHIFTING_TO_AUCTION',
        toStatus: 'ACTIVE_AUCTION',
        changedBy: null,
        reason: 'Scheduled auction start time reached',
        isSystemCall: true,
      });
    }
  });
}

/**
 * Closes one auction. Idempotent: if it's already CLOSED this is a no-op,
 * so running the scheduler twice (or a lazy sync racing the interval)
 * never creates a duplicate order.
 *
 * Steps follow the spec: lock auction, stop new bids (status flips to
 * CLOSED under the lock), find the highest bid, check the reserve, select
 * a winner (or not), update auction/product, notify everyone involved.
 * Order creation for a win is a separate step the winner completes
 * themselves (see completeAuctionOrder) since we don't have a delivery
 * address to use until they choose one — but the product/auction status
 * already correctly reflects AUCTION_WON at the end of this function.
 */
async function closeAuctionById(id) {
  return withTransaction(async (conn) => {
    const auction = await auctionModel.findByIdForUpdate(conn, id);
    if (!auction || auction.status !== 'OPEN') {
      return getAuctionRow(conn, id); // already closed elsewhere — idempotent no-op
    }

    const product = await productModel.findByIdForUpdate(conn, auction.product_id);
    const highestBid = await bidModel.findCurrentWinning(conn, id);

    const reserveMet = !auction.reserve_price || (highestBid && Number(highestBid.amount) >= Number(auction.reserve_price));
    const hasWinner = Boolean(highestBid) && reserveMet;

    await auctionModel.updateStatus(conn, id, {
      status: 'CLOSED',
      closed_at: new Date(),
      winning_bid_id: hasWinner ? highestBid.id : null,
    });

    await stateMachine.transitionProduct(conn, {
      productId: auction.product_id,
      fromStatus: 'ACTIVE_AUCTION',
      toStatus: 'AUCTION_ENDED',
      changedBy: null,
      reason: 'Auction end time reached',
      isSystemCall: true,
    });

    const notifications = [];

    if (hasWinner) {
      await bidModel.markStatus(conn, highestBid.id, 'WON');
      await bidModel.markOthersStatus(conn, id, highestBid.id, 'LOST', ['WINNING', 'OUTBID', 'ACTIVE']);

      await stateMachine.transitionProduct(conn, {
        productId: auction.product_id,
        fromStatus: 'AUCTION_ENDED',
        toStatus: 'AUCTION_WON',
        changedBy: null,
        reason: `Won by bid #${highestBid.id} at ${highestBid.amount}`,
        isSystemCall: true,
      });

      notifications.push({
        userId: highestBid.bidder_id,
        type: 'AUCTION_WON',
        title: 'You won an auction!',
        message: `Your bid of ₹${highestBid.amount} won the auction for "${product.title}". Complete your order to receive it.`,
        metadata: { auctionId: id, productId: product.id },
      });
      notifications.push({
        userId: product.seller_id,
        type: 'AUCTION_SOLD',
        title: 'Your auction sold',
        message: `"${product.title}" sold for ₹${highestBid.amount}.`,
        metadata: { auctionId: id, productId: product.id },
      });

      const losers = await bidModel.listDistinctBidderIds(conn, id, highestBid.bidder_id);
      losers.forEach((userId) => notifications.push({
        userId,
        type: 'AUCTION_LOST',
        title: 'Auction ended',
        message: `The auction for "${product.title}" has ended. You did not win this time.`,
        metadata: { auctionId: id, productId: product.id },
      }));
    } else {
      if (highestBid) {
        await bidModel.markOthersStatus(conn, id, 0, 'LOST', ['WINNING', 'OUTBID', 'ACTIVE']);
      }

      await stateMachine.transitionProduct(conn, {
        productId: auction.product_id,
        fromStatus: 'AUCTION_ENDED',
        toStatus: 'AUCTION_UNSOLD',
        changedBy: null,
        reason: highestBid ? 'Reserve price not met' : 'No bids received',
        isSystemCall: true,
      });

      notifications.push({
        userId: product.seller_id,
        type: 'AUCTION_UNSOLD',
        title: 'Your auction ended unsold',
        message: highestBid
          ? `"${product.title}" did not sell — the highest bid didn't meet your reserve price.`
          : `"${product.title}" received no bids.`,
        metadata: { auctionId: id, productId: product.id },
      });

      const bidders = await bidModel.listDistinctBidderIds(conn, id, 0);
      bidders.forEach((userId) => notifications.push({
        userId,
        type: 'AUCTION_UNSOLD',
        title: 'Auction ended without a sale',
        message: `The auction for "${product.title}" ended without meeting the reserve price.`,
        metadata: { auctionId: id, productId: product.id },
      }));
    }

    await notificationModel.createMany(conn, notifications);

    return getAuctionRow(conn, id);
  });
}

/**
 * Background scheduler tick — call on an interval from server.js.
 * Opens any SCHEDULED auctions whose start time has arrived, then closes
 * any OPEN auctions whose end time has passed. Safe to run concurrently
 * with lazy per-request syncs since every step is wrapped in its own
 * row-locked, idempotent transaction.
 */
async function runScheduler() {
  const toOpen = await auctionModel.listDueToOpen();
  for (const id of toOpen) {
    // eslint-disable-next-line no-await-in-loop
    await openAuctionById(id);
  }
  const toClose = await auctionModel.listDueToClose();
  for (const id of toClose) {
    // eslint-disable-next-line no-await-in-loop
    await closeAuctionById(id);
  }
  return { opened: toOpen.length, closed: toClose.length };
}

async function getAuctionDetail(id, requestingUser) {
  await syncAuctionIfDue(id);

  const auction = await auctionModel.findById(id);
  if (!auction) {
    throw new ApiError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }

  let myBid = null;
  if (requestingUser) {
    const [rows] = await pool.query(
      `SELECT * FROM bids WHERE auction_id = :id AND bidder_id = :userId ORDER BY amount DESC LIMIT 1`,
      { id, userId: requestingUser.id }
    );
    myBid = rows[0] || null;
  }

  const minNextBid = auction.status === 'OPEN'
    ? await computeMinNextBid(auction)
    : null;

  return { ...auction, myBid, minNextBid };
}

async function computeMinNextBid(auction) {
  const highest = await bidModel.findCurrentWinning(null, auction.id);
  return highest ? Number(highest.amount) + Number(auction.bid_increment) : Number(auction.starting_price);
}

/** Used to hand off from a product page to its auction page (product.html -> auction-detail.html). */
async function getAuctionByProduct(productId) {
  const active = await auctionModel.findActiveByProduct(productId);
  const target = active || (await auctionModel.findLatestByProduct(productId));
  if (!target) {
    throw new ApiError('No auction exists for this product.', 404, 'AUCTION_NOT_FOUND');
  }
  return getAuctionDetail(target.id, null);
}

async function listAuctions(query = {}) {
  const { status, page, limit, sort, q, categoryId, sellerId, minBid, maxBid, condition, endingSoon, startingSoon } = query;
  return auctionModel.list({
    status: status || null,
    page,
    limit,
    sort,
    q,
    categoryId,
    sellerId,
    minBid,
    maxBid,
    condition,
    endingSoon: endingSoon === 'true' || endingSoon === true,
    startingSoon: startingSoon === 'true' || startingSoon === true,
  });
}

async function listMyAuctions(seller, query) {
  const { page, limit } = query;
  return auctionModel.listBySeller(seller.id, { page, limit });
}

async function listBidHistory(auctionId) {
  const auction = await auctionModel.findById(auctionId);
  if (!auction) {
    throw new ApiError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
  }
  return bidModel.listByAuction(auctionId, { limit: 50 });
}

async function listMyBids(buyer, query) {
  const { page, limit } = query;
  return bidModel.listByBidder(buyer.id, { page, limit });
}

/**
 * Places a bid. Locking the parent `auctions` row FOR UPDATE up front
 * serializes every bid on this auction through one connection at a time —
 * that's what prevents two near-simultaneous bids from both thinking they
 * are the new highest bidder (rule #13, concurrent bidding).
 */
async function placeBid(bidder, auctionId, rawAmount, bidderInfo = {}) {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError('Bid amount must be a positive number.', 400, 'INVALID_BID_AMOUNT');
  }

  const bidderName = bidderInfo.name ? String(bidderInfo.name).trim() : (bidder.name || null);
  const bidderAge = bidderInfo.age ? Number(bidderInfo.age) : null;

  return withTransaction(async (conn) => {
    const auction = await auctionModel.findByIdForUpdate(conn, auctionId);
    if (!auction) {
      throw new ApiError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }

    const now = Date.now();
    if (auction.status === 'SCHEDULED' && new Date(auction.starts_at).getTime() <= now) {
      // Start time reached but the scheduler hasn't ticked yet — open it inline, then continue.
      await auctionModel.updateStatus(conn, auctionId, { status: 'OPEN' });
      auction.status = 'OPEN';
      const product = await productModel.findByIdForUpdate(conn, auction.product_id);
      if (product && product.status === 'SHIFTING_TO_AUCTION') {
        await stateMachine.transitionProduct(conn, {
          productId: auction.product_id,
          fromStatus: 'SHIFTING_TO_AUCTION',
          toStatus: 'ACTIVE_AUCTION',
          changedBy: null,
          reason: 'Auction opened on first bid attempt',
          isSystemCall: true,
        });
      }
    }

    if (auction.status !== 'OPEN') {
      throw new ApiError(`This auction is not open for bidding (status: ${auction.status}).`, 409, 'AUCTION_NOT_OPEN');
    }
    if (new Date(auction.ends_at).getTime() <= now) {
      throw new ApiError('This auction has already ended.', 409, 'AUCTION_ENDED');
    }
    if (new Date(auction.starts_at).getTime() > now) {
      throw new ApiError('This auction has not started yet.', 409, 'AUCTION_NOT_STARTED');
    }

    const product = await productModel.findByIdForUpdate(conn, auction.product_id);
    if (!product) {
      throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }
    if (product.seller_id === bidder.id) {
      throw new ApiError('You cannot bid on your own auction.', 403, 'OWN_PRODUCT');
    }
    if (bidder.role !== 'BUYER') {
      throw new ApiError('Only buyer accounts can place bids.', 403, 'ONLY_BUYERS_CAN_BID');
    }

    // ── Bidder Profile & KYC Eligibility Check ──────────────────────────────
    const bidderProfile = await bidderModel.getOrCreate(conn, bidder.id, {
      displayName: bidder.name,
      mobileNumber: bidder.phone,
    });

    if (bidderProfile.bidder_status !== 'ACTIVE') {
      throw new ApiError('Your bidder account is currently suspended.', 403, 'BIDDER_SUSPENDED');
    }

    if (bidderProfile.kyc_status === 'NOT_STARTED') {
      throw new ApiError('Complete KYC verification before placing bids.', 403, 'KYC_REQUIRED');
    } else if (bidderProfile.kyc_status === 'PENDING') {
      throw new ApiError('Your KYC verification is currently under review.', 403, 'KYC_PENDING');
    } else if (bidderProfile.kyc_status === 'REJECTED') {
      throw new ApiError('Your KYC requires an update before you can bid.', 403, 'KYC_REJECTED');
    } else if (bidderProfile.kyc_status === 'REQUIRES_UPDATE') {
      throw new ApiError('Your KYC requires an update before you can bid.', 403, 'KYC_REQUIRES_UPDATE');
    } else if (bidderProfile.kyc_status !== 'VERIFIED') {
      throw new ApiError('KYC verification is required to participate in auctions.', 403, 'KYC_REQUIRED');
    }

    const currentWinning = await bidModel.findCurrentWinning(conn, auctionId);
    const minNextBid = currentWinning
      ? Number(currentWinning.amount) + Number(auction.bid_increment)
      : Number(auction.starting_price);

    if (amount < minNextBid) {
      throw new ApiError(
        `Bid must be at least ₹${minNextBid.toLocaleString('en-IN')}.`,
        409,
        'BID_TOO_LOW'
      );
    }
    // Note: Allow self-outbidding / multiple bids with custom bidder identities
    // (e.g., testing or user wanting to increase their ceiling offer).

    // ── Wallet: check available balance ──────────────────────────────────────
    // Ensure the bidder has a wallet row (locked for this transaction).
    await walletModel.getOrCreate(conn, bidder.id);
    const wallet = await conn.query(
      'SELECT total_balance, reserved_balance FROM wallet_balances WHERE user_id = :userId FOR UPDATE',
      { userId: bidder.id }
    );
    const walletRow = wallet[0][0] || { total_balance: 0, reserved_balance: 0 };
    const available = Number(walletRow.total_balance) - Number(walletRow.reserved_balance);

    if (available < amount) {
      throw new ApiError(
        `Insufficient available balance. Required: ₹${amount.toLocaleString('en-IN')}. Available: ₹${available.toLocaleString('en-IN')}.`,
        402,
        'INSUFFICIENT_BALANCE'
      );
    }

    // ── Release previous bidder's hold (outbid) ───────────────────────────────
    if (currentWinning) {
      // Release previous winning bidder's wallet hold for this auction
      const prevHold = await walletModel.findActiveHoldForAuction(conn, currentWinning.bidder_id, auctionId);
      if (prevHold) {
        await walletModel.releaseHold(conn, prevHold.id);
        await walletModel.releaseReserve(conn, currentWinning.bidder_id, Number(prevHold.amount));
        await walletModel.createTransaction(conn, {
          userId: currentWinning.bidder_id,
          type: 'AUCTION_HOLD_RELEASE',
          amount: Number(prevHold.amount),
          referenceType: 'auction',
          referenceId: auctionId,
          description: `Hold released — outbid on "${product.title}"`,
        });
      }
      await bidModel.markStatus(conn, currentWinning.id, 'OUTBID');
      await notificationModel.create(conn, {
        userId: currentWinning.bidder_id,
        type: 'OUTBID',
        title: 'You were outbid',
        message: `Someone placed a higher bid on "${product.title}". The current price is now ₹${amount.toLocaleString('en-IN')}.`,
        metadata: { auctionId, productId: product.id },
      });
    }

    // ── Create new bid + reserve wallet funds ────────────────────────────────
    const bidId = await bidModel.create(conn, { 
      auctionId, 
      bidderId: bidder.id, 
      amount, 
      bidderName: bidderName || bidder.name, 
      bidderAge: bidderAge,
      status: 'WINNING' 
    });
    await auctionModel.updateStatus(conn, auctionId, { current_price: amount });

    // Reserve funds in wallet
    await conn.query(
      'UPDATE wallet_balances SET reserved_balance = reserved_balance + :amount WHERE user_id = :userId',
      { amount, userId: bidder.id }
    );
    await walletModel.createHold(conn, { userId: bidder.id, auctionId, bidId, amount });
    await walletModel.createTransaction(conn, {
      userId: bidder.id,
      type: 'AUCTION_HOLD',
      amount,
      referenceType: 'auction',
      referenceId: auctionId,
      description: `Bid hold on "${product.title}"`,
    });

    await notificationModel.create(conn, {
      userId: product.seller_id,
      type: 'NEW_BID',
      title: 'New bid received',
      message: `${bidder.name} bid ₹${amount.toLocaleString('en-IN')} on "${product.title}".`,
      metadata: { auctionId, productId: product.id },
    });

    const updatedWallet = await conn.query(
      'SELECT total_balance, reserved_balance FROM wallet_balances WHERE user_id = :userId',
      { userId: bidder.id }
    );
    const uw = updatedWallet[0][0] || { total_balance: 0, reserved_balance: 0 };

    return getAuctionRow(conn, auctionId).then((row) => ({
      ...row,
      bidId,
      walletAfter: {
        total_balance: Number(uw.total_balance),
        reserved_balance: Number(uw.reserved_balance),
        available_balance: Number(uw.total_balance) - Number(uw.reserved_balance),
      },
    }));
  });
}


/**
 * Seller action for an AUCTION_UNSOLD product: start a fresh auction round
 * for the SAME product (never a new product row). AUCTION_UNSOLD ->
 * ACTIVE_AUCTION is tagged OWNER_OR_ADMIN in the state machine, so this is
 * a manual transition, not a system one — the seller is explicitly opting
 * back into an auction.
 */
async function relistAuction(seller, productId, { startingPrice, reservePrice, bidIncrement, startsAt, endsAt }) {
  validateAuctionInput({ startingPrice, reservePrice, bidIncrement, startsAt, endsAt });

  return withTransaction(async (conn) => {
    const product = await productModel.findByIdForUpdate(conn, productId);
    if (!product) {
      throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }
    assertOwnerOrAdmin(product, seller);

    if (product.status !== 'AUCTION_UNSOLD') {
      throw new ApiError('Only unsold auction products can be relisted.', 409, 'PRODUCT_NOT_UNSOLD');
    }

    const opensNow = new Date(startsAt).getTime() <= Date.now();
    const initialStatus = opensNow ? 'OPEN' : 'SCHEDULED';

    const auctionId = await auctionModel.create(conn, {
      productId,
      startingPrice,
      reservePrice: reservePrice || null,
      bidIncrement,
      startsAt,
      endsAt,
      status: initialStatus,
    });

    await stateMachine.transitionProduct(conn, {
      productId,
      fromStatus: 'AUCTION_UNSOLD',
      toStatus: 'ACTIVE_AUCTION',
      changedBy: seller.id,
      reason: 'Seller relisted for a new auction round',
      isSystemCall: false,
    });

    return getAuctionRow(conn, auctionId);
  });
}

/**
 * Seller action to update active auction settings (reserve price, bid increment, or end time).
 */
async function updateAuctionSettings(seller, auctionId, { reservePrice, bidIncrement, endsAt }) {
  return withTransaction(async (conn) => {
    const auction = await auctionModel.findById(auctionId);
    if (!auction) {
      throw new ApiError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }
    const product = await productModel.findById(auction.product_id);
    assertOwnerOrAdmin(product, seller);

    if (auction.status === 'CLOSED') {
      throw new ApiError('Cannot edit settings of a closed auction.', 400, 'AUCTION_CLOSED');
    }

    if (bidIncrement !== undefined && (!isValidPrice(bidIncrement) || Number(bidIncrement) <= 0)) {
      throw new ApiError('Bid increment must be a positive number.', 400, 'INVALID_BID_INCREMENT');
    }

    if (reservePrice !== undefined && reservePrice !== null && reservePrice !== '') {
      if (!isValidPrice(reservePrice)) {
        throw new ApiError('Reserve price must be a positive number.', 400, 'INVALID_RESERVE_PRICE');
      }
    }

    if (endsAt !== undefined) {
      if (!isValidDate(endsAt) || new Date(endsAt).getTime() <= Date.now()) {
        throw new ApiError('End time must be a valid future date.', 400, 'INVALID_DATE');
      }
    }

    await auctionModel.updateAuctionSettings(conn, auctionId, { reservePrice, bidIncrement, endsAt });
    return getAuctionRow(conn, auctionId);
  });
}

/**
 * Seller action for an AUCTION_UNSOLD product: send it back to the Shop
 * instead of relisting. Goes through RETURNED_TO_SHOP first (an explicit,
 * logged state) and then automatically on to ACTIVE_SHOP, matching the
 * lifecycle diagram — the whole history stays in product_state_history.
 */
async function returnToShop(seller, productId) {
  return withTransaction(async (conn) => {
    const product = await productModel.findByIdForUpdate(conn, productId);
    if (!product) {
      throw new ApiError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }
    assertOwnerOrAdmin(product, seller);

    if (product.status !== 'AUCTION_UNSOLD') {
      throw new ApiError('Only unsold auction products can be returned to the shop.', 409, 'PRODUCT_NOT_UNSOLD');
    }

    await stateMachine.transitionProduct(conn, {
      productId,
      fromStatus: 'AUCTION_UNSOLD',
      toStatus: 'RETURNED_TO_SHOP',
      changedBy: seller.id,
      reason: 'Seller chose to return the unsold item to the shop',
      isSystemCall: false,
    });

    await stateMachine.transitionProduct(conn, {
      productId,
      fromStatus: 'RETURNED_TO_SHOP',
      toStatus: 'ACTIVE_SHOP',
      changedBy: null,
      reason: 'Automatic re-entry to shop catalog',
      isSystemCall: true,
    });

    return productModel.findById(productId);
  });
}

/**
 * The winner's step to actually pay for and receive their auction win.
 * Kept as its own explicit action (rather than fully automatic at auction
 * close) because the buyer needs to choose a delivery address, exactly
 * like Shop checkout — the backend has no address to guess at close time.
 *
 * Idempotent: if the product has already moved on to SOLD, we don't create
 * a second order — we just return the one that already exists for this
 * auction (rule #14: closing/completion must never create two orders).
 */
async function completeAuctionOrder(buyer, auctionId, { addressId, paymentMethod }) {
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new ApiError(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}.`, 400, 'INVALID_PAYMENT_METHOD');
  }

  const address = await addressModel.findById(addressId);
  if (!address || address.user_id !== buyer.id) {
    throw new ApiError('Delivery address not found.', 404, 'ADDRESS_NOT_FOUND');
  }

  return withTransaction(async (conn) => {
    const auction = await auctionModel.findByIdForUpdate(conn, auctionId);
    if (!auction || auction.status !== 'CLOSED' || !auction.winning_bid_id) {
      throw new ApiError('This auction has no completed win to pay for.', 409, 'NO_WIN_TO_COMPLETE');
    }

    const winningBid = await bidModel.findById(auction.winning_bid_id);
    if (!winningBid || winningBid.bidder_id !== buyer.id) {
      throw new ApiError('You are not the winner of this auction.', 403, 'NOT_THE_WINNER');
    }

    const product = await productModel.findByIdForUpdate(conn, auction.product_id);

    if (product.status === 'SOLD') {
      // Idempotent replay — the order already exists, just hand it back.
      const [existing] = await conn.query('SELECT id FROM orders WHERE auction_id = :auctionId LIMIT 1', { auctionId });
      if (existing[0]) {
        return { alreadyCompleted: true, orderId: existing[0].id };
      }
    }

    if (product.status !== 'AUCTION_WON') {
      throw new ApiError(`This product is not awaiting payment (status: ${product.status}).`, 409, 'PRODUCT_NOT_AWAITING_PAYMENT');
    }

    const amount = Number(winningBid.amount);

    const orderId = await orderModel.createOrder(conn, {
      buyerId: buyer.id,
      addressId,
      source: 'AUCTION',
      auctionId,
      status: 'CONFIRMED',
      subtotal: amount,
      discount: 0,
      deliveryFee: 0,
      total: amount,
    });

    await orderModel.createOrderItem(conn, {
      orderId,
      productId: product.id,
      sellerId: product.seller_id,
      quantity: 1,
      unitPrice: amount,
    });

    await orderModel.createStatusHistory(conn, {
      orderId, fromStatus: null, toStatus: 'CONFIRMED', changedBy: buyer.id, note: 'Auction win — order placed',
    });

    const paymentStatus = paymentMethod === 'COD' ? 'PENDING' : 'SUCCESS';
    await paymentModel.create(conn, { orderId, method: paymentMethod, amount, status: paymentStatus });

    // Auction wins are single-unit; reflect the sale in inventory the same
    // way a Shop purchase would, without letting available_qty go negative.
    const inventory = await inventoryModel.findByProductId(product.id);
    if (inventory) {
      const newAvailable = Math.max(inventory.available_qty - 1, 0);
      await conn.query(
        'UPDATE inventory SET available_qty = :newAvailable, sold_qty = sold_qty + 1 WHERE product_id = :productId',
        { newAvailable, productId: product.id }
      );
    }

    await stateMachine.transitionProduct(conn, {
      productId: product.id,
      fromStatus: 'AUCTION_WON',
      toStatus: 'SOLD',
      changedBy: buyer.id,
      reason: 'Winner completed payment',
      isSystemCall: true,
    });

    return { alreadyCompleted: false, orderId };
  });
}

module.exports = {
  shiftToAuction,
  getAuctionDetail,
  getAuctionByProduct,
  listAuctions,
  listMyAuctions,
  listBidHistory,
  listMyBids,
  placeBid,
  relistAuction,
  updateAuctionSettings,
  returnToShop,
  completeAuctionOrder,
  runScheduler,
};
