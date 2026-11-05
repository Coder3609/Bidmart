/**
 * auction-card.js
 * Enhanced shared helpers for BidMart Auction UI components & live cards.
 */

function auctionStatusLabel(auction) {
  if (auction.status === 'OPEN') return 'LIVE';
  if (auction.status === 'SCHEDULED') return 'UPCOMING';
  if (auction.status === 'CLOSED') return auction.winning_bid_id ? 'WON' : 'ENDED';
  return auction.status;
}

function getCountdownInfo(auction) {
  const now = Date.now();
  if (auction.status === 'SCHEDULED') {
    const start = new Date(auction.starts_at).getTime();
    const diff = start - now;
    if (diff <= 0) return { text: 'Starting now…', urgent: false, isLive: true };
    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return {
      text: d > 0 ? `Starts in ${d}d ${h}h` : `Starts in ${h}h ${m}m`,
      urgent: false,
      isLive: false,
    };
  }

  if (auction.status === 'OPEN') {
    const end = new Date(auction.ends_at).getTime();
    const diff = end - now;
    if (diff <= 0) return { text: 'Closing…', urgent: true, isLive: true };
    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const isUrgent = diff < 3600 * 1000 * 2; // under 2 hours
    return {
      text: d > 0
        ? `${d}d ${h}h remaining`
        : `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`,
      urgent: isUrgent,
      isLive: true,
      remainingMs: diff,
    };
  }

  return {
    text: auction.winning_bid_id ? 'Auction Won' : 'Auction Ended',
    urgent: false,
    isLive: false,
  };
}

function getCategoryPlaceholderSvg(category = '') {
  const cat = (category || '').toLowerCase();
  if (cat.includes('watch') || cat.includes('jewel')) {
    return `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.6"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.85 3.65H8.34l-.85-3.65M8.34 3h7.32l.85 3.65"/></svg>`;
  }
  if (cat.includes('game') || cat.includes('playstation') || cat.includes('xbox')) {
    return `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.6"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="6"/></svg>`;
  }
  if (cat.includes('camera') || cat.includes('photo')) {
    return `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.6"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  }
  return `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.6"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
}

/**
 * Modern Auction Card component used in the marketplace grid.
 */
function renderModernAuctionCard(auction, { isWatchlisted = false, myBid = null } = {}) {
  const images = Array.isArray(auction.images) ? auction.images : [];
  const image = images.length > 0 ? images[0] : null;
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
    badgeMarkup = `<span class="auc-badge-live"><span class="pulse-dot"></span> LIVE</span>`;
  } else if (label === 'UPCOMING') {
    badgeMarkup = `<span class="auc-badge-scheduled">UPCOMING</span>`;
  } else if (label === 'WON') {
    badgeMarkup = `<span class="auc-badge-won">SOLD / WON</span>`;
  } else {
    badgeMarkup = `<span class="auc-badge-closed">ENDED</span>`;
  }

  // User bid state if provided
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

  // Dynamic Action Button based on status
  let actionButtonMarkup = '';
  if (isLive) {
    actionButtonMarkup = `
      <div class="auc-card-footer-btns">
        <a href="/auction/auction-detail.html?id=${auction.id}" class="auc-btn-bid" style="flex:1;text-decoration:none;">
          <span>Bid Now →</span>
        </a>
      </div>
    `;
  } else if (isUpcoming) {
    actionButtonMarkup = `
      <div class="auc-card-footer-btns">
        <a href="/auction/auction-detail.html?id=${auction.id}" class="auc-btn-outline" style="flex:1;">
          <span>View Auction →</span>
        </a>
      </div>
    `;
  } else {
    actionButtonMarkup = `
      <div class="auc-card-footer-btns">
        <a href="/auction/auction-detail.html?id=${auction.id}" class="auc-btn-outline" style="flex:1;">
          <span>View Details & History →</span>
        </a>
      </div>
    `;
  }

  return `
    <div class="auc-card" data-auction-id="${auction.id}" data-ends-at="${auction.ends_at}" data-starts-at="${auction.starts_at}" data-status="${auction.status}">
      <!-- Media Header with Aspect Ratio 4:3 -->
      <div class="auc-card-media">
        <a href="/auction/auction-detail.html?id=${auction.id}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
          ${image
            ? `<img src="${image}" alt="${auction.title}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#F8FAFC;\\'>${getCategoryPlaceholderSvg(auction.category)}</div>';" />`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#F8FAFC;">
                 ${getCategoryPlaceholderSvg(auction.category)}
               </div>`
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

      <!-- Card Body -->
      <div class="auc-card-body">
        <div class="auc-card-meta">
          <span class="auc-card-id">#AUC-${String(auction.id).padStart(3, '0')}</span>
          <span class="auc-card-cond">${auction.condition || 'Pre-owned'}</span>
        </div>

        <a href="/auction/auction-detail.html?id=${auction.id}" class="auc-card-title" title="${auction.title}">
          ${auction.title}
        </a>

        <!-- Price Grid -->
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

// Fallback card renderer for backwards compatibility
function renderAuctionCard(auction) {
  return renderModernAuctionCard(auction);
}

window.auctionHelpers = {
  auctionStatusLabel,
  getCountdownInfo,
  renderModernAuctionCard,
  renderAuctionCard,
};
