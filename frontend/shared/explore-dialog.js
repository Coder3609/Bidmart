/**
 * BidMart Modern Dual-Sided Auth Dialog (Sign in / Sign up + Guest)
 */
(function() {
  function renderExploreModal() {
    if (document.getElementById('bmExploreModalOverlay')) return;

    const modal = document.createElement('div');
    modal.id = 'bmExploreModalOverlay';
    modal.className = 'bm-explore-modal-overlay';
    modal.innerHTML = `
      <div class="bm-explore-modal-card">
        <!-- Close Button -->
        <button type="button" class="bm-explore-close-btn" onclick="window.bmExploreModal.close()" aria-label="Close dialog">&times;</button>

        <!-- Left: Auth Options & Inputs -->
        <div class="bm-explore-left">
          <span class="bm-explore-tag">BIDMART ACCESS</span>
          <h2 class="bm-explore-title" id="bmAuthTitle">Welcome to BidMart</h2>
          <p class="bm-explore-sub" id="bmAuthSub">Sign in or continue as guest to start shopping and bidding across verified drops.</p>

          <!-- Social Auth Options -->
          <div class="bm-social-grid">
            <button type="button" class="bm-social-btn" onclick="window.bmExploreModal.handleSocial('Google')">
              <!-- Google G Icon -->
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button type="button" class="bm-social-btn" onclick="window.bmExploreModal.handleSocial('Microsoft')">
              <!-- Microsoft 4-Color Grid Icon -->
              <svg viewBox="0 0 24 24">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#7fba00" d="M13 1h10v10H13z"/>
                <path fill="#00a4ef" d="M1 13h10v10H1z"/>
                <path fill="#ffb900" d="M13 13h10v10H13z"/>
              </svg>
              <span>Continue with Microsoft</span>
            </button>
          </div>

          <div class="bm-explore-divider">OR WITH EMAIL</div>

          <!-- Email & Password Form -->
          <form class="bm-email-form" onsubmit="window.bmExploreModal.handleEmailSubmit(event)">
            <div class="bm-input-wrap">
              <span class="bm-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              </span>
              <input type="email" id="bmAuthEmail" placeholder="name@example.com" required autocomplete="email" />
            </div>

            <div class="bm-input-wrap">
              <span class="bm-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </span>
              <input type="password" id="bmAuthPassword" placeholder="Enter your password" required autocomplete="current-password" />
            </div>

            <button type="submit" class="bm-btn-submit-mail" id="bmSubmitBtn">
              <span>Continue &rarr;</span>
            </button>
          </form>

          <!-- Continue as Guest Button (Enters Directly) -->
          <button type="button" class="bm-btn-guest-enter" onclick="window.bmExploreModal.continueAsGuest()">
            <span>Continue as Guest &rarr;</span>
          </button>
        </div>

        <!-- Right: Visual Graphic Illustration -->
        <div class="bm-explore-right">
          <img src="/assets/real/luxury_luggage_bg.jpg" alt="BidMart Exclusive Drops" class="bm-explore-right-img" id="bmExploreRightImg" />
          <div class="bm-explore-right-gradient"></div>
          <div class="bm-explore-right-content">
            <span class="bm-explore-right-tag">THE DUAL ENGINE</span>
            <h3 class="bm-explore-right-title">Shop or Outbid.</h3>
            <p class="bm-explore-right-desc">Direct access to 200+ verified retail items &amp; timed live auctions.</p>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay backdrop tap
    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.bmExploreModal.close();
    });
  }

  window.bmExploreModal = {
    open: function(customRightImage = null) {
      renderExploreModal();
      if (customRightImage) {
        const img = document.getElementById('bmExploreRightImg');
        if (img) img.src = customRightImage;
      }
      const overlay = document.getElementById('bmExploreModalOverlay');
      if (overlay) overlay.classList.add('active');
    },

    close: function() {
      const overlay = document.getElementById('bmExploreModalOverlay');
      if (overlay) overlay.classList.remove('active');
    },

    setImage: function(imageSrc) {
      const img = document.getElementById('bmExploreRightImg');
      if (img && imageSrc) img.src = imageSrc;
    },

    continueAsGuest: function() {
      // Store guest status and take user directly to market
      localStorage.setItem('bidmart_guest_user', 'true');
      this.close();
      window.location.href = '/market.html';
    },

    handleSocial: function(provider) {
      // Demo Social Login simulation
      const email = `guest_${provider.toLowerCase()}@bidmart.com`;
      const name = `${provider} User`;
      const demoToken = 'demo_' + Date.now();
      localStorage.setItem('bidmart_auth_token', demoToken);
      localStorage.setItem('bidmart_user', JSON.stringify({ email, name, role: 'BUYER' }));
      this.close();
      window.location.href = '/market.html';
    },

    handleEmailSubmit: async function(e) {
      e.preventDefault();
      const email = document.getElementById('bmAuthEmail').value;
      const password = document.getElementById('bmAuthPassword').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success && data.data) {
          localStorage.setItem('bidmart_auth_token', data.data.token);
          localStorage.setItem('bidmart_user', JSON.stringify(data.data.user));
          window.location.href = '/market.html';
        } else {
          // If account doesn't exist, try registering or fallback to direct login
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: email.split('@')[0], role: 'BUYER' })
          });
          const regData = await regRes.json();
          if (regData.success && regData.data) {
            localStorage.setItem('bidmart_auth_token', regData.data.token);
            localStorage.setItem('bidmart_user', JSON.stringify(regData.data.user));
            window.location.href = '/market.html';
          } else {
            // Direct entrance fallback
            window.location.href = '/market.html';
          }
        }
      } catch (err) {
        console.warn('Backend login fallback to direct entrance:', err);
        window.location.href = '/market.html';
      }
    }
  };

  document.addEventListener('DOMContentLoaded', renderExploreModal);
})();

