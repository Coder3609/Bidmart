const { pool } = require('../config/db');
const orderModel = require('../models/order.model');
const auctionModel = require('../models/auction.model');

function parseImages(row) {
  if (row && typeof row.images === 'string') {
    try { row.images = JSON.parse(row.images); } catch { row.images = []; }
  }
  return row;
}

/**
 * BUYER dashboard: order/bid/wishlist counts + a couple of "what's
 * happening right now" lists. Everything here is scoped to req.user.id —
 * no cross-buyer data ever leaks through this endpoint.
 */
async function getBuyerDashboard(userId) {
  const [[orderStats]] = await pool.query(
    `SELECT COUNT(*) AS totalOrders,
            SUM(status NOT IN ('CANCELLED', 'REFUNDED')) AS activeOrders
     FROM orders WHERE buyer_id = :userId`,
    { userId }
  );
  const [[bidStats]] = await pool.query(
    `SELECT
       SUM(status = 'WINNING') AS activeBids,
       SUM(status = 'WON') AS wonAuctions,
       COUNT(DISTINCT auction_id) AS totalAuctionsBidOn
     FROM bids WHERE bidder_id = :userId`,
    { userId }
  );
  const [[wishlistStats]] = await pool.query(
    'SELECT COUNT(*) AS wishlistItems FROM wishlist_items WHERE user_id = :userId',
    { userId }
  );
  const [[pendingReviewStats]] = await pool.query(
    `SELECT COUNT(*) AS pendingReviews
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.buyer_id = :userId
       AND EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id AND h.to_status = 'DELIVERED')
       AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_item_id = oi.id)`,
    { userId }
  );
  const [[returnStats]] = await pool.query(
    `SELECT COUNT(*) AS activeReturns FROM return_requests WHERE buyer_id = :userId AND status NOT IN ('REJECTED', 'REFUNDED')`,
    { userId }
  );

  const { items: recentOrders } = await orderModel.findByBuyer(userId, { page: 1, limit: 5 });

  const [activeAuctionRows] = await pool.query(
    `SELECT b.amount AS my_bid, b.status AS bid_status,
            a.id AS auction_id, a.current_price, a.ends_at, a.status AS auction_status,
            p.id AS product_id, p.title, p.images
     FROM bids b
     JOIN auctions a ON a.id = b.auction_id
     JOIN products p ON p.id = a.product_id
     WHERE b.bidder_id = :userId AND b.status = 'WINNING' AND a.status = 'OPEN'
     ORDER BY a.ends_at ASC
     LIMIT 5`,
    { userId }
  );

  return {
    stats: {
      totalOrders: Number(orderStats.totalOrders) || 0,
      activeOrders: Number(orderStats.activeOrders) || 0,
      activeBids: Number(bidStats.activeBids) || 0,
      wonAuctions: Number(bidStats.wonAuctions) || 0,
      wishlistItems: Number(wishlistStats.wishlistItems) || 0,
      pendingReviews: Number(pendingReviewStats.pendingReviews) || 0,
      activeReturns: Number(returnStats.activeReturns) || 0,
    },
    recentOrders,
    activeAuctions: activeAuctionRows.map(parseImages),
  };
}

const userModel = require('../models/user.model');
const productViewLogModel = require('../models/product_view_log.model');

/**
 * Helper to build date ranges and daily aggregates for seller sales chart
 */
async function getSellerSalesChart(userId, period = '7d', fromDateStr, toDateStr) {
  let intervalDays = 7;
  let groupBy = 'DAY';
  let fromDate;
  let toDate = new Date();

  if (period === 'today') {
    intervalDays = 1;
    fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);
  } else if (period === '7d' || period === '7days') {
    intervalDays = 7;
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 6);
    fromDate.setHours(0, 0, 0, 0);
  } else if (period === '30d' || period === '30days') {
    intervalDays = 30;
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 29);
    fromDate.setHours(0, 0, 0, 0);
  } else if (period === '90d' || period === '90days') {
    intervalDays = 90;
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 89);
    fromDate.setHours(0, 0, 0, 0);
  } else if (period === '1y' || period === 'this_year') {
    intervalDays = 365;
    fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 1);
    fromDate.setHours(0, 0, 0, 0);
  } else if (period === 'custom' && fromDateStr && toDateStr) {
    fromDate = new Date(fromDateStr);
    toDate = new Date(toDateStr);
    toDate.setHours(23, 59, 59, 999);
  } else {
    intervalDays = 7;
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 6);
    fromDate.setHours(0, 0, 0, 0);
  }

  const [salesRows] = await pool.query(
    `SELECT DATE(o.placed_at) AS day,
            COUNT(DISTINCT oi.order_id) AS orders,
            COALESCE(SUM(oi.line_total), 0) AS sales
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = :userId
       AND o.status NOT IN ('CANCELLED', 'REFUNDED')
       AND o.placed_at >= :fromSql
       AND o.placed_at <= :toSql
     GROUP BY DATE(o.placed_at)
     ORDER BY day ASC`,
    {
      userId,
      fromSql: fromDate.toISOString().slice(0, 19).replace('T', ' '),
      toSql: toDate.toISOString().slice(0, 19).replace('T', ' '),
    }
  );

  const dataMap = new Map();
  salesRows.forEach((r) => {
    const key = typeof r.day === 'string' ? r.day.slice(0, 10) : new Date(r.day).toISOString().slice(0, 10);
    dataMap.set(key, { orders: Number(r.orders) || 0, sales: Number(r.sales) || 0 });
  });

  // Fill in missing days so charts have smooth continuous labels
  const points = [];
  const curr = new Date(fromDate);
  while (curr <= toDate) {
    const dStr = curr.toISOString().slice(0, 10);
    const dayName = curr.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = dataMap.get(dStr) || { orders: 0, sales: 0 };
    points.push({
      date: dStr,
      label: intervalDays <= 7 ? dayName : formattedDate,
      orders: existing.orders,
      sales: existing.sales,
    });
    curr.setDate(curr.getDate() + 1);
  }

  const totalSalesInRange = points.reduce((acc, p) => acc + p.sales, 0);
  const totalOrdersInRange = points.reduce((acc, p) => acc + p.orders, 0);

  return {
    period,
    fromDate: fromDate.toISOString().slice(0, 10),
    toDate: toDate.toISOString().slice(0, 10),
    totalSales: totalSalesInRange,
    totalOrders: totalOrdersInRange,
    points,
  };
}

/**
 * SELLER dashboard: comprehensive catalog, orders, auctions, KPIs, performance,
 * sales chart, and attention items — fully scoped to the logged-in seller.
 */
async function getSellerDashboard(userId) {
  const seller = await userModel.findById(userId);

  // 1. Core Product & Catalog counts
  const [[productStats]] = await pool.query(
    `SELECT COUNT(*) AS totalProducts,
            SUM(status = 'ACTIVE_SHOP') AS activeListings,
            SUM(status = 'ACTIVE_AUCTION') AS liveAuctions,
            SUM(status = 'AUCTION_UNSOLD') AS unsoldAuctions,
            SUM(status = 'DRAFT') AS draftProducts
     FROM products WHERE seller_id = :userId`,
    { userId }
  );

  // 2. Sales & Orders counts
  const [[salesStats]] = await pool.query(
    `SELECT COUNT(DISTINCT oi.order_id) AS totalOrders,
            SUM(o.status IN ('PENDING', 'PROCESSING', 'PAYMENT_PENDING')) AS pendingOrders,
            COALESCE(SUM(oi.line_total), 0) AS totalSales
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = :userId AND o.status NOT IN ('CANCELLED', 'REFUNDED')`,
    { userId }
  );

  // 3. Auction Revenue (orders sourced from won auctions or completed auction orders)
  const [[auctionRevenueStats]] = await pool.query(
    `SELECT COALESCE(SUM(oi.line_total), 0) AS auctionRevenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = :userId
       AND o.source = 'AUCTION'
       AND o.status NOT IN ('CANCELLED', 'REFUNDED')`,
    { userId }
  );

  // 4. Reviews & Ratings
  const [[reviewStats]] = await pool.query(
    `SELECT COUNT(*) AS totalReviews, COALESCE(AVG(r.rating), 0) AS averageRating
     FROM reviews r JOIN products p ON p.id = r.product_id
     WHERE p.seller_id = :userId`,
    { userId }
  );

  // 5. Pending Returns
  const [[returnStats]] = await pool.query(
    `SELECT COUNT(*) AS pendingReturns FROM return_requests rr
     JOIN order_items oi ON oi.id = rr.order_item_id
     WHERE oi.seller_id = :userId AND rr.status IN ('REQUESTED', 'APPROVED')`,
    { userId }
  );

  // 6. Wishlist Adds
  const [[wishlistStats]] = await pool.query(
    `SELECT COUNT(*) AS wishlistAdds
     FROM wishlist_items wi
     JOIN products p ON p.id = wi.product_id
     WHERE p.seller_id = :userId`,
    { userId }
  );

  // 7. Product Views (from product_view_logs)
  let totalProductViews = 0;
  try {
    totalProductViews = await productViewLogModel.getTotalViewsBySeller(userId);
  } catch {
    totalProductViews = 0;
  }

  // 8. 7-Day Comparison Stats for Growth Badges
  const [[current7dStats]] = await pool.query(
    `SELECT COUNT(DISTINCT oi.order_id) AS orders7d,
            COALESCE(SUM(oi.line_total), 0) AS sales7d
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = :userId
       AND o.status NOT IN ('CANCELLED', 'REFUNDED')
       AND o.placed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
    { userId }
  );
  const [[prev7dStats]] = await pool.query(
    `SELECT COUNT(DISTINCT oi.order_id) AS ordersPrev7d,
            COALESCE(SUM(oi.line_total), 0) AS salesPrev7d
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = :userId
       AND o.status NOT IN ('CANCELLED', 'REFUNDED')
       AND o.placed_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       AND o.placed_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
    { userId }
  );

  const sales7d = Number(current7dStats.sales7d) || 0;
  const salesPrev7d = Number(prev7dStats.salesPrev7d) || 0;
  const salesChangePct = salesPrev7d > 0
    ? Math.round(((sales7d - salesPrev7d) / salesPrev7d) * 100)
    : (sales7d > 0 ? 100 : 0);

  const orders7d = Number(current7dStats.orders7d) || 0;
  const ordersPrev7d = Number(prev7dStats.ordersPrev7d) || 0;
  const ordersChangePct = ordersPrev7d > 0
    ? Math.round(((orders7d - ordersPrev7d) / ordersPrev7d) * 100)
    : (orders7d > 0 ? 100 : 0);

  // 9. Recent Orders (enriched with buyer name & item count for seller)
  const [recentOrderRows] = await pool.query(
    `SELECT o.id, o.status, o.placed_at, o.source, u.name AS buyer_name,
            COUNT(oi.id) AS item_count,
            COALESCE(SUM(oi.line_total), 0) AS seller_amount,
            p.title AS first_product_title,
            p.images AS first_product_images
     FROM orders o
     JOIN users u ON u.id = o.buyer_id
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     WHERE oi.seller_id = :userId
     GROUP BY o.id, o.status, o.placed_at, o.source, u.name, p.title, p.images
     ORDER BY o.placed_at DESC
     LIMIT 5`,
    { userId }
  );

  const recentOrders = recentOrderRows.map((r) => {
    let images = [];
    if (typeof r.first_product_images === 'string') {
      try { images = JSON.parse(r.first_product_images); } catch { images = []; }
    } else if (Array.isArray(r.first_product_images)) {
      images = r.first_product_images;
    }
    return {
      id: r.id,
      productTitle: r.first_product_title,
      productImage: images[0] || null,
      buyerName: r.buyer_name,
      amount: Number(r.seller_amount) || 0,
      status: r.status,
      placedAt: r.placed_at,
    };
  });

  // 10. Active Auctions with real Bid Counts & End Timers
  const [activeAuctionRows] = await pool.query(
    `SELECT au.id, au.current_price, au.starting_price, au.bid_increment,
            au.status, au.starts_at, au.ends_at,
            p.id AS product_id, p.title, p.images,
            (SELECT COUNT(*) FROM bids b WHERE b.auction_id = au.id) AS bid_count,
            (SELECT u2.name FROM bids b2 JOIN users u2 ON u2.id = b2.bidder_id WHERE b2.auction_id = au.id AND b2.status = 'WINNING' LIMIT 1) AS highest_bidder_name
     FROM auctions au
     JOIN products p ON p.id = au.product_id
     WHERE p.seller_id = :userId AND au.status IN ('OPEN', 'SCHEDULED')
     ORDER BY au.ends_at ASC
     LIMIT 5`,
    { userId }
  );

  const activeAuctions = activeAuctionRows.map((a) => {
    let images = [];
    if (typeof a.images === 'string') {
      try { images = JSON.parse(a.images); } catch { images = []; }
    } else if (Array.isArray(a.images)) {
      images = a.images;
    }
    return {
      id: a.id,
      productId: a.product_id,
      title: a.title,
      image: images[0] || null,
      currentPrice: Number(a.current_price) || 0,
      bidCount: Number(a.bid_count) || 0,
      highestBidderName: a.highest_bidder_name || null,
      status: a.status,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
    };
  });

  // 11. Products Needing Attention (Low stock, Inactive/Draft, Unsold Auction)
  const [attentionRows] = await pool.query(
    `SELECT p.id, p.title, p.price, p.status, p.images,
            COALESCE(i.available_qty, 0) AS available_qty,
            CASE
              WHEN p.status = 'ACTIVE_SHOP' AND COALESCE(i.available_qty, 0) <= 5 THEN 'LOW_STOCK'
              WHEN p.status = 'OUT_OF_STOCK' OR (p.status = 'ACTIVE_SHOP' AND COALESCE(i.available_qty, 0) = 0) THEN 'OUT_OF_STOCK'
              WHEN p.status = 'DRAFT' THEN 'INACTIVE'
              WHEN p.status = 'AUCTION_UNSOLD' THEN 'AUCTION_UNSOLD'
              ELSE NULL
            END AS attention_type
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.seller_id = :userId
       AND (
         (p.status = 'ACTIVE_SHOP' AND COALESCE(i.available_qty, 0) <= 5)
         OR p.status IN ('OUT_OF_STOCK', 'DRAFT', 'AUCTION_UNSOLD')
       )
     ORDER BY p.updated_at DESC
     LIMIT 5`,
    { userId }
  );

  const attentionProducts = attentionRows.map((p) => {
    let images = [];
    if (typeof p.images === 'string') {
      try { images = JSON.parse(p.images); } catch { images = []; }
    } else if (Array.isArray(p.images)) {
      images = p.images;
    }
    return {
      id: p.id,
      title: p.title,
      image: images[0] || null,
      price: Number(p.price) || 0,
      status: p.status,
      availableQty: Number(p.available_qty) || 0,
      attentionType: p.attention_type,
    };
  });

  // 12. Default 7-day Sales Chart
  const salesChart = await getSellerSalesChart(userId, '7d');

  // 13. Store Performance Metrics
  const totalOrdersCount = Number(salesStats.totalOrders) || 0;
  const conversionRate = totalProductViews > 0
    ? `${((totalOrdersCount / totalProductViews) * 100).toFixed(1)}%`
    : (totalOrdersCount > 0 ? 'N/A' : '0.0%');

  const avgRatingVal = Math.round(Number(reviewStats.averageRating) * 10) / 10;

  return {
    seller: {
      id: seller.id,
      name: seller.name,
      storeName: seller.store_name || seller.name,
      email: seller.email,
      phone: seller.phone,
      role: seller.role,
      status: seller.status,
    },
    stats: {
      totalProducts: Number(productStats.totalProducts) || 0,
      activeListings: Number(productStats.activeListings) || 0,
      orders: totalOrdersCount,
      totalOrders: totalOrdersCount,
      pendingOrders: Number(salesStats.pendingOrders) || 0,
      totalSales: Number(salesStats.totalSales) || 0,
      auctionRevenue: Number(auctionRevenueStats.auctionRevenue) || 0,
      averageRating: avgRatingVal,
      totalReviews: Number(reviewStats.totalReviews) || 0,
      pendingReturns: Number(returnStats.pendingReturns) || 0,
      wishlistAdds: Number(wishlistStats.wishlistAdds) || 0,
      productViews: totalProductViews,
      // Growth comparisons vs last 7 days
      salesGrowth: salesChangePct,
      ordersGrowth: ordersChangePct,
    },
    storePerformance: {
      conversionRate,
      productViews: totalProductViews,
      wishlistAdds: Number(wishlistStats.wishlistAdds) || 0,
      customerRating: avgRatingVal > 0 ? `${avgRatingVal}/5` : 'No reviews yet',
      averageRating: avgRatingVal,
      totalReviews: Number(reviewStats.totalReviews) || 0,
    },
    salesChart,
    recentOrders,
    activeAuctions,
    attentionProducts,
  };
}


/**
 * ADMIN dashboard: marketplace-wide snapshot — every number here is
 * unscoped on purpose, this route is ADMIN-only (enforced in the routes file).
 */
async function getAdminDashboard() {
  const [[userStats]] = await pool.query(
    `SELECT COUNT(*) AS totalUsers,
            SUM(role = 'BUYER') AS totalBuyers,
            SUM(role = 'SELLER') AS totalSellers,
            SUM(role = 'ADMIN') AS totalAdmins
     FROM users`
  );

  const [[productStats]] = await pool.query(
    `SELECT COUNT(*) AS totalProducts,
            SUM(status = 'ACTIVE_SHOP') AS activeShop,
            SUM(status = 'ACTIVE_AUCTION') AS activeAuctions
     FROM products`
  );

  const [[orderStats]] = await pool.query(
    `SELECT COUNT(*) AS totalOrders,
            COALESCE(SUM(total), 0) AS totalRevenue
     FROM orders WHERE status NOT IN ('CANCELLED', 'REFUNDED')`
  );

  const [[reviewStats]] = await pool.query(
    `SELECT COUNT(*) AS totalReviews, COALESCE(AVG(rating), 0) AS averageRating FROM reviews`
  );
  const [[returnStats]] = await pool.query(
    `SELECT COUNT(*) AS pendingReturns FROM return_requests WHERE status IN ('REQUESTED', 'APPROVED')`
  );

  // Last 7 days, order count + revenue per day — a simple line chart on the frontend.
  const [salesOverview] = await pool.query(
    `SELECT DATE(placed_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
     FROM orders
     WHERE placed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       AND status NOT IN ('CANCELLED', 'REFUNDED')
     GROUP BY DATE(placed_at)
     ORDER BY day ASC`
  );

  const [recentOrders] = await pool.query(
    `SELECT o.id, o.status, o.total, o.placed_at, o.source, u.name AS buyer_name
     FROM orders o JOIN users u ON u.id = o.buyer_id
     ORDER BY o.placed_at DESC LIMIT 8`
  );

  const [recentAuctions] = await pool.query(
    `SELECT au.id, au.status, au.current_price, au.ends_at, p.title
     FROM auctions au JOIN products p ON p.id = au.product_id
     ORDER BY au.created_at DESC LIMIT 8`
  );

  return {
    stats: {
      totalUsers: Number(userStats.totalUsers) || 0,
      totalBuyers: Number(userStats.totalBuyers) || 0,
      totalSellers: Number(userStats.totalSellers) || 0,
      totalAdmins: Number(userStats.totalAdmins) || 0,
      totalProducts: Number(productStats.totalProducts) || 0,
      activeShop: Number(productStats.activeShop) || 0,
      activeAuctions: Number(productStats.activeAuctions) || 0,
      totalOrders: Number(orderStats.totalOrders) || 0,
      totalRevenue: Number(orderStats.totalRevenue) || 0,
      totalReviews: Number(reviewStats.totalReviews) || 0,
      averageRating: Math.round(Number(reviewStats.averageRating) * 10) / 10,
      pendingReturns: Number(returnStats.pendingReturns) || 0,
    },
    salesOverview: salesOverview.map((row) => ({
      day: row.day,
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    })),
    recentOrders,
    recentAuctions,
  };
}

module.exports = { getBuyerDashboard, getSellerDashboard, getAdminDashboard, getSellerSalesChart };

