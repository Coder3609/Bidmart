const productModel = require('../models/product.model');
const { ApiError } = require('../utils/apiResponse');

/**
 * Barcode/QR scanning is NOT AI recognition — it's a deterministic lookup.
 * A barcode encodes a fixed number, a QR code on a product label encodes a
 * fixed string (we standardize on the product's `sku`, or a QR payload
 * shaped like "bidmart:product:<id>" / "bidmart:product:<sku>"). Given the
 * decoded string, we can look the product up directly with no guessing.
 */
async function lookupByCode(rawCode) {
  const code = (rawCode || '').trim();
  if (!code) {
    throw new ApiError('No code was provided to look up.', 400, 'MISSING_CODE');
  }

  // Accept a plain SKU, a plain numeric product id, or a "bidmart:product:<id|sku>" QR payload.
  let candidate = code;
  const qrMatch = code.match(/^bidmart:product:(.+)$/i);
  if (qrMatch) candidate = qrMatch[1];

  let product = null;
  if (/^\d+$/.test(candidate)) {
    product = await productModel.findById(Number(candidate));
  }
  if (!product) {
    product = await productModel.findBySku(candidate);
  }

  if (!product) {
    return { found: false, code, message: 'No product matches that code.' };
  }
  return { found: true, code, product };
}

/**
 * Image-based visual search needs a real computer-vision/ML provider —
 * something this project deliberately does not fake. If no provider is
 * configured (the real state of this demo environment — no network access,
 * no API key), we say so plainly instead of pretending recognition
 * happened. Wiring a real provider later just means filling in the branch
 * below and setting SCAN_IMAGE_PROVIDER_API_KEY.
 */
function isImageRecognitionConfigured() {
  return Boolean(process.env.SCAN_IMAGE_PROVIDER_API_KEY);
}

async function recognizeImage(/* imageBase64 */) {
  if (!isImageRecognitionConfigured()) {
    return {
      configured: false,
      message: 'Scan service not configured.',
    };
  }

  // Integration point for a real provider (e.g. a vision API). Intentionally
  // unimplemented until a provider is actually configured — see the
  // isImageRecognitionConfigured() guard above, which this code can never
  // reach without a real API key being set.
  throw new ApiError('Image recognition provider is not implemented.', 501, 'NOT_IMPLEMENTED');
}

function getStatus() {
  return {
    barcode: { configured: true, message: 'Barcode/QR lookup is available (matches product SKU or ID).' },
    image: isImageRecognitionConfigured()
      ? { configured: true, message: 'Image search is available.' }
      : { configured: false, message: 'Scan service not configured.' },
  };
}

module.exports = { lookupByCode, recognizeImage, getStatus };
