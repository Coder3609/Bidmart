const searchModel = require('../models/search.model');
const { ApiError } = require('../utils/apiResponse');

/** Global quick search — small previews of both products and auctions, logs the query. */
async function globalSearch(q, requestingUser) {
  if (!q || !q.trim()) {
    throw new ApiError('A search query is required.', 400, 'MISSING_QUERY');
  }

  const [products, auctions] = await Promise.all([
    searchModel.searchProducts({ q, page: 1, limit: 6 }),
    searchModel.searchAuctions({ q, page: 1, limit: 6 }),
  ]);

  await searchModel.logSearch({
    userId: requestingUser ? requestingUser.id : null,
    query: q,
    resultCount: products.pagination.total + auctions.pagination.total,
  });

  return { products, auctions };
}

async function productSearch(query, requestingUser) {
  const result = await searchModel.searchProducts(query);
  if (query.q && query.q.trim()) {
    await searchModel.logSearch({
      userId: requestingUser ? requestingUser.id : null,
      query: query.q,
      resultCount: result.pagination.total,
    });
  }
  return result;
}

async function auctionSearch(query, requestingUser) {
  const result = await searchModel.searchAuctions(query);
  if (query.q && query.q.trim()) {
    await searchModel.logSearch({
      userId: requestingUser ? requestingUser.id : null,
      query: query.q,
      resultCount: result.pagination.total,
    });
  }
  return result;
}

/** No `q` -> recent + popular. With `q` -> autocomplete suggestions. */
async function assist(q, requestingUser) {
  if (q && q.trim().length >= 2) {
    return { mode: 'autocomplete', suggestions: await searchModel.suggest(q) };
  }
  const [recent, popular] = await Promise.all([
    requestingUser ? searchModel.recentSearches(requestingUser.id) : Promise.resolve([]),
    searchModel.popularSearches(),
  ]);
  return { mode: 'idle', recent, popular };
}

async function clearRecent(userId) {
  await searchModel.clearRecentSearches(userId);
}

module.exports = { globalSearch, productSearch, auctionSearch, assist, clearRecent };
