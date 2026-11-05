const express = require('express');
const sellerController = require('../controllers/seller.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ----------------------------------------------------------------------
// Seller Authentication & Verification Routes
// ----------------------------------------------------------------------

// POST /api/seller/register  (Dedicated seller registration)
router.post('/register', sellerController.register);

// POST /api/seller/login  (Dedicated seller login)
router.post('/login', sellerController.login);

// GET /api/seller/profile  (Authenticated seller full profile & progress)
router.get('/profile', authenticate, authorize('SELLER', 'ADMIN'), sellerController.getProfile);

// GET /api/seller/status  (Seller application & KYC status)
router.get('/status', authenticate, authorize('SELLER', 'ADMIN'), sellerController.getStatus);

// POST /api/seller/onboarding/step  (Save onboarding step 2-6)
router.post('/onboarding/step', authenticate, authorize('SELLER', 'ADMIN'), sellerController.saveStep);

// PATCH /api/seller/settings  (Update store profile / settings)
router.patch('/settings', authenticate, authorize('SELLER', 'ADMIN'), sellerController.updateSettings);

// ----------------------------------------------------------------------
// Admin Endpoints for Reviewing Seller Applications
// ----------------------------------------------------------------------

// GET /api/seller/admin/applications  (List applications with filters)
router.get('/admin/applications', authenticate, authorize('ADMIN'), sellerController.adminListApplications);

// GET /api/seller/admin/applications/:id  (View detailed application)
router.get('/admin/applications/:id', authenticate, authorize('ADMIN'), sellerController.adminGetApplication);

// POST /api/seller/admin/applications/:id/review  (Approve / Reject / Request Update / Suspend)
router.post('/admin/applications/:id/review', authenticate, authorize('ADMIN'), sellerController.adminReviewApplication);

module.exports = router;
