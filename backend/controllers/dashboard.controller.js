const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/apiResponse');

async function buyer(req, res, next) {
  try {
    const data = await dashboardService.getBuyerDashboard(req.user.id);
    return success(res, data, 'Buyer dashboard fetched.');
  } catch (err) {
    next(err);
  }
}

async function seller(req, res, next) {
  try {
    const data = await dashboardService.getSellerDashboard(req.user.id);
    return success(res, data, 'Seller dashboard fetched.');
  } catch (err) {
    next(err);
  }
}

async function sellerChart(req, res, next) {
  try {
    const { period, from, to } = req.query;
    const data = await dashboardService.getSellerSalesChart(req.user.id, period, from, to);
    return success(res, data, 'Seller sales chart data fetched.');
  } catch (err) {
    next(err);
  }
}

async function admin(req, res, next) {
  try {
    const data = await dashboardService.getAdminDashboard();
    return success(res, data, 'Admin dashboard fetched.');
  } catch (err) {
    next(err);
  }
}

module.exports = { buyer, seller, sellerChart, admin };

