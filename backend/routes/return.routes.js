const express = require('express');
const returnController = require('../controllers/return.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/returns/mine - BUYER: your own return requests.
router.get('/mine', authenticate, authorize('BUYER'), returnController.mine);

// GET /api/returns/seller - SELLER/ADMIN: return requests on your products. ?status=REQUESTED|APPROVED|...
router.get('/seller', authenticate, authorize('SELLER', 'ADMIN'), returnController.forSeller);

// GET /api/returns - ADMIN: every return request platform-wide.
router.get('/', authenticate, authorize('ADMIN'), returnController.all);

// POST /api/returns - BUYER: { orderItemId, reason } - request a return on a delivered item.
router.post('/', authenticate, authorize('BUYER'), returnController.request);

// PATCH /api/returns/:id/respond - SELLER/ADMIN: { decision: 'APPROVE' | 'REJECT' }
router.patch('/:id/respond', authenticate, authorize('SELLER', 'ADMIN'), returnController.respond);

// PATCH /api/returns/:id/picked-up - SELLER/ADMIN: confirm the item was physically received back.
router.patch('/:id/picked-up', authenticate, authorize('SELLER', 'ADMIN'), returnController.pickedUp);

// PATCH /api/returns/:id/refund - ADMIN: process the refund, closing the loop.
router.patch('/:id/refund', authenticate, authorize('ADMIN'), returnController.refund);

module.exports = router;
