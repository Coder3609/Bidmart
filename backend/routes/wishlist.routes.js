const express = require('express');
const wishlistController = require('../controllers/wishlist.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addItem);              // { productId }
router.delete('/:productId', wishlistController.removeItem);

module.exports = router;
