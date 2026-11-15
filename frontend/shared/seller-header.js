/**
 * BidMart Auction & Seller Shared Header Component
 * Supports custom Auction Center view with dedicated Bidder Profile dropdown,
 * dynamic KYC badges, and animated login modal triggers for guests.
 */

function renderSellerHeader() {
  const mount = document.getElementById('seller-header');
  if (!mount) return;

  const currentPath = window.location.pathname.toLowerCase();
  const isAuctionContext = currentPath.includes('/auction/') || currentPath.includes('/wallet/');
  const user = window.auth ? window.auth.getUser() : null;
  const userName = user ? (user.store_name || user.name) : 'Bidder';
  const initial = user && user.name ? user.name.charAt(0).toUpperCase() : 'B';
  const bidderId = user && user.bidder_profile ? user.bidder_profile.bidder_id : (user ? `BM-BID-${String(user.id).padStart(6, '0')}` : '');

  mount.innerHTML = `
    <header class="sc-header" style="background:#080B11;border-bottom:1px solid rgba(255,255,255,0.08);color:#F1F5F9;">
      <div class="sc-header__left">
        <button type="button" class="sc-mobile-toggle" id="sc-sidebar-toggle" aria-label="Toggle navigation menu" style="color:#CBD5E1;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <a href="${isAuctionContext ? '/auction/auctions.html' : '/dashboards/seller/dashboard.html'}" class="sc-header__brand" style="text-decoration:none;">
          <span style="font-family:'Space Grotesk', sans-serif;font-weight:900;font-size:1.4rem;letter-spacing:0.04em;color:#FFFFFF;">BIDMART</span>
        </a>
      </div>

      <div class="sc-header__center">
        <div class="sc-search-bar" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="sc-search-icon" style="color:#94A3B8;"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input type="search" id="sc-global-search" placeholder="${isAuctionContext ? 'Search live auctions, catalog, lot number…' : 'Search products, orders, auctions…'}" autocomplete="off" style="color:#FFFFFF;" />
        </div>
      </div>

      <div class="sc-header__right">
        <!-- Notification Icon -->
        <div class="sc-notif-wrap" style="position:relative;">
          <button type="button" class="sc-icon-btn" id="sc-notif-btn" aria-label="Notifications" title="Notifications" style="background:rgba(255,255,255,0.06);color:#E2E8F0;border:1px solid rgba(255,255,255,0.12);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3a5 5 0 00-5 5v3.4c0 .5-.2 1-.5 1.4L5 15.5c-.6.8 0 2 1 2h12c1 0 1.6-1.2 1-2l-1.5-2.1c-.3-.4-.5-.9-.5-1.4V8a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20a2 2 0 004 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            <span class="sc-notif-badge" id="sc-notif-badge" hidden></span>
          </button>
          <div class="sc-notif-dropdown" id="sc-notif-dropdown" hidden style="background:#0E131F;border:1px solid rgba(255,255,255,0.12);color:#F1F5F9;"></div>
        </div>

        <!-- Switch between Shop & Auction (Real working navigation) -->
        ${isAuctionContext ? `
          <a href="/shop/shop.html" class="sc-switch-btn" title="Return to Shop Marketplace" style="background:rgba(255,255,255,0.06);color:#CBD5E1;border:1px solid rgba(255,255,255,0.15);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 5M17 13l1.4 5M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Shop Mode</span>
          </a>
        ` : `
          <a href="/auction/auctions.html" class="sc-switch-btn" style="background:rgba(15,252,190,0.12);color:#0FFCBE;border:1px solid rgba(15,252,190,0.3);" title="Go to Live Auctions Marketplace">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 4l6 6M4 14l6 6M2 22l6-6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 16l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <span>Auction Center</span>
          </a>
        `}

        <!-- User Avatar & Dropdown / Guest Auth -->
        ${user ? `
          <div class="sc-user-dropdown-wrap" style="position:relative;">
            <button type="button" class="sc-user-btn" id="sc-user-menu-btn" aria-label="User Account" style="background:rgba(255,255,255,0.06);border:1px solid rgba(15,252,190,0.25);color:#FFFFFF;">
              <span class="sc-avatar-circle" style="background:linear-gradient(135deg, #106EBE 0%, #0FFCBE 100%);color:#061B33;font-weight:800;">${initial}</span>
              <div class="sc-user-info" style="text-align:left;">
                <span class="sc-user-name" style="color:#FFFFFF;font-weight:700;">${userName}</span>
                <span class="sc-user-role" style="color:#0FFCBE;font-weight:600;font-size:0.72rem;">
                  ${isAuctionContext ? 'Bidder Account' : (user.role === 'SELLER' ? 'Seller Account' : 'Buyer Account')} ▾
                </span>
              </div>
            </button>
            <div class="sc-user-menu" id="sc-user-menu" hidden style="background:#061B33;border:1px solid rgba(15,252,190,0.25);border-radius:16px;box-shadow:0 15px 35px rgba(0,0,0,0.5);width:270px;padding:8px 0;">
              <div class="sc-user-menu__head" style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <strong style="color:#FFFFFF;display:block;font-size:0.92rem;">${user.name}</strong>
                <span style="color:#94A3B8;font-size:0.75rem;display:block;">${bidderId ? `Bidder ID: ${bidderId}` : user.email}</span>
                <div id="header-kyc-status-pill" style="display:inline-flex;align-items:center;gap:5px;margin-top:6px;font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(245,158,11,0.15);color:#F59E0B;">
                  <span>●</span> <span>KYC: Checking…</span>
                </div>
              </div>

              ${isAuctionContext ? `
                <a href="/auction/my-bids.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>📋</span> <span>My Bids</span>
                </a>
                <a href="/auction/my-bids.html?tab=won" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>🏆</span> <span>Won Auctions</span>
                </a>
                <a href="/auction/watchlist.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>♡</span> <span>Watchlist</span>
                </a>
                <a href="/wallet/index.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>💰</span> <span>Wallet & Escrow</span>
                </a>
                <a href="/auction/kyc.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>🔐</span> <span>KYC Verification</span>
                </a>
                <a href="/auction/settings.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:10px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>⚙</span> <span>Account Settings</span>
                </a>
              ` : `
                <a href="/dashboards/seller/dashboard.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>📊</span> <span>Seller Dashboard</span>
                </a>
                <a href="/seller/products.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>📦</span> <span>Products</span>
                </a>
                <a href="/seller/products.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>➕</span> <span>Add Product</span>
                </a>
                <a href="/seller/orders.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>🛒</span> <span>Orders</span>
                </a>
                <a href="/seller/auctions.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>🔨</span> <span>Auctions</span>
                </a>
                <a href="/seller/products.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>📋</span> <span>Inventory</span>
                </a>
                <a href="/seller/analytics.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>📈</span> <span>Analytics</span>
                </a>
                <a href="/seller/reviews.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>⭐</span> <span>Reviews</span>
                </a>
                <a href="/seller/status.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>🔐</span> <span>KYC &amp; Verification</span>
                </a>
                <a href="/seller/settings.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>💳</span> <span>Payouts</span>
                </a>
                <a href="/seller/settings.html" class="sc-menu-item" style="color:#CBD5E1;display:flex;align-items:center;gap:10px;padding:9px 16px;text-decoration:none;font-size:0.84rem;">
                  <span>⚙️</span> <span>Account Settings</span>
                </a>
              `}

              <hr style="margin:6px 0;border:0;border-top:1px solid rgba(255,255,255,0.08);" />
              <button type="button" class="sc-menu-item text-danger" id="sc-logout-btn" style="color:#F87171;width:100%;text-align:left;background:transparent;border:none;padding:10px 16px;font-size:0.84rem;cursor:pointer;">
                🚪 Log Out
              </button>
            </div>
          </div>
        ` : `
          <button type="button" class="btn-header-auth-trigger" id="sc-guest-auth-trigger" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg, #106EBE 0%, #0BC99A 100%);color:#FFFFFF;border:none;border-radius:999px;padding:8px 18px;font-size:0.84rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(15,252,190,0.25);">
            <span>👤</span>
            <span>Login / Sign Up</span>
          </button>
        `}
      </div>
    </header>
  `;

  // Wire sidebar toggle for mobile drawer
  const toggleBtn = mount.querySelector('#sc-sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('sc-sidebar-open');
    });
  }

  // Wire Guest Auth Modal Trigger
  const guestAuthBtn = mount.querySelector('#sc-guest-auth-trigger');
  if (guestAuthBtn) {
    guestAuthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.bmExploreModal) {
        window.bmExploreModal.open();
      } else {
        window.location.href = '/auth/login.html';
      }
    });
  }

  // Wire User Menu Dropdown
  const userBtn = mount.querySelector('#sc-user-menu-btn');
  const userMenu = mount.querySelector('#sc-user-menu');
  if (userBtn && userMenu) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.hidden = !userMenu.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!userBtn.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.hidden = true;
      }
    });
  }

  // Fetch KYC status for header badge if user logged in
  if (user && window.api) {
    window.api.get('/kyc/status')
      .then(kyc => {
        const pill = document.getElementById('header-kyc-status-pill');
        if (!pill) return;
        if (kyc.kycStatus === 'VERIFIED') {
          pill.style.background = 'rgba(16,185,129,0.15)';
          pill.style.color = '#34D399';
          pill.innerHTML = `<span>✓</span> <span>KYC Verified</span>`;
        } else if (kyc.kycStatus === 'PENDING') {
          pill.style.background = 'rgba(245,158,11,0.15)';
          pill.style.color = '#FBBF24';
          pill.innerHTML = `<span>◷</span> <span>KYC Pending</span>`;
        } else if (kyc.kycStatus === 'REJECTED') {
          pill.style.background = 'rgba(239,68,68,0.15)';
          pill.style.color = '#F87171';
          pill.innerHTML = `<span>!</span> <span>KYC Rejected</span>`;
        } else {
          pill.style.background = 'rgba(249,115,22,0.15)';
          pill.style.color = '#FB923C';
          pill.innerHTML = `<span>!</span> <span>KYC Required</span>`;
        }
      })
      .catch(() => {});
  }

  // Wire Logout
  const logoutBtn = mount.querySelector('#sc-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.auth.logout();
      window.location.href = '/auction/auctions.html';
    });
  }

  // Wire Notifications
  wireSellerNotifications(mount);

  // Wire Search Enter handler
  const searchInput = mount.querySelector('#sc-global-search');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        const query = encodeURIComponent(searchInput.value.trim());
        if (isAuctionContext) {
          window.location.href = `/auction/auctions.html?q=${query}`;
        } else if (currentPath.includes('/seller/')) {
          window.location.href = `/seller/products.html?q=${query}`;
        } else {
          window.location.href = `/search/search.html?q=${query}`;
        }
      }
    });
  }
}

async function wireSellerNotifications(mount) {
  const notifBtn = mount.querySelector('#sc-notif-btn');
  const notifBadge = mount.querySelector('#sc-notif-badge');
  const notifDropdown = mount.querySelector('#sc-notif-dropdown');
  if (!notifBtn || !notifDropdown) return;

  async function refreshBadge() {
    try {
      const { unreadCount } = await window.api.get('/notifications?limit=1');
      if (unreadCount > 0) {
        notifBadge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
        notifBadge.hidden = false;
      } else {
        notifBadge.hidden = true;
      }
    } catch {}
  }

  async function renderDropdown() {
    notifDropdown.hidden = false;
    notifDropdown.innerHTML = '<div style="padding:14px;color:#94A3B8;font-size:13px;">Loading notifications…</div>';
    try {
      const { items } = await window.api.get('/notifications?limit=5');
      if (!items || items.length === 0) {
        notifDropdown.innerHTML = '<div style="padding:14px;color:#94A3B8;font-size:13px;text-align:center;">No notifications yet.</div>';
        return;
      }
      notifDropdown.innerHTML = `
        <div class="sc-notif-list">
          ${items.map(n => `
            <div class="sc-notif-item ${n.is_read ? '' : 'unread'}" style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <strong style="color:#FFFFFF;font-size:0.85rem;display:block;">${n.title}</strong>
              <p style="color:#CBD5E1;font-size:0.78rem;margin:3px 0;">${n.message}</p>
              <span class="sc-notif-time" style="color:#64748B;font-size:0.72rem;">${new Date(n.created_at).toLocaleDateString()}</span>
            </div>
          `).join('')}
        </div>
        <div class="sc-notif-footer" style="padding:8px 14px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
          <a href="/notifications.html" style="color:#0FFCBE;font-size:0.8rem;text-decoration:none;font-weight:600;">View all notifications →</a>
        </div>
      `;
      if (items.some(n => !n.is_read)) {
        await window.api.patch('/notifications/read-all', {});
        refreshBadge();
      }
    } catch (err) {
      notifDropdown.innerHTML = `<div style="padding:14px;color:#EF4444;font-size:13px;">${err.message}</div>`;
    }
  }

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (notifDropdown.hidden) renderDropdown();
    else notifDropdown.hidden = true;
  });

  document.addEventListener('click', (e) => {
    if (!notifDropdown.hidden && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
      notifDropdown.hidden = true;
    }
  });

  refreshBadge();
}

document.addEventListener('DOMContentLoaded', renderSellerHeader);
document.addEventListener('bidmart:auth-change', renderSellerHeader);
