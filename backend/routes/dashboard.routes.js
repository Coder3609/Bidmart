const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Each endpoint is scoped to req.user.id inside the service — a buyer can
// never pull another buyer's stats, same for sellers. Admin is unscoped
// (marketplace-wide) and locked to the ADMIN role only.
router.get('/buyer', authenticate, authorize('BUYER'), dashboardController.buyer);
router.get('/seller', authenticate, authorize('SELLER', 'ADMIN'), dashboardController.seller);
router.get('/seller/chart', authenticate, authorize('SELLER', 'ADMIN'), dashboardController.sellerChart);
router.get('/admin', authenticate, authorize('ADMIN'), dashboardController.admin);

module.exports = router;

