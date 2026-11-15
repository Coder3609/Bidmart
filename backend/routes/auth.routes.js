const express = require('express');
const userModel = require('../models/user.model');
const authController = require('../controllers/auth.controller');
const sellerController = require('../controllers/seller.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/check-email  { email } -> { exists: boolean }
router.post('/check-email', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await userModel.findByEmail((email || '').toLowerCase().trim());
    return res.json({ success: true, exists: !!user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register  { name, email, password, phone?, role? }  -> BUYER or SELLER only
router.post('/register', authController.register);

// POST /api/auth/login  { email, password }
router.post('/login', authController.login);

// POST /api/auth/seller/register  (Dedicated seller registration)
router.post('/seller/register', sellerController.register);

// POST /api/auth/seller/login  (Dedicated seller login)
router.post('/seller/login', sellerController.login);

// POST /api/auth/logout  (stateless - client discards the token)
router.post('/logout', authController.logout);

// GET /api/auth/me  (requires Authorization: Bearer <token>)
router.get('/me', authenticate, authController.me);

// PATCH /api/auth/me (update profile / store settings)
router.patch('/me', authenticate, authController.updateMe);

module.exports = router;

