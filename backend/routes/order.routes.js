const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate); // every order route requires a logged-in user

// POST /api/orders - checkout the current cart. { addressId, paymentMethod }
router.post('/', orderController.checkout);

// GET /api/orders/my - the logged-in user's own orders (as a buyer)
router.get('/my', orderController.listMine);

// GET /api/orders/my-sales - orders containing items this seller sold
router.get('/my-sales', authorize('SELLER', 'ADMIN'), orderController.listMySales);

// GET /api/orders/:id - buyer, an involved seller, or admin only (enforced in the service)
router.get('/:id', orderController.getById);

// GET /api/orders/:id/transitions - which status changes are available to *this* caller right now
router.get('/:id/transitions', orderController.availableTransitions);

// PATCH /api/orders/:id/status - { status, note? } - goes through the order state machine
router.patch('/:id/status', orderController.changeStatus);

module.exports = router;
