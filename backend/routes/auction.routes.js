const express = require('express');
const auctionController = require('../controllers/auction.controller');
const { authenticate, authenticateOptional, authorize, authorizeSellerApproved } = require('../middleware/auth');

const router = express.Router();

// GET /api/auctions - public listing. ?status=LIVE|SCHEDULED|CLOSED|ALL
router.get('/', auctionController.list);

// GET /api/auctions/my - SELLER's own auctions across all products.
// GET /api/auctions/my-bids - the logged-in BUYER's bid history.
// Both must be registered BEFORE '/:id' or Express treats them as an :id.
router.get('/my', authenticate, authorize('SELLER', 'ADMIN'), auctionController.listMine);
router.get('/my-bids', authenticate, auctionController.listMyBids);

// POST /api/auctions - move an ACTIVE_SHOP product into the auction flow (Requires Approved Seller)
// { productId, startingPrice, reservePrice?, bidIncrement, startsAt, endsAt }
router.post('/', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, auctionController.shiftToAuction);

// POST /api/auctions/relist - start a new auction round for an AUCTION_UNSOLD product.
router.post('/relist', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, auctionController.relist);

// PATCH /api/auctions/:id/settings - seller updates live auction parameters (reservePrice, bidIncrement, endsAt)
router.patch('/:id/settings', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, auctionController.updateSettings);

// POST /api/auctions/return-to-shop - send an AUCTION_UNSOLD product back to the Shop.
router.post('/return-to-shop', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, auctionController.returnToShop);

// POST /api/auctions/run-scheduler - manually tick the open/close scheduler.
// The interval in server.js already runs this automatically; exposed here
// too so the flow can be demoed/tested without waiting for the next tick.
router.post('/run-scheduler', authenticate, authorize('ADMIN'), auctionController.runScheduler);

// GET /api/auctions/by-product/:productId - hand-off from a product page to its auction page.
router.get('/by-product/:productId', auctionController.getByProduct);

// GET /api/auctions/:id - public detail, but reveals "myBid" when logged in.
router.get('/:id', authenticateOptional, auctionController.getById);

// GET /api/auctions/:id/bids - public bid history for one auction.
router.get('/:id/bids', auctionController.getBidHistory);

// POST /api/auctions/:id/bids - { amount } - allows logged-in users (BUYER, SELLER, ADMIN) to bid
router.post('/:id/bids', authenticate, auctionController.placeBid);

// POST /api/auctions/:id/complete-order - the winner chooses an address + payment method.
router.post('/:id/complete-order', authenticate, auctionController.completeOrder);

module.exports = router;
