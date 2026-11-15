/**
 * BidMart Auction Marketplace & Buyer Sidebar Navigation Component
 * Dedicated to Auction Center: Clean, focused, and free of Shop/Category & Shop Orders clutter.
 */

function renderAuctionSidebar() {
  const mount = document.getElementById('auction-sidebar');
  if (!mount) return;

  const currentPath = window.location.pathname.toLowerCase();
  const currentSearch = window.location.search;
  const user = window.auth ? window.auth.getUser() : null;

  const navItems = [
    {
      id: 'auction-home',
      label: 'Auction Home',
      href: '/auction/auctions.html',
      isProtected: false,
      isActive: currentPath === '/auction/auctions.html' && (!currentSearch || currentSearch === '?status=ALL'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'live-auctions',
      label: 'Live Auctions',
      href: '/auction/auctions.html?status=LIVE',
      isProtected: false,
      isActive: currentPath === '/auction/auctions.html' && (currentSearch.includes('status=LIVE') || currentPath.includes('auction-detail.html')),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 4l6 6M4 14l6 6M2 22l6-6M9 9l6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'ending-soon',
      label: 'Ending Soon',
      href: '/auction/auctions.html?status=ENDING_SOON',
      isProtected: false,
      isActive: currentSearch.includes('ENDING_SOON') || currentSearch.includes('endingSoon=true'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'upcoming-auctions',
      label: 'Upcoming Auctions',
      href: '/auction/auctions.html?status=SCHEDULED',
      isProtected: false,
      isActive: currentSearch.includes('status=SCHEDULED'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'won-auctions',
      label: 'Won Auctions',
      href: '/auction/my-bids.html?tab=won',
      isProtected: true,
      isActive: currentPath.includes('my-bids.html') && currentSearch.includes('tab=won'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H7M14 14.66V17c0 .55.45 1 1 1h2M18 4H6v7a6 6 0 0012 0V4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'my-bids',
      label: 'My Bids',
      href: '/auction/my-bids.html',
      isProtected: true,
      isActive: currentPath.includes('my-bids.html') && !currentSearch.includes('tab=won'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      href: '/auction/watchlist.html',
      isProtected: true,
      isActive: currentPath.includes('watchlist.html'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.35-9.5-8.5C.7 8.9 2.6 5 6.3 5c2 0 3.4 1 5.7 3.2C14.3 6 15.7 5 17.7 5c3.7 0 5.6 3.9 3.8 7.5C19 16.65 12 21 12 21z" stroke="currentColor" stroke-width="1.8"/></svg>`,
    },
    {
      id: 'wallet',
      label: 'Wallet',
      href: '/wallet/index.html',
      isProtected: true,
      isActive: currentPath.includes('/wallet/'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h20M16 14h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    },
    {
      id: 'kyc',
      label: 'KYC Verification',
      href: '/auction/kyc.html',
      isProtected: true,
      isActive: currentPath.includes('kyc.html'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/notifications.html',
      isProtected: true,
      isActive: currentPath.includes('notifications.html'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      id: 'settings',
      label: 'Account / Settings',
      href: '/auction/settings.html',
      isProtected: true,
      isActive: currentPath.includes('/auction/settings.html') || currentPath.includes('/dashboards/buyer/'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.8"/></svg>`,
    },
  ];

  mount.innerHTML = `
    <aside class="sc-sidebar" id="auction-main-sidebar" style="background:#061B33;border-right:1px solid rgba(15,252,190,0.15);color:#E2E8F0;">
      <!-- Sidebar Brand / Title -->
      <div class="sc-sidebar__brand" style="border-bottom:1px solid rgba(255,255,255,0.08);padding:18px 20px;">
        <div class="sc-sidebar__brand-icon" style="background:rgba(15,252,190,0.15);border:1px solid rgba(15,252,190,0.3);padding:6px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 4l6 6M4 14l6 6M2 22l6-6M9 9l6 6" stroke="#0FFCBE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 16l4 4" stroke="#0FFCBE" stroke-width="2.2" stroke-linecap="round"/></svg>
        </div>
        <div style="display:flex;flex-direction:column;line-height:1.2;">
          <span class="sc-sidebar__brand-title" style="color:#FFFFFF;font-weight:700;font-size:1.05rem;letter-spacing:-0.2px;">Auction Center</span>
          <span style="font-size:0.72rem;color:#0FFCBE;font-weight:600;">Verified Bidding</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="sc-sidebar__nav" aria-label="Auction Navigation" style="padding:14px 12px;display:flex;flex-direction:column;gap:4px;">
        ${navItems.map(item => `
          <a href="${item.href}" 
             class="sc-nav-link ${item.isActive ? 'active' : ''}" 
             data-nav="${item.id}"
             data-protected="${item.isProtected}"
             style="${item.isActive ? 'background:linear-gradient(90deg, rgba(16,110,190,0.3) 0%, rgba(15,252,190,0.1) 100%);color:#0FFCBE;border-left:3px solid #0FFCBE;' : 'color:#CBD5E1;'}">
            <span class="sc-nav-icon" style="${item.isActive ? 'color:#0FFCBE;' : 'color:#94A3B8;'}">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <!-- Sidebar Status & Bidder Verification Card -->
      <div class="sc-sidebar__footer" style="padding:14px;border-top:1px solid rgba(255,255,255,0.08);margin-top:auto;">
        <div class="sc-status-card" id="sidebar-bidder-card" style="background:rgba(255,255,255,0.04);border:1px solid rgba(15,252,190,0.2);border-radius:14px;padding:14px;box-shadow:0 4px 14px rgba(0,0,0,0.2);">
          
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span id="sidebar-status-dot" style="width:8px;height:8px;border-radius:50%;background:${user ? '#10B981' : '#94A3B8'};box-shadow:0 0 8px ${user ? '#10B981' : 'transparent'};"></span>
              <span style="font-size:0.72rem;font-weight:700;color:#94A3B8;letter-spacing:0.5px;">BIDDER STATUS</span>
            </div>
            <span id="sidebar-bidder-status-badge" style="font-size:0.7rem;padding:2px 6px;border-radius:4px;background:rgba(16,185,129,0.15);color:#34D399;font-weight:700;">
              ${user ? 'Active' : 'Guest'}
            </span>
          </div>

          <div id="sidebar-bidder-name" style="font-size:0.88rem;font-weight:700;color:#FFFFFF;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${user ? user.name : 'Guest Visitor'}
          </div>

          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;font-size:0.75rem;">
            <div style="display:flex;justify-content:space-between;color:#94A3B8;">
              <span>KYC:</span>
              <strong id="sidebar-kyc-badge" style="color:#F59E0B;">Loading…</strong>
            </div>
            <div style="display:flex;justify-content:space-between;color:#94A3B8;">
              <span>Wallet:</span>
              <strong id="sidebar-wallet-balance" style="color:#0FFCBE;">₹0.00</strong>
            </div>
          </div>

          <a href="${user ? '/auction/settings.html' : '#login'}" 
             id="sidebar-manage-btn" 
             class="sc-status-btn" 
             style="display:block;text-align:center;padding:7px;background:linear-gradient(135deg, rgba(16,110,190,0.4) 0%, rgba(15,252,190,0.2) 100%);color:#0FFCBE;border:1px solid rgba(15,252,190,0.3);border-radius:8px;font-size:0.75rem;font-weight:700;text-decoration:none;transition:all 0.2s ease;">
            ${user ? '⚙ Manage Account' : '👤 Bidder Login / Sign Up'}
          </a>
        </div>
      </div>
    </aside>
  `;

  // Wire Protected Link Clicks for Guests
  mount.querySelectorAll('.sc-nav-link[data-protected="true"]').forEach(link => {
    link.addEventListener('click', (e) => {
      if (!window.auth || !window.auth.isLoggedIn()) {
        e.preventDefault();
        const targetHref = link.getAttribute('href');
        if (window.bmExploreModal) {
          window.bmExploreModal.open(() => {
            window.location.href = targetHref;
          });
        } else {
          window.location.href = '/auth/login.html';
        }
      }
    });
  });

  // Wire Guest Manage Button Click
  const manageBtn = document.getElementById('sidebar-manage-btn');
  if (manageBtn && (!user || !window.auth || !window.auth.isLoggedIn())) {
    manageBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.bmExploreModal) {
        window.bmExploreModal.open(() => {
          window.location.href = '/auction/settings.html';
        });
      } else {
        window.location.href = '/auth/login.html';
      }
    });
  }

  // Fetch real KYC status & wallet balance for logged-in user
  if (user && window.api) {
    // 1. KYC status
    window.api.get('/kyc/status')
      .then(kyc => {
        const badge = document.getElementById('sidebar-kyc-badge');
        if (!badge) return;
        if (kyc.kycStatus === 'VERIFIED') {
          badge.textContent = '✓ Verified';
          badge.style.color = '#10B981';
        } else if (kyc.kycStatus === 'PENDING') {
          badge.textContent = '◷ Pending';
          badge.style.color = '#F59E0B';
        } else if (kyc.kycStatus === 'REJECTED') {
          badge.textContent = '! Rejected';
          badge.style.color = '#EF4444';
        } else {
          badge.textContent = '! Required';
          badge.style.color = '#F97316';
        }
      })
      .catch(() => {
        const badge = document.getElementById('sidebar-kyc-badge');
        if (badge) {
          badge.textContent = '! Required';
          badge.style.color = '#F97316';
        }
      });

    // 2. Wallet balance
    window.api.get('/wallet')
      .then(wallet => {
        const el = document.getElementById('sidebar-wallet-balance');
        if (el) {
          el.textContent = `₹${Number(wallet.available_balance || 0).toLocaleString('en-IN')}`;
        }
      })
      .catch(() => {
        const el = document.getElementById('sidebar-wallet-balance');
        if (el) el.textContent = '₹0.00';
      });
  } else {
    const kycBadge = document.getElementById('sidebar-kyc-badge');
    if (kycBadge) {
      kycBadge.textContent = 'Login Required';
      kycBadge.style.color = '#94A3B8';
    }
    const walletEl = document.getElementById('sidebar-wallet-balance');
    if (walletEl) {
      walletEl.textContent = 'Login Required';
      walletEl.style.color = '#94A3B8';
    }
  }
}

// Auto-render if container is present on DOM ready
document.addEventListener('DOMContentLoaded', renderAuctionSidebar);
document.addEventListener('bidmart:auth-change', renderAuctionSidebar);
