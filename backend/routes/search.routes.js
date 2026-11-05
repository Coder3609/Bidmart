const express = require('express');
const searchController = require('../controllers/search.controller');
const { authenticateOptional, authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/search?q=... - quick combined preview (top 6 products + top 6 auctions), logs the query.
router.get('/', authenticateOptional, searchController.global_);

// GET /api/search/products - full Shop search with filters (category, price, brand, condition, availability).
// authenticateOptional so a logged-in search gets attributed to that user for "recent searches".
router.get('/products', authenticateOptional, searchController.products);

// GET /api/search/auctions - full Auction search with filters (category, bid range, seller, condition, ending soon, min bids).
router.get('/auctions', authenticateOptional, searchController.auctions);

// GET /api/search/assist?q=... - autocomplete (q given) or recent+popular searches (q omitted).
router.get('/assist', authenticateOptional, searchController.assist);

// DELETE /api/search/recent - clear the logged-in user's recent search history.
router.delete('/recent', authenticate, searchController.clearRecent);

module.exports = router;
