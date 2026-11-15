/**
 * BIDMART UNIVERSAL SHARED NAVBAR ENGINE
 * Full Day/Night Mode synchronizer.
 * Switches between Obsidian Dark and Light mode across all pages seamlessly.
 */

// 1. Initialize Theme on startup
(function initGlobalTheme() {
  const saved = localStorage.getItem('bidmart_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

// 2. Global Toggle Function
function toggleGlobalTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bidmart_theme', next);

  // Update theme toggle icons
  document.querySelectorAll('.bm-theme-toggle-btn').forEach(btn => {
    btn.innerHTML = next === 'dark' ? '🌙' : '☀️';
    btn.title = next === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
}
window.toggleGlobalTheme = toggleGlobalTheme;

// 3. Render Universal Header
function renderHeader() {
  const mount = document.getElementById('site-header');
  if (!mount) return;

  const isSellerContext = window.location.pathname.startsWith('/seller/');
  let user = null;
  if (window.auth) {
    user = isSellerContext ? (window.auth.getSellerUser() || window.auth.getUser()) : window.auth.getUser();
  }

  // On customer pages, treat user as customer. On seller pages, treat as merchant.
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const initial = user && user.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
  const displayName = user ? (isSellerContext ? (user.store_name || user.name || 'Store') : (user.name || 'User')) : '';
  const firstName = displayName.split(' ')[0];

  mount.innerHTML = `
    <header class="bm-universal-header">
      <div class="bm-universal-header-inner">
        
        <!-- Left: Brand Logo -->
        <a href="/market.html" class="bm-header-brand" aria-label="BidMart Home">
          <span class="bm-header-brand-title">BIDMART</span>
        </a>

        <!-- Omnibar Search with Department Selector -->
        <form class="bm-header-omnibar" onsubmit="event.preventDefault(); const q = document.getElementById('bmGlobalSearchInput').value.trim(); const d = document.getElementById('bmGlobalDeptSelect').value; window.location.href = '/shop/shop.html?' + (d ? 'category=' + encodeURIComponent(d) + '&' : '') + (q ? 'q=' + encodeURIComponent(q) : '');">
          <select class="bm-header-dept-select" id="bmGlobalDeptSelect">
            <option value="">All Departments</option>
            <option value="mobiles-accessories">Flagship Mobiles</option>
            <option value="computers-laptops">Computers & Laptops</option>
            <option value="audio">Acoustics & Audio</option>
            <option value="bags-accessories">The Vault & Watches</option>
            <option value="gaming">Gaming & Consoles</option>
            <option value="electronics">4K Displays & TVs</option>
            <option value="mens-fashion">Men's Fashion</option>
            <option value="womens-fashion">Women's Fashion</option>
            <option value="home-kitchen">Home & Kitchen</option>
            <option value="beauty-personal-care">Beauty & Grooming</option>
          </select>
          <input type="text" class="bm-header-search-input" id="bmGlobalSearchInput" placeholder="Search across all 200+ drops..." autocomplete="off" />
          <button type="submit" class="bm-header-search-submit" aria-label="Search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </form>

        <!-- Right: Actions (Theme Toggle, Live Pit, Cart, Sign In / Profile) -->
        <div class="bm-header-actions">

          <!-- Day / Night Toggle Button -->
          <button type="button" class="bm-theme-toggle-btn" onclick="window.toggleGlobalTheme()" title="${currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}">
            ${currentTheme === 'dark' ? '🌙' : '☀️'}
          </button>

          <!-- Become a Seller: Always opens dedicated Seller Portal in a NEW TAB -->
          ${!isSellerContext ? `
            <a href="/seller/index.html" target="_blank" class="bm-btn-seller-nav" title="Open Merchant Onboarding Portal in New Tab">
              <span>Seller Hub ↗</span>
            </a>
          ` : `
            <a href="/seller/products.html" class="bm-btn-seller-nav" title="Merchant Studio">
              <span>🏪 Store Console</span>
            </a>
          `}

          <!-- Cart Action Button -->
          <button type="button" class="bm-btn-cart-pill" id="bmNavCartBtn" onclick="window.bmCheckout ? window.bmCheckout.open() : window.location.href='/shop/cart.html'" title="Shopping Cart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span>Cart</span>
            <span class="bm-cart-pill-count" id="header-cart-badge">0</span>
          </button>

          <!-- User Profile or Guest Login Button -->
          ${user ? `
            <div class="bm-user-dropdown-wrap" style="position:relative;">
              <button type="button" class="bm-btn-user-pill" id="bmUserBtn">
                <span class="bm-avatar-circle">${initial}</span>
                <span class="bm-user-name">${firstName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div class="bm-user-dropdown-menu" id="bmUserDropdown" hidden>
                <div class="bm-user-dropdown-info">
                  <div style="font-weight:700;">${displayName}</div>
                  <div style="font-size:0.75rem;opacity:0.8;">${user.email}</div>
                </div>
                <div class="bm-user-dropdown-divider"></div>
                ${isSellerContext ? `
                  <a href="/seller/profile.html" class="bm-user-dropdown-link">🏢 Store Profile &amp; KYC</a>
                  <a href="/seller/products.html" class="bm-user-dropdown-link">📦 Product Studio</a>
                  <a href="/seller/auctions.html" class="bm-user-dropdown-link">⚡ Auction Arena</a>
                  <div class="bm-user-dropdown-divider"></div>
                  <a href="/market.html" target="_blank" class="bm-user-dropdown-link">🛒 View Customer Market ↗</a>
                ` : `
                  <a href="/shop/profile.html" class="bm-user-dropdown-link">👤 My Account &amp; Bids</a>
                  <a href="/shop/cart.html" class="bm-user-dropdown-link">🛒 Cart &amp; Checkout</a>
                  <a href="/auction/auctions.html" class="bm-user-dropdown-link">⚡ Live Auction Arena</a>
                `}
                <div class="bm-user-dropdown-divider"></div>
                <button type="button" class="bm-user-dropdown-link logout" onclick="if(window.auth) window.auth.logout(); window.location.reload();">Sign Out</button>
              </div>
            </div>
          ` : `
            <button type="button" class="bm-btn-signin-pill" id="header-auth-trigger" onclick="window.bmExploreModal ? window.bmExploreModal.open() : window.location.href='/auth/login.html'">
              <span>Sign In</span>
            </button>
          `}

        </div>
      </div>
    </header>
  `;

  // Dropdown interactions
  const userBtn = mount.querySelector('#bmUserBtn');
  const userDropdown = mount.querySelector('#bmUserDropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.hidden = !userDropdown.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.hidden = true;
      }
    });
  }

  // Update badge count
  if (window.bmCheckout && typeof window.bmCheckout.updateBadge === 'function') {
    window.bmCheckout.updateBadge();
  }
}

// Auto init
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
});
document.addEventListener('bidmart:auth-change', renderHeader);
window.renderHeader = renderHeader;
