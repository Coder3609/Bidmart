const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/wallet - get current user's wallet balance + active holds
router.get('/', authenticate, walletController.getWallet);

// POST /api/wallet/deposit - add funds (development: instant deposit)
router.post('/deposit', authenticate, walletController.deposit);

// GET /api/wallet/transactions - paginated transaction history
router.get('/transactions', authenticate, walletController.getTransactions);

module.exports = router;
