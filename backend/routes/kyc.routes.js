const express = require('express');
const kycController = require('../controllers/kyc.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/kyc/status - get current user's KYC and bidder status
router.get('/status', authenticate, kycController.getStatus);

// GET /api/kyc/history - get current user's KYC submission audit history
router.get('/history', authenticate, kycController.getHistory);

// POST /api/kyc/submit - submit KYC document & details for review
router.post('/submit', authenticate, authorize('BUYER', 'ADMIN'), kycController.submit);

// GET /api/kyc/admin/pending - list pending KYC verifications for admin review
router.get('/admin/pending', authenticate, authorize('ADMIN'), kycController.listPending);

// POST /api/kyc/admin/:id/review - admin approve / reject / request update
router.post('/admin/:id/review', authenticate, authorize('ADMIN'), kycController.review);

module.exports = router;
