const express = require('express');
const scanController = require('../controllers/scan.controller');

const router = express.Router();

// GET /api/scan/status - whether barcode/QR lookup and image recognition are configured.
router.get('/status', scanController.status);

// POST /api/scan/lookup - { code } - deterministic barcode/QR/SKU/product-id lookup.
router.post('/lookup', scanController.lookup);

// POST /api/scan/image - { imageBase64 } - honestly reports "not configured" unless a real
// vision provider is wired up (see scan.service.js#isImageRecognitionConfigured).
router.post('/image', scanController.image);

module.exports = router;
