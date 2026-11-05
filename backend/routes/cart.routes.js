const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate); // every cart route requires a logged-in user

router.get('/', cartController.getCart);
router.post('/', cartController.addItem);                       // { productId, quantity? }
router.patch('/:productId', cartController.updateItem);         // { quantity }  (0 removes it)
router.delete('/:productId', cartController.removeItem);

module.exports = router;
