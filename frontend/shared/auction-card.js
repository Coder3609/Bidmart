/**
 * BidMart Auction Card Helper Functions & Definitions
 */

function auctionStatusLabel(auction) {
  if (!auction) return 'CLOSED';
  if (auction.status === 'OPEN') return 'LIVE';
  if (auction.status === 'SCHEDULED') return 'UPCOMING';
  if (auction.status === 'CLOSED') {
    return auction.winning_bid_id ? 'WON' : 'ENDED';
  }
  return auction.status || 'CLOSED';
}

function getCountdownInfo(auction) {
  if (!auction) return { text: 'Ended', urgent: false };
  const target = auction.status === 'SCHEDULED' ? auction.starts_at : auction.ends_at;
  if (!target) return { text: 'Ended', urgent: false };
  
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { text: 'Auction Closed', urgent: false };
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  
  const urgent = hours === 0 && mins < 30;
  return {
    text: `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`,
    urgent,
  };
}

function getCategoryPlaceholderSvg(cat) {
  return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
}

/**
 * Modern Auction Card component used in the marketplace grid.
 */
function renderModernAuctionCard(auction, { isWatchlisted = false, myBid = null } = {}) {
  let images = [];
  if (Array.isArray(auction.images)) {
    images = auction.images;
  } else if (typeof auction.images === 'string') {
    try { images = JSON.parse(auction.images); } catch { images = [auction.images]; }
  }
  const rawImage = images.length > 0 ? images[0] : null;
  const image = rawImage ? String(rawImage).replace(/^\/+|\/+$/g, '/').replace(/^([^\/])/, '/$1') : null;
  const label = auctionStatusLabel(auction);
  const countdown = getCountdownInfo(auction);
  const currentPrice = Number(auction.current_price || auction.starting_price || 0);
  const increment = Number(auction.bid_increment || 100);
  const minNextBid = currentPrice + increment;
  const bidCount = Number(auction.bid_count || 0);
  const isLive = auction.status === 'OPEN';
  const isUpcoming = auction.status === 'SCHEDULED';
  const isClosed = auction.status === 'CLOSED';

  let badgeMarkup = '';
  if (label === 'LIVE') {
    badgeMarkup = '<span class="auc-badge-live"><span class="pulse-dot"></span> LIVE</span>';
  } else if (label === 'UPCOMING') {
    badgeMarkup = '<span class="auc-badge-scheduled">UPCOMING</span>';
  } else if (label === 'WON') {
    badgeMarkup = '<span class="auc-badge-won">SOLD / WON</span>';
  } else {
    badgeMarkup = '<span class="auc-badge-closed">ENDED</span>';
  }

  let userBidMarkup = '';
  if (myBid) {
    const isWinning = myBid.status === 'WINNING' || myBid.status === 'WON';
    userBidMarkup = `
      <div class="auc-user-bid-pill ${isWinning ? 'winning' : 'outbid'}">
        <span>Your Bid: <strong>₹${Number(myBid.amount).toLocaleString('en-IN')}</strong></span>
        <span>${isWinning ? '✓ Highest Bidder' : '⚠️ Outbid'}</span>
      </div>
    `;
  }

  let actionButtonMarkup = '';
  if (isLive) {
    actionButtonMarkup = `
      <div class="auc-card-footer-btns">
        <a href="/auction/auction-detail.html?id=${auction.id}" class="auc-btn-bid">
          <span>Enter Live Bid Room →</span>
        </a>
      </div>
    `;
  } else {
    actionButtonMarkup = `
      <div class="auc-card-footer-btns">
        <a href="/auction/auction-detail.html?id=${auction.id}" class="auc-btn-outline">
          <span>View Auction Details →</span>
        </a>
      </div>
    `;
  }

  const fallbackSvg = getCategoryPlaceholderSvg(auction.category || auction.category_name);

  return `
    <div class="auc-card" data-auction-id="${auction.id}" data-ends-at="${auction.ends_at}" data-starts-at="${auction.starts_at}" data-status="${auction.status}">
      <div class="auc-card-media">
        <a href="/auction/auction-detail.html?id=${auction.id}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
          ${image
            ? `<img src="${image}" alt="${auction.title}" loading="lazy" onerror="this.onerror=null;this.src='/assets/real/ps5.jpg';" />`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#101623;">${fallbackSvg}</div>`
          }
        </a>
        ${badgeMarkup}

        <button type="button" class="auc-card-watchlist-btn ${isWatchlisted ? 'active' : ''}" 
                data-action="toggle-watchlist" 
                data-product-id="${auction.product_id}" 
                data-auction-id="${auction.id}" 
                title="${isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}" 
                aria-label="Toggle Watchlist">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWatchlisted ? 'currentColor' : 'none'}"><path d="M12 21s-7-4.35-9.5-8.5C.7 8.9 2.6 5 6.3 5c2 0 3.4 1 5.7 3.2C14.3 6 15.7 5 17.7 5c3.7 0 5.6 3.9 3.8 7.5C19 16.65 12 21 12 21z" stroke="currentColor" stroke-width="2"/></svg>
        </button>

        <div class="auc-card-timer ${countdown.urgent ? 'urgent' : ''}" data-timer-target="${auction.status === 'SCHEDULED' ? auction.starts_at : auction.ends_at}">
          <span>⏱ ${countdown.text}</span>
          <span style="font-size:0.7rem;opacity:0.9;">${bidCount} bid${bidCount === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div class="auc-card-body">
        <div class="auc-card-meta">
          <span class="auc-card-id">#AUC-${String(auction.id).padStart(3, '0')}</span>
          <span class="auc-card-cond">${auction.condition || 'VERIFIED'}</span>
        </div>

        <a href="/auction/auction-detail.html?id=${auction.id}" class="auc-card-title" title="${auction.title}">
          ${auction.title}
        </a>

        <div class="auc-price-box">
          <div class="auc-price-item">
            <span class="auc-price-label">${isClosed ? 'Final Bid' : (isUpcoming ? 'Starting Bid' : 'Current Bid')}</span>
            <span class="auc-price-val highlight">₹${currentPrice.toLocaleString('en-IN')}</span>
          </div>
          <div class="auc-price-item">
            <span class="auc-price-label">${isClosed ? 'Status' : (isUpcoming ? 'Increment' : 'Min Next Bid')}</span>
            <span class="auc-price-sub">${isLive ? `₹${minNextBid.toLocaleString('en-IN')}` : (isUpcoming ? `+₹${increment}` : (auction.winning_bid_id ? 'Sold' : 'Ended'))}</span>
          </div>
        </div>

        ${userBidMarkup}
        ${actionButtonMarkup}
      </div>
    </div>
  `;
}

function renderAuctionCard(auction) {
  return renderModernAuctionCard(auction);
}

window.auctionHelpers = {
  auctionStatusLabel,
  getCountdownInfo,
  renderModernAuctionCard,
  renderAuctionCard,
};
