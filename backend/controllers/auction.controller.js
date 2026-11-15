const auctionService = require('../services/auction.service');
const { success } = require('../utils/apiResponse');

async function shiftToAuction(req, res, next) {
  try {
    const { productId, startingPrice, reservePrice, bidIncrement, startsAt, endsAt } = req.body;
    const auction = await auctionService.shiftToAuction(req.user, {
      productId, startingPrice, reservePrice, bidIncrement, startsAt, endsAt,
    });
    return success(res, auction, 'Product moved to auction.', 201);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await auctionService.listAuctions(req.query);
    return success(res, result, 'Auctions fetched.');
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await auctionService.listMyAuctions(req.user, { page, limit });
    return success(res, result, 'Your auctions fetched.');
  } catch (err) {
    next(err);
  }
}

async function listMyBids(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await auctionService.listMyBids(req.user, { page, limit });
    return success(res, result, 'Your bids fetched.');
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const auction = await auctionService.getAuctionDetail(req.params.id, req.user);
    return success(res, auction, 'Auction fetched.');
  } catch (err) {
    next(err);
  }
}

async function getByProduct(req, res, next) {
  try {
    const auction = await auctionService.getAuctionByProduct(req.params.productId);
    return success(res, auction, 'Auction fetched.');
  } catch (err) {
    next(err);
  }
}

async function getBidHistory(req, res, next) {
  try {
    const bids = await auctionService.listBidHistory(req.params.id);
    return success(res, bids, 'Bid history fetched.');
  } catch (err) {
    next(err);
  }
}

async function placeBid(req, res, next) {
  try {
    const { amount, name, age } = req.body;
    const result = await auctionService.placeBid(req.user, req.params.id, amount, { name, age });
    return success(res, result, 'Bid placed.', 201);
  } catch (err) {
    next(err);
  }
}

async function relist(req, res, next) {
  try {
    const { productId, startingPrice, reservePrice, bidIncrement, startsAt, endsAt } = req.body;
    const auction = await auctionService.relistAuction(req.user, productId, {
      startingPrice, reservePrice, bidIncrement, startsAt, endsAt,
    });
    return success(res, auction, 'Product relisted for auction.', 201);
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { reservePrice, bidIncrement, endsAt } = req.body;
    const auction = await auctionService.updateAuctionSettings(req.user, req.params.id, {
      reservePrice, bidIncrement, endsAt,
    });
    return success(res, auction, 'Auction settings updated.');
  } catch (err) {
    next(err);
  }
}

async function returnToShop(req, res, next) {
  try {
    const { productId } = req.body;
    const product = await auctionService.returnToShop(req.user, productId);
    return success(res, product, 'Product returned to the shop.');
  } catch (err) {
    next(err);
  }
}

async function completeOrder(req, res, next) {
  try {
    const { addressId, paymentMethod } = req.body;
    const result = await auctionService.completeAuctionOrder(req.user, req.params.id, { addressId, paymentMethod });
    const message = result.alreadyCompleted ? 'Order already placed for this win.' : 'Order placed for your auction win.';
    return success(res, result, message, result.alreadyCompleted ? 200 : 201);
  } catch (err) {
    next(err);
  }
}

async function runScheduler(req, res, next) {
  try {
    const result = await auctionService.runScheduler();
    return success(res, result, 'Auction scheduler tick complete.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  shiftToAuction, list, listMine, listMyBids, getById, getByProduct, getBidHistory,
  placeBid, relist, updateSettings, returnToShop, completeOrder, runScheduler,
};
