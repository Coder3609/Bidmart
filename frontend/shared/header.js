/**
 * BidMart Shared Site Header Component
 * Provides clean responsive header layout, mode switch, universal search,
 * cart & notification badges, and the unified BidMart Account Menu component.
 */

function renderHeader() {
  const mount = document.getElementById('site-header');
  if (!mount) return;

  const user = window.auth ? window.auth.getUser() : null;
  const currentPath = window.location.pathname.toLowerCase();
  const initial = user && user.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
  const displayName = user ? (user.store_name || user.name || 'User') : '';
  const firstName = displayName.split(' ')[0];

  mount.innerHTML = `
    <header class="site-header">
      <div class="site-header__inner">
        
        <!-- Left: Brand Logo -->
        <a href="/index.html" class="brand" aria-label="BidMart Home">
          <span class="brand__mark" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="8" fill="#106EBE"/>
              <path d="M7 19L12 9.5l2.8 5.8 2.4-4.5 3.8 8.2" stroke="#0FFCBE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <div class="brand__text">
            <span class="brand__name">BidMart</span>
            <span class="brand__slogan">Shop it. Bid it. Own it.</span>
          </div>
        </a>

        <!-- Center: Primary Nav Links -->
        <nav class="site-nav" aria-label="Primary Navigation">
          <a href="/index.html" class="${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}">Home</a>
          <a href="/shop/shop.html#categories">Categories</a>
          <a href="/shop/shop.html">Products</a>
          <a href="/index.html#contact">Contact</a>
        </nav>

        <!-- Center: Universal Responsive Search Bar -->
        <div class="site-search-wrap">
          <form class="site-search" role="search" action="/search/search.html" method="get" id="site-search-form">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#6B7280" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/></svg>
            <label for="site-search-input" class="visually-hidden">Search products, brands, categories...</label>
            <input id="site-search-input" name="q" type="search" placeholder="Search products, brands, categories..." autocomplete="off" />
            <a href="/scan/scan.html" class="scan-inline-btn" aria-label="Scan QR, barcode or image" title="Scan Barcode or Image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 8V5a1 1 0 011-1h3M20 8V5a1 1 0 00-1-1h-3M4 16v3a1 1 0 001 1h3M20 16v3a1 1 0 01-1 1h-3M4 12h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </form>
          <div class="search-dropdown" id="search-dropdown" hidden></div>
        </div>

        <!-- Mode Switcher: Shop | Auction -->
        <div class="mode-toggle-switch">
          <a href="/shop/shop.html" class="mode-toggle-btn ${!currentPath.includes('/auction/') && !currentPath.includes('/wallet/') ? 'active' : ''}" title="Shop Fixed Price Marketplace">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 5M17 13l1.4 5M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>Shop</span>
          </a>
          <a href="/auction/auctions.html" class="mode-toggle-btn ${currentPath.includes('/auction/') || currentPath.includes('/wallet/') ? 'active' : ''}" title="Auction Center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 4l6 6M4 14l6 6M2 22l6-6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 16l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            <span>Auction</span>
          </a>
        </div>

        <!-- Right: Action Icons & Account Component -->
        <div class="site-header__actions">
          
          <a href="/shop/wishlist.html" class="icon-btn" aria-label="Wishlist" title="Your Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.35-9.5-8.5C.7 8.9 2.6 5 6.3 5c2 0 3.4 1 5.7 3.2C14.3 6 15.7 5 17.7 5c3.7 0 5.6 3.9 3.8 7.5C19 16.65 12 21 12 21z" stroke="currentColor" stroke-width="1.8"/></svg>
          </a>

          <a href="/shop/cart.html" class="icon-btn cart-btn-header" aria-label="Shopping Cart" title="View Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 4h2l2.4 12.2a2 2 0 002 1.8h7.2a2 2 0 002-1.6L20 8H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="21" r="1.4" fill="currentColor"/><circle cx="17" cy="21" r="1.4" fill="currentColor"/></svg>
            <span class="cart-badge" id="header-cart-badge" hidden>0</span>
          </a>

          ${user ? `
            <!-- Notifications Icon -->
            <div class="notif-wrap" style="position:relative;">
              <button type="button" class="icon-btn" id="notif-bell" aria-label="Notifications" title="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3a5 5 0 00-5 5v3.4c0 .5-.2 1-.5 1.4L5 15.5c-.6.8 0 2 1 2h12c1 0 1.6-1.2 1-2l-1.5-2.1c-.3-.4-.5-.9-.5-1.4V8a5 5 0 00-5-5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20a2 2 0 004 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                <span class="notif-badge" id="notif-badge" hidden></span>
              </button>
              <div class="search-dropdown" id="notif-dropdown" style="right:0;left:auto;width:320px;" hidden></div>
            </div>

            <!-- Reusable BidMart Account Menu Component -->
            <div class="bm-account-menu-wrap" id="bm-account-menu-wrap">
              <button type="button" class="bm-account-btn" id="bm-account-btn" aria-expanded="false" aria-label="Account menu for ${displayName}">
                <span class="bm-account-avatar">${initial}</span>
                <div class="bm-account-info">
                  <span class="bm-account-name">${firstName}</span>
                  <span class="bm-account-sub">
                    ${user.role === 'SELLER' ? 'Seller Account' : (user.role === 'ADMIN' ? 'Admin' : 'Buyer Account')}
                    <span class="bm-account-caret">▾</span>
                  </span>
                </div>
              </button>

              <div class="bm-account-dropdown" id="bm-account-dropdown" hidden>
                <div class="bm-account-dropdown-header">
                  <span class="bm-account-avatar" style="width:40px;height:40px;font-size:16px;">${initial}</span>
                  <div class="bm-account-dropdown-user">
                    <span class="bm-account-dropdown-name">${displayName}</span>
                    <span class="bm-account-dropdown-email">${user.email}</span>
                    <span class="bm-account-dropdown-badge ${user.role.toLowerCase()}">${user.role} ACCOUNT</span>
                  </div>
                </div>

                <div class="bm-account-dropdown-list">
                  ${user.role === 'BUYER' ? `
                    <a href="/dashboards/buyer/dashboard.html#profile" class="bm-account-dropdown-item">
                      <span>👤</span> <span>My Profile</span>
                    </a>
                    <a href="/dashboards/buyer/dashboard.html" class="bm-account-dropdown-item">
                      <span>📊</span> <span>Buyer Dashboard</span>
                    </a>
                    <a href="/shop/orders.html" class="bm-account-dropdown-item">
                      <span>📦</span> <span>My Orders</span>
                    </a>
                    <a href="/auction/my-bids.html" class="bm-account-dropdown-item">
                      <span>🔨</span> <span>My Bids</span>
                    </a>
                    <a href="/shop/wishlist.html" class="bm-account-dropdown-item">
                      <span>♡</span> <span>Wishlist</span>
                    </a>
                    <a href="/wallet/index.html" class="bm-account-dropdown-item">
                      <span>💰</span> <span>Wallet & Escrow</span>
                    </a>
                    <a href="/auction/settings.html" class="bm-account-dropdown-item">
                      <span>⚙️</span> <span>Account Settings</span>
                    </a>
                    <a href="/notifications.html" class="bm-account-dropdown-item">
                      <span>🔔</span> <span>Notifications</span>
                    </a>
                  ` : (user.role === 'SELLER' ? `
                    <a href="/seller/settings.html#profile" class="bm-account-dropdown-item">
                      <span>👤</span> <span>My Profile</span>
                    </a>
                    <a href="/dashboards/seller/dashboard.html" class="bm-account-dropdown-item">
                      <span>📊</span> <span>Seller Dashboard</span>
                    </a>
                    <a href="/seller/products.html" class="bm-account-dropdown-item">
                      <span>📦</span> <span>Products & Inventory</span>
                    </a>
                    <a href="/seller/orders.html" class="bm-account-dropdown-item">
                      <span>🛒</span> <span>Orders</span>
                    </a>
                    <a href="/seller/auctions.html" class="bm-account-dropdown-item">
                      <span>🔨</span> <span>Auctions</span>
                    </a>
                    <a href="/seller/analytics.html" class="bm-account-dropdown-item">
                      <span>📈</span> <span>Analytics</span>
                    </a>
                    <a href="/seller/reviews.html" class="bm-account-dropdown-item">
                      <span>⭐</span> <span>Reviews</span>
                    </a>
                    <a href="/seller/status.html" class="bm-account-dropdown-item">
                      <span>🪪</span> <span>KYC & Verification</span>
                    </a>
                    <a href="/seller/settings.html" class="bm-account-dropdown-item">
                      <span>⚙️</span> <span>Account Settings</span>
                    </a>
                    <a href="/seller/notifications.html" class="bm-account-dropdown-item">
                      <span>🔔</span> <span>Notifications</span>
                    </a>
                  ` : `
                    <a href="/dashboards/admin/dashboard.html#profile" class="bm-account-dropdown-item">
                      <span>👤</span> <span>My Profile</span>
                    </a>
                    <a href="/dashboards/admin/dashboard.html" class="bm-account-dropdown-item">
                      <span>📊</span> <span>Admin Dashboard</span>
                    </a>
                    <a href="/dashboards/admin/dashboard.html#sellers" class="bm-account-dropdown-item">
                      <span>👥</span> <span>Management</span>
                    </a>
                    <a href="/dashboards/admin/dashboard.html#sales" class="bm-account-dropdown-item">
                      <span>📈</span> <span>Reports & Metrics</span>
                    </a>
                    <a href="/auction/settings.html" class="bm-account-dropdown-item">
                      <span>⚙️</span> <span>Account Settings</span>
                    </a>
                  `)}

                  <div class="bm-account-dropdown-divider"></div>
                  
                  <button type="button" class="bm-account-dropdown-item logout" data-action="logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <!-- Guest Login / Sign Up CTA -->
            <button type="button" class="guest-account-btn" id="header-auth-trigger" aria-label="Sign In or Create Account">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Login / Sign In</span>
            </button>
          `}

        </div>
      </div>
    </header>
  `;

  // Wire Guest Login Button
  const authTrigger = mount.querySelector('#header-auth-trigger');
  if (authTrigger) {
    authTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.buyerAuth) {
        window.buyerAuth.open('login');
      } else {
        window.location.href = '/auth/login.html';
      }
    });
  }

  // Wire Account Dropdown Toggle with full keyboard & outside click handlers
  const accountBtn = mount.querySelector('#bm-account-btn');
  const accountDropdown = mount.querySelector('#bm-account-dropdown');
  if (accountBtn && accountDropdown) {
    const toggleDropdown = (open) => {
      const isOpen = open !== undefined ? open : accountDropdown.hidden;
      accountDropdown.hidden = !isOpen;
      accountBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    accountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown();
    });

    document.addEventListener('click', (e) => {
      if (!accountBtn.contains(e.target) && !accountDropdown.contains(e.target)) {
        toggleDropdown(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !accountDropdown.hidden) {
        toggleDropdown(false);
        accountBtn.focus();
      }
    });

    accountDropdown.querySelectorAll('.bm-account-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        toggleDropdown(false);
      });
    });
  }

  // Wire Logout Button
  const logoutBtns = mount.querySelectorAll('[data-action="logout"]');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await window.auth.logout();
      if (window.buyerAuth && typeof window.buyerAuth.showToast === 'function') {
        window.buyerAuth.showToast('Logged out successfully.');
      }
      renderHeader();
      window.location.href = '/index.html';
    });
  });

  wireSearchDropdown(mount);
  if (user) {
    wireNotifications(mount);
    updateCartBadge();
  }

  wireSellerButtons();
}

function wireSellerButtons() {
  const sellerLinks = document.querySelectorAll('a[href*="role=SELLER"], a[href*="register.html?role=SELLER"], .btn-become-seller, #btn-become-seller');
  sellerLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const user = window.auth ? window.auth.getUser() : null;
      if (user && user.role === 'SELLER') {
        window.location.href = '/dashboards/seller/dashboard.html';
      } else if (window.sellerAuth) {
        window.sellerAuth.open('signup');
      } else {
        window.location.href = '/seller/onboarding.html';
      }
    });
  });
}

async function updateCartBadge() {
  const badge = document.getElementById('header-cart-badge');
  if (!badge || !window.api) return;
  try {
    const { items } = await window.api.get('/cart');
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQty > 0) {
      badge.textContent = totalQty > 99 ? '99+' : String(totalQty);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  } catch {
    badge.hidden = true;
  }
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function wireNotifications(mount) {
  const bell = mount.querySelector('#notif-bell');
  const badge = mount.querySelector('#notif-badge');
  const dropdown = mount.querySelector('#notif-dropdown');
  if (!bell) return;

  async function refreshBadge() {
    try {
      const { unreadCount } = await window.api.get('/notifications?limit=1');
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    } catch { /* not logged in / transient */ }
  }

  async function renderDropdown() {
    dropdown.hidden = false;
    dropdown.innerHTML = '<div class="search-dropdown__section"><p class="text-muted" style="padding:10px 14px;">Loading…</p></div>';
    try {
      const { items } = await window.api.get('/notifications?limit=6');
      if (items.length === 0) {
        dropdown.innerHTML = '<div class="search-dropdown__section"><p class="text-muted" style="padding:10px 14px;">No notifications yet.</p></div>';
        return;
      }
      dropdown.innerHTML = `
        <div class="search-dropdown__section">
          ${items.map((n) => `
            <div class="search-dropdown__item" style="display:block;white-space:normal;${n.is_read ? '' : 'background:var(--color-primary-light);'}">
              <strong style="font-size:var(--font-size-sm);">${n.title}</strong>
              <div class="text-muted" style="font-size:var(--font-size-xs);">${n.message}</div>
              <div class="text-muted" style="font-size:var(--font-size-xs);margin-top:2px;">${timeAgo(n.created_at)}</div>
            </div>
          `).join('')}
        </div>
        <div class="search-dropdown__section" style="text-align:center;">
          <a href="/notifications.html" style="font-size:var(--font-size-sm);color:var(--color-primary);font-weight:600;">View all notifications</a>
        </div>
      `;
      if (items.some((n) => !n.is_read)) {
        await window.api.patch('/notifications/read-all', {});
        refreshBadge();
      }
    } catch (err) {
      dropdown.innerHTML = `<div class="search-dropdown__section"><p class="text-muted" style="padding:10px 14px;">${err.message}</p></div>`;
    }
  }

  bell.addEventListener('click', (event) => {
    event.stopPropagation();
    if (dropdown.hidden) renderDropdown();
    else dropdown.hidden = true;
  });
  document.addEventListener('click', (event) => {
    if (!dropdown.hidden && !dropdown.contains(event.target) && event.target !== bell) {
      dropdown.hidden = true;
    }
  });

  refreshBadge();
}

function wireSearchDropdown(mount) {
  const input = mount.querySelector('#site-search-input');
  const dropdown = mount.querySelector('#search-dropdown');
  if (!input || !dropdown || !window.api) return;

  let debounceTimer = null;

  function renderList(title, values, { clearable = false } = {}) {
    if (!values || values.length === 0) return '';
    const items = values.map((v) => `<button type="button" class="search-dropdown__item" data-value="${v}">${v}</button>`).join('');
    const clearBtn = clearable ? `<button type="button" class="search-dropdown__clear" id="clear-recent-btn">Clear</button>` : '';
    return `<div class="search-dropdown__section"><div class="search-dropdown__label">${title}${clearBtn}</div>${items}</div>`;
  }

  async function refresh() {
    const q = input.value.trim();
    try {
      const result = await window.api.get(`/search/assist${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      if (result.mode === 'autocomplete') {
        dropdown.innerHTML = renderList('Suggestions', result.suggestions.map((s) => s.value));
      } else {
        dropdown.innerHTML =
          renderList('Recent Searches', result.recent, { clearable: result.recent.length > 0 }) +
          renderList('Popular Searches', result.popular);
      }
      dropdown.hidden = dropdown.innerHTML.trim() === '';

      dropdown.querySelectorAll('[data-value]').forEach((btn) => {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = btn.dataset.value;
          input.closest('form').submit();
        });
      });
      const clearBtn = dropdown.querySelector('#clear-recent-btn');
      if (clearBtn) {
        clearBtn.addEventListener('mousedown', async (e) => {
          e.preventDefault();
          try { await window.api.delete('/search/recent'); } catch { /* ignore */ }
          refresh();
        });
      }
    } catch {
      dropdown.hidden = true;
    }
  }

  input.addEventListener('focus', refresh);
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refresh, 250);
  });
  input.addEventListener('blur', () => {
    setTimeout(() => { dropdown.hidden = true; }, 150);
  });
}

// Ensure auth modal dependencies are available
function ensureAuthModalAssets() {
  if (!document.getElementById('buyer-auth-css')) {
    const link = document.createElement('link');
    link.id = 'buyer-auth-css';
    link.rel = 'stylesheet';
    link.href = '/shared/auth-modal.css';
    document.head.appendChild(link);
  }
  if (!window.buyerAuth && !document.getElementById('buyer-auth-js')) {
    const script = document.createElement('script');
    script.id = 'buyer-auth-js';
    script.src = '/shared/auth-modal.js';
    document.body.appendChild(script);
  }
  if (!document.getElementById('seller-auth-css')) {
    const sLink = document.createElement('link');
    sLink.id = 'seller-auth-css';
    sLink.rel = 'stylesheet';
    sLink.href = '/shared/seller-auth-modal.css';
    document.head.appendChild(sLink);
  }
  if (!window.sellerAuth && !document.getElementById('seller-auth-js')) {
    const sScript = document.createElement('script');
    sScript.id = 'seller-auth-js';
    sScript.src = '/shared/seller-auth-modal.js';
    document.body.appendChild(sScript);
  }
}

window.renderHeader = renderHeader;
document.addEventListener('DOMContentLoaded', () => {
  ensureAuthModalAssets();
  renderHeader();
});
document.addEventListener('bidmart:auth-change', renderHeader);
