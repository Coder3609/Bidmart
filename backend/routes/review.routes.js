const express = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/product/:productId - public: reviews + rating summary for a product.
router.get('/product/:productId', reviewController.byProduct);

// GET /api/reviews/pending - BUYER: delivered order items with no review yet.
router.get('/pending', authenticate, authorize('BUYER'), reviewController.pending);

// GET /api/reviews/mine - BUYER: reviews you've written.
router.get('/mine', authenticate, authorize('BUYER'), reviewController.mine);

// GET /api/reviews/seller - SELLER/ADMIN: reviews on your products
router.get('/seller', authenticate, authorize('SELLER', 'ADMIN'), reviewController.forSeller);

// POST /api/reviews - BUYER: { orderItemId, rating, comment? }
router.post('/', authenticate, authorize('BUYER'), reviewController.create);

module.exports = router;

