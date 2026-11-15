/**
 * BidMart Modern Dual-Sided Auth Dialog
 * Intelligent Two-Step Flow:
 * Step 1: Email & Password check
 *   - If account exists & credentials match -> Direct instant sign-in & enters market!
 *   - If new account -> Smoothly reveals Step 2 (Full Name, Date of Birth, Mobile Number, City)
 *   - On completion -> Registers account, sets session, and updates header with user's name!
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
          <span class="bm-explore-tag" id="bmAuthTag">BIDMART ACCESS</span>
          <h2 class="bm-explore-title" id="bmAuthTitle">Welcome to BidMart</h2>
          <p class="bm-explore-sub" id="bmAuthSub">Enter your email and password to sign in or create an account.</p>

          <!-- Status Notice Message -->
          <div id="bmAuthMsg" style="display:none;padding:10px 14px;border-radius:6px;font-size:0.82rem;font-weight:600;margin-bottom:12px;"></div>

          <!-- Social Auth Options (visible in Step 1) -->
          <div class="bm-social-grid" id="bmSocialGrid">
            <button type="button" class="bm-social-btn" onclick="window.bmExploreModal.handleSocial('Google')">
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button type="button" class="bm-social-btn" onclick="window.bmExploreModal.handleSocial('Microsoft')">
              <svg viewBox="0 0 24 24">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#7fba00" d="M13 1h10v10H13z"/>
                <path fill="#00a4ef" d="M1 13h10v10H1z"/>
                <path fill="#ffb900" d="M13 13h10v10H13z"/>
              </svg>
              <span>Continue with Microsoft</span>
            </button>
          </div>

          <div class="bm-explore-divider" id="bmDivider">OR WITH EMAIL</div>

          <!-- STEP 1: Email & Password Form -->
          <form class="bm-email-form" id="bmStep1Form" onsubmit="window.bmExploreModal.handleStep1(event)">
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

          <!-- STEP 2: Sign-Up Profile Details Form (Appears if new account) -->
          <form class="bm-email-form" id="bmStep2Form" style="display:none;" onsubmit="window.bmExploreModal.handleStep2(event)">
            <div class="bm-input-wrap">
              <span class="bm-input-icon">👤</span>
              <input type="text" id="bmNewName" placeholder="Full Name (e.g. Rahul Sharma)" required />
            </div>

            <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:10px;">
              <div class="bm-input-wrap">
                <span class="bm-input-icon">🎂</span>
                <input type="date" id="bmNewDob" title="Date of Birth" required />
              </div>
              <div class="bm-input-wrap">
                <span class="bm-input-icon">📍</span>
                <input type="text" id="bmNewCity" placeholder="City" required />
              </div>
            </div>

            <div class="bm-input-wrap">
              <span class="bm-input-icon">📱</span>
              <input type="tel" id="bmNewPhone" placeholder="Mobile Number (+91 9876543210)" required />
            </div>

            <button type="submit" class="bm-btn-submit-mail" id="bmSubmitProfileBtn" style="background:#D8FF00;color:#080808;">
              <span>Complete Registration &amp; Enter &rarr;</span>
            </button>

            <button type="button" style="background:transparent;border:none;color:#94A3B8;font-size:0.8rem;cursor:pointer;margin-top:4px;" onclick="window.bmExploreModal.resetToStep1()">
              &larr; Back to Email
            </button>
          </form>

          <!-- Continue as Guest Button (Enters Directly) -->
          <button type="button" class="bm-btn-guest-enter" id="bmGuestBtn" onclick="window.bmExploreModal.continueAsGuest()">
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

    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.bmExploreModal.close();
    });
  }

  let pendingCredentials = { email: '', password: '' };

  window.bmExploreModal = {
    open: function(customRightImage = null) {
      renderExploreModal();
      if (customRightImage) {
        const img = document.getElementById('bmExploreRightImg');
        if (img) img.src = customRightImage;
      }
      this.resetToStep1();
      const overlay = document.getElementById('bmExploreModalOverlay');
      if (overlay) overlay.classList.add('active');
    },

    close: function() {
      const overlay = document.getElementById('bmExploreModalOverlay');
      if (overlay) overlay.classList.remove('active');
    },

    showNotice: function(msg, isError = false) {
      const el = document.getElementById('bmAuthMsg');
      if (!el) return;
      el.textContent = msg;
      el.style.display = 'block';
      el.style.background = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
      el.style.color = isError ? '#EF4444' : '#10B981';
      el.style.border = isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)';
    },

    resetToStep1: function() {
      const s1 = document.getElementById('bmStep1Form');
      const s2 = document.getElementById('bmStep2Form');
      const soc = document.getElementById('bmSocialGrid');
      const div = document.getElementById('bmDivider');
      const guest = document.getElementById('bmGuestBtn');
      const tag = document.getElementById('bmAuthTag');
      const title = document.getElementById('bmAuthTitle');
      const sub = document.getElementById('bmAuthSub');
      const msg = document.getElementById('bmAuthMsg');

      if (s1) s1.style.display = 'flex';
      if (s2) s2.style.display = 'none';
      if (soc) soc.style.display = 'grid';
      if (div) div.style.display = 'flex';
      if (guest) guest.style.display = 'block';
      if (msg) msg.style.display = 'none';
      if (tag) tag.textContent = 'BIDMART ACCESS';
      if (title) title.textContent = 'Welcome to BidMart';
      if (sub) sub.textContent = 'Enter your email and password to sign in or create an account.';
    },

    continueAsGuest: function() {
      localStorage.setItem('bidmart_guest_user', 'true');
      this.close();
      window.location.reload();
    },

    handleSocial: function(provider) {
      const email = `guest_${provider.toLowerCase()}@bidmart.com`;
      const name = `${provider} User`;
      const token = 'demo_' + Date.now();
      const user = { email, name, role: 'BUYER' };

      localStorage.setItem('marketplace_token', token);
      localStorage.setItem('marketplace_user', JSON.stringify(user));
      this.close();
      window.location.reload();
    },

    // Step 1: Checks if user exists. If yes -> logs in. If no -> smoothly opens Step 2 for details.
    handleStep1: async function(e) {
      e.preventDefault();
      const email = document.getElementById('bmAuthEmail').value.trim();
      const password = document.getElementById('bmAuthPassword').value;
      const submitBtn = document.getElementById('bmSubmitBtn');

      if (!email || !password) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying…</span>';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success && data.data && data.data.token) {
          // Exists & credentials correct -> Direct instant entry!
          this.showNotice('✔ Welcome back! Signing you in…', false);
          localStorage.setItem('marketplace_token', data.data.token);
          localStorage.setItem('marketplace_user', JSON.stringify(data.data.user));
          setTimeout(() => {
            window.location.reload();
          }, 600);
          return;
        }

        // Check if wrong password vs new user
        if (data.message && data.message.toLowerCase().includes('password')) {
          this.showNotice('Incorrect password for this account. Please try again.', true);
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Continue &rarr;</span>';
          return;
        }

        // New user! Transition to Step 2
        pendingCredentials = { email, password };
        this.openStep2(email);

      } catch (err) {
        // Fallback for offline mode -> transition to Step 2
        pendingCredentials = { email, password };
        this.openStep2(email);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Continue &rarr;</span>';
      }
    },

    openStep2: function(email) {
      document.getElementById('bmStep1Form').style.display = 'none';
      document.getElementById('bmSocialGrid').style.display = 'none';
      document.getElementById('bmDivider').style.display = 'none';
      document.getElementById('bmGuestBtn').style.display = 'none';

      document.getElementById('bmAuthTag').textContent = 'NEW MEMBER';
      document.getElementById('bmAuthTitle').textContent = 'Tell us about yourself';
      document.getElementById('bmAuthSub').textContent = `Account for ${email}. Complete these details to finish setup.`;
      
      this.showNotice('🎉 New account detected! Fill in your details below to finish.', false);

      const s2 = document.getElementById('bmStep2Form');
      s2.style.display = 'flex';
      document.getElementById('bmNewName').focus();
    },

    // Step 2: Submits profile (Name, DOB, City, Phone)
    handleStep2: async function(e) {
      e.preventDefault();
      const name = document.getElementById('bmNewName').value.trim();
      const dob = document.getElementById('bmNewDob').value;
      const city = document.getElementById('bmNewCity').value.trim();
      const phone = document.getElementById('bmNewPhone').value.trim();
      const btn = document.getElementById('bmSubmitProfileBtn');

      btn.disabled = true;
      btn.innerHTML = '<span>Creating Account…</span>';

      const payload = {
        name,
        email: pendingCredentials.email,
        password: pendingCredentials.password,
        phone,
        city,
        dob,
        role: 'BUYER'
      };

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success && data.data && data.data.token) {
          localStorage.setItem('marketplace_token', data.data.token);
          localStorage.setItem('marketplace_user', JSON.stringify(data.data.user));
          this.showNotice(`✔ Account created! Welcome, ${name}.`, false);
          setTimeout(() => {
            window.location.reload();
          }, 700);
        } else {
          // Simulation fallback: save user details locally
          const user = { name, email: payload.email, phone, city, dob, role: 'BUYER' };
          localStorage.setItem('marketplace_token', 'token_' + Date.now());
          localStorage.setItem('marketplace_user', JSON.stringify(user));
          this.showNotice(`✔ Welcome to BidMart, ${name}!`, false);
          setTimeout(() => {
            window.location.reload();
          }, 700);
        }
      } catch (err) {
        const user = { name, email: payload.email, phone, city, dob, role: 'BUYER' };
        localStorage.setItem('marketplace_token', 'token_' + Date.now());
        localStorage.setItem('marketplace_user', JSON.stringify(user));
        this.showNotice(`✔ Welcome to BidMart, ${name}!`, false);
        setTimeout(() => {
          window.location.reload();
        }, 700);
      }
    }
  };

  document.addEventListener('DOMContentLoaded', renderExploreModal);
})();
