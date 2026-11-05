const scanService = require('../services/scan.service');
const { success } = require('../utils/apiResponse');

async function status(req, res, next) {
  try {
    return success(res, scanService.getStatus(), 'Scan status fetched.');
  } catch (err) {
    next(err);
  }
}

async function lookup(req, res, next) {
  try {
    const result = await scanService.lookupByCode(req.body.code);
    return success(res, result, result.found ? 'Product found.' : 'No match found.');
  } catch (err) {
    next(err);
  }
}

async function image(req, res, next) {
  try {
    const result = await scanService.recognizeImage(req.body.imageBase64);
    return success(res, result, result.configured ? 'Image recognized.' : 'Scan service not configured.');
  } catch (err) {
    next(err);
  }
}

module.exports = { status, lookup, image };
