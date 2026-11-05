const searchService = require('../services/search.service');
const { success } = require('../utils/apiResponse');

async function global_(req, res, next) {
  try {
    const result = await searchService.globalSearch(req.query.q, req.user);
    return success(res, result, 'Search results fetched.');
  } catch (err) {
    next(err);
  }
}

async function products(req, res, next) {
  try {
    const { q, categoryId, minPrice, maxPrice, brand, condition, availability, sort, page, limit } = req.query;
    const result = await searchService.productSearch({
      q, categoryId, minPrice, maxPrice, brand, condition, availability, sort, page, limit,
    }, req.user);
    return success(res, result, 'Products fetched.');
  } catch (err) {
    next(err);
  }
}

async function auctions(req, res, next) {
  try {
    const { q, categoryId, minBid, maxBid, sellerId, condition, endingSoon, minBids, sort, page, limit } = req.query;
    const result = await searchService.auctionSearch({
      q, categoryId, minBid, maxBid, sellerId, condition, endingSoon, minBids, sort, page, limit,
    }, req.user);
    return success(res, result, 'Auctions fetched.');
  } catch (err) {
    next(err);
  }
}

async function assist(req, res, next) {
  try {
    const result = await searchService.assist(req.query.q, req.user);
    return success(res, result, 'Search assist fetched.');
  } catch (err) {
    next(err);
  }
}

async function clearRecent(req, res, next) {
  try {
    await searchService.clearRecent(req.user.id);
    return success(res, null, 'Recent searches cleared.');
  } catch (err) {
    next(err);
  }
}

module.exports = { global_, products, auctions, assist, clearRecent };
