const express = require('express');
const productController = require('../controllers/product.controller');
const { authenticate, authenticateOptional, authorize, authorizeSellerApproved } = require('../middleware/auth');
const { handleProductImageUpload } = require('../middleware/upload');

const router = express.Router();

// GET /api/products - public, only ACTIVE_SHOP + ACTIVE_AUCTION products
router.get('/', productController.list);

// POST /api/products/upload-images - standalone image upload endpoint (Requires Approved Seller)
router.post('/upload-images', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, handleProductImageUpload('images', 8), productController.uploadImages);

// GET /api/products/my - SELLER's own products, any status. Must be
// registered BEFORE '/:id' or Express would treat "my" as an :id.
router.get('/my', authenticate, authorize('SELLER', 'ADMIN'), productController.listMine);

// GET /api/products/:id - public, but shows drafts to their owner/admin too
router.get('/:id', authenticateOptional, productController.getById);

// POST /api/products - create a new DRAFT product (Requires Approved Seller)
router.post('/', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, handleProductImageUpload('images', 8), productController.create);

// PUT /api/products/:id - edit editable fields (not status)
router.put('/:id', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, handleProductImageUpload('images', 8), productController.update);

// POST /api/products/:id/images/:imageId/primary - set primary product image
router.post('/:id/images/:imageId/primary', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, productController.setPrimaryImage);

// DELETE /api/products/:id/images/:imageId - remove single image from product
router.delete('/:id/images/:imageId', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, productController.deleteImage);

// DELETE /api/products/:id - only while status = DRAFT
router.delete('/:id', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, productController.remove);

// GET /api/products/:id/transitions - which manual status changes are available right now
router.get('/:id/transitions', authenticate, authorize('SELLER', 'ADMIN'), productController.availableTransitions);

// PATCH /api/products/:id/status - { status, reason? } - goes through the state machine
router.patch('/:id/status', authenticate, authorize('SELLER', 'ADMIN'), authorizeSellerApproved, productController.changeStatus);

module.exports = router;
