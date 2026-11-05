/**
 * BidMart Seller Center — Shared Left Sidebar Navigation Component
 * Renders the persistent sidebar into <div id="seller-sidebar"></div>
 */

function renderSellerSidebar() {
  const mount = document.getElementById('seller-sidebar');
  if (!mount) return;

  const currentPath = window.location.pathname.toLowerCase();

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/dashboards/seller/dashboard.html',
      match: ['/dashboards/seller/dashboard.html', '/dashboards/seller/'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'products',
      label: 'Products',
      href: '/seller/products.html',
      match: ['/seller/products.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'orders',
      label: 'Orders',
      href: '/seller/orders.html',
      match: ['/seller/orders.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'auctions',
      label: 'Auctions',
      href: '/seller/auctions.html',
      match: ['/seller/auctions.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 4l6 6M4 14l6 6M2 22l6-6M9 9l6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'sales',
      label: 'Sales & Revenue',
      href: '/seller/sales.html',
      match: ['/seller/sales.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'returns',
      label: 'Returns & Refunds',
      href: '/seller/returns.html',
      match: ['/seller/returns.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'reviews',
      label: 'Reviews',
      href: '/seller/reviews.html',
      match: ['/seller/reviews.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/seller/notifications.html',
      match: ['/seller/notifications.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/seller/analytics.html',
      match: ['/seller/analytics.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/seller/settings.html',
      match: ['/seller/settings.html'],
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.8"/></svg>`,
    },
  ];

  mount.innerHTML = `
    <aside class="sc-sidebar" id="sc-main-sidebar">
      <!-- Sidebar Brand / Title -->
      <div class="sc-sidebar__brand">
        <div class="sc-sidebar__brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" stroke="#00E6B8" stroke-width="2"/><path d="M9 12h6M12 9v6" stroke="#00E6B8" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <span class="sc-sidebar__brand-title">Seller Center</span>
      </div>

      <!-- Navigation Links -->
      <nav class="sc-sidebar__nav" aria-label="Seller Center Navigation">
        ${navItems.map(item => {
          const isActive = item.match.some(p => currentPath === p || currentPath.endsWith(p));
          return `
            <a href="${item.href}" class="sc-nav-link ${isActive ? 'active' : ''}" data-nav="${item.id}">
              <span class="sc-nav-icon">${item.icon}</span>
              <span class="sc-nav-label">${item.label}</span>
            </a>
          `;
        }).join('')}
      </nav>

      <!-- Bottom Card: Seller Status & View Store -->
      <div class="sc-sidebar__footer">
        <div class="sc-status-card">
          <div class="sc-status-indicator">
            <span class="sc-status-dot"></span>
            <span class="sc-status-text">Seller Status</span>
          </div>
          <div class="sc-status-badge">● Active</div>
          <a href="/shop/shop.html" class="sc-view-store-btn" target="_blank" rel="noopener">
            <span>View Store</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>
    </aside>
  `;
}

document.addEventListener('DOMContentLoaded', renderSellerSidebar);
