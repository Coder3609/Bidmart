/**
 * BidMart Premium Seller Authentication Modal Component
 * Exposes window.sellerAuth.open('login' | 'signup', options)
 *
 * Implements the seller authentication experience:
 * - NO buyer/seller role switcher
 * - Strict ROLE = SELLER backend enforcement
 * - Animated split-screen panel with glowing diagonal divider
 * - Floating 3D selling objects (package, storefront, sales chart, payout card, auction hammer, coins)
 * - Transitions directly to Multi-Step Onboarding upon account registration
 * - Status-based dashboard routing (APPROVED -> Dashboard, PENDING -> Onboarding, UNDER_REVIEW -> Status, SUSPENDED -> Suspended)
 */

(function () {
  const SELLER_REMEMBER_EMAIL_KEY = 'bidmart_seller_remember_email';
  let currentView = 'login'; // 'login' | 'signup'

  const ICONS = {
    user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>`,
    mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    phone: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    store: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l1 10a2 2 0 002 2h12a2 2 0 002-2l1-10M3 9l2.4-5.6A2 2 0 017.2 2h9.6a2 2 0 011.8 1.4L21 9M3 9h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    eye: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>`,
    eyeOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  };

  function ensureCSS() {
    if (!document.getElementById('seller-auth-css')) {
      const link = document.createElement('link');
      link.id = 'seller-auth-css';
      link.rel = 'stylesheet';
      link.href = '/shared/seller-auth-modal.css';
      document.head.appendChild(link);
    }
  }

  function buildModalDOM() {
    if (document.getElementById('sellerAuthModal')) return;
    ensureCSS();

    const modalHTML = `
      <div class="seller-auth-overlay" id="sellerAuthModal" role="dialog" aria-modal="true" aria-label="BidMart Seller Authentication">
        
        <!-- Floating 3D Selling Objects Layer -->
        <div class="seller-floating-layer" aria-hidden="true">
          
          <!-- 1. 3D Delivery Package -->
          <div class="seller-float-item seller-obj-package">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="#0FFCBE" stroke-width="2"/>
              <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="#106EBE" stroke-width="2"/>
            </svg>
          </div>

          <!-- 2. Storefront Icon -->
          <div class="seller-float-item seller-obj-store">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l1 10a2 2 0 002 2h12a2 2 0 002-2l1-10M3 9l2.4-5.6A2 2 0 017.2 2h9.6a2 2 0 011.8 1.4L21 9M3 9h18" stroke="#106EBE" stroke-width="2"/>
              <path d="M9 21V12h6v9" stroke="#0FFCBE" stroke-width="2"/>
            </svg>
          </div>

          <!-- 3. Sales Growth Chart -->
          <div class="seller-float-item seller-obj-chart">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M18 20V10M12 20V4M6 20v-6" stroke="#0FFCBE" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M3 10l6-6 4 4 8-8" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- 4. Payout / Escrow Wallet Card -->
          <div class="seller-float-item seller-obj-payout">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="#106EBE" stroke-width="2"/>
              <path d="M2 10h20M6 15h2" stroke="#0FFCBE" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- 5. Floating Coins -->
          <div class="seller-float-item seller-obj-coin seller-coin-1">
            <span>₹</span>
          </div>
          <div class="seller-float-item seller-obj-coin seller-coin-2">
            <span>₹</span>
          </div>

        </div>

        <div class="seller-auth-modal" id="sellerAuthCard">
          
          <button type="button" class="seller-close-btn" id="sellerAuthCloseBtn" aria-label="Close Seller Authentication">
            ${ICONS.close}
          </button>

          <div class="seller-auth-panels">
            
            <!-- Left Side: Interactive Auth Forms -->
            <div class="seller-form-side">
              
              <!-- Brand Identity -->
              <div class="seller-brand-badge">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="7" fill="#106EBE"/>
                  <path d="M7 19L12 9.5l2.8 5.8 2.4-4.5 3.8 8.2" stroke="#0FFCBE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="seller-brand-name">Bid<span class="seller-brand-mint">Mart</span></span>
                <span class="seller-portal-tag">SELLER PORTAL</span>
              </div>

              <!-- VIEW 1: SELLER LOGIN -->
              <div class="seller-view-pane active" id="sellerViewLogin">
                <h2 class="seller-auth-title">Welcome Back, Seller!</h2>
                <p class="seller-auth-subtitle">Sign in to manage your products, orders, auctions and sales.</p>

                <div class="seller-alert-banner" id="sellerLoginAlert" role="alert"></div>

                <form id="sellerLoginForm" novalidate>
                  <div class="seller-field-group" id="sellerLoginEmailGroup">
                    <label for="sellerLoginEmail">Email Address</label>
                    <div class="seller-input-wrap">
                      <span class="seller-input-icon">${ICONS.mail}</span>
                      <input type="email" id="sellerLoginEmail" name="email" class="seller-input" placeholder="seller@business.com" autocomplete="email" required />
                    </div>
                    <div class="seller-field-error" id="sellerLoginEmailError">Please enter a valid email address.</div>
                  </div>

                  <div class="seller-field-group" id="sellerLoginPasswordGroup">
                    <label for="sellerLoginPassword">Password</label>
                    <div class="seller-input-wrap">
                      <span class="seller-input-icon">${ICONS.lock}</span>
                      <input type="password" id="sellerLoginPassword" name="password" class="seller-input has-toggle" placeholder="••••••••" autocomplete="current-password" required />
                      <button type="button" class="seller-pwd-toggle" data-target="sellerLoginPassword" aria-label="Toggle password visibility">${ICONS.eye}</button>
                    </div>
                    <div class="seller-field-error" id="sellerLoginPasswordError">Please enter your password.</div>
                  </div>

                  <div class="seller-extra-row">
                    <label class="seller-remember-label">
                      <input type="checkbox" id="sellerRememberMe" />
                      <span>Remember email</span>
                    </label>
                    <a href="javascript:void(0)" class="seller-forgot-link" id="sellerForgotLink">Forgot password?</a>
                  </div>

                  <button type="submit" class="seller-submit-btn" id="sellerLoginSubmitBtn">
                    <span>LOGIN TO SELLER ACCOUNT</span>
                  </button>
                </form>

                <div class="seller-switch-text">
                  Don't have a seller account?
                  <button type="button" class="seller-switch-btn" id="sellerToSignupBtn">CREATE SELLER ACCOUNT</button>
                </div>
              </div>

              <!-- VIEW 2: SELLER SIGNUP -->
              <div class="seller-view-pane" id="sellerViewSignup">
                <h2 class="seller-auth-title">Become a BidMart Seller</h2>
                <p class="seller-auth-subtitle">Create your seller account and start growing your business.</p>

                <div class="seller-alert-banner" id="sellerSignupAlert" role="alert"></div>

                <form id="sellerSignupForm" novalidate>
                  <div class="seller-field-group" id="sellerSignupNameGroup">
                    <label for="sellerSignupName">Full Name *</label>
                    <div class="seller-input-wrap">
                      <span class="seller-input-icon">${ICONS.user}</span>
                      <input type="text" id="sellerSignupName" name="name" class="seller-input" placeholder="e.g. Rahul Sharma" autocomplete="name" required minlength="2" />
                    </div>
                    <div class="seller-field-error" id="sellerSignupNameError">Full name must be at least 2 characters.</div>
                  </div>

                  <div class="seller-field-group" id="sellerSignupEmailGroup">
                    <label for="sellerSignupEmail">Email Address *</label>
                    <div class="seller-input-wrap">
                      <span class="seller-input-icon">${ICONS.mail}</span>
                      <input type="email" id="sellerSignupEmail" name="email" class="seller-input" placeholder="rahul@business.com" autocomplete="email" required />
                    </div>
                    <div class="seller-field-error" id="sellerSignupEmailError">Please enter a valid email address.</div>
                  </div>

                  <div class="seller-field-group" id="sellerSignupPhoneGroup">
                    <label for="sellerSignupPhone">Mobile Number (for order alerts) *</label>
                    <div class="seller-input-wrap">
                      <span class="seller-input-icon">${ICONS.phone}</span>
                      <input type="tel" id="sellerSignupPhone" name="phone" class="seller-input" placeholder="9876543210" autocomplete="tel" required />
                    </div>
                    <div class="seller-field-error" id="sellerSignupPhoneError">Please enter a valid 10-digit mobile number.</div>
                  </div>

                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="seller-field-group" id="sellerSignupPassGroup">
                      <label for="sellerSignupPass">Password *</label>
                      <div class="seller-input-wrap">
                        <span class="seller-input-icon">${ICONS.lock}</span>
                        <input type="password" id="sellerSignupPass" name="password" class="seller-input has-toggle" placeholder="Min 8 chars" autocomplete="new-password" required minlength="8" />
                        <button type="button" class="seller-pwd-toggle" data-target="sellerSignupPass" aria-label="Toggle password visibility">${ICONS.eye}</button>
                      </div>
                      <div class="seller-field-error" id="sellerSignupPassError">Min 8 characters.</div>
                    </div>

                    <div class="seller-field-group" id="sellerSignupConfirmGroup">
                      <label for="sellerSignupConfirm">Confirm *</label>
                      <div class="seller-input-wrap">
                        <span class="seller-input-icon">${ICONS.lock}</span>
                        <input type="password" id="sellerSignupConfirm" name="confirmPassword" class="seller-input has-toggle" placeholder="Repeat" autocomplete="new-password" required />
                        <button type="button" class="seller-pwd-toggle" data-target="sellerSignupConfirm" aria-label="Toggle password visibility">${ICONS.eye}</button>
                      </div>
                      <div class="seller-field-error" id="sellerSignupConfirmError">Passwords do not match.</div>
                    </div>
                  </div>

                  <button type="submit" class="seller-submit-btn" id="sellerSignupSubmitBtn" style="margin-top:8px;">
                    <span>CONTINUE TO ONBOARDING →</span>
                  </button>
                </form>

                <div class="seller-switch-text">
                  Already have a seller account?
                  <button type="button" class="seller-switch-btn" id="sellerToLoginBtn">LOG IN</button>
                </div>
              </div>

            </div>

            <!-- Right Side: Glowing Showcase Panel -->
            <div class="seller-hero-side">
              <div class="seller-hero-content">
                <div class="seller-hero-badge">Verified Merchant Hub</div>
                <h3 class="seller-hero-title">Sell Across Shop &amp; Live Auctions</h3>
                <p class="seller-hero-desc">
                  Join hundreds of verified merchants scaling their business with BidMart's dual marketplace &amp; instant auction liquidation.
                </p>

                <div class="seller-feature-list">
                  <div class="seller-feature-item">
                    <div class="seller-feature-icon">✓</div>
                    <span>Fixed Price Shop + Live Dynamic Auctions</span>
                  </div>
                  <div class="seller-feature-item">
                    <div class="seller-feature-icon">✓</div>
                    <span>Automated Escrow &amp; Bank Payout Protection</span>
                  </div>
                  <div class="seller-feature-item">
                    <div class="seller-feature-icon">✓</div>
                    <span>Fast Onboarding &amp; Dedicated Compliance</span>
                  </div>
                  <div class="seller-feature-item">
                    <div class="seller-feature-icon">✓</div>
                    <span>Real-time Inventory &amp; Order Analytics</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);

    attachEvents();
  }

  function switchView(view) {
    currentView = view;
    const loginPane = document.getElementById('sellerViewLogin');
    const signupPane = document.getElementById('sellerViewSignup');
    const loginAlert = document.getElementById('sellerLoginAlert');
    const signupAlert = document.getElementById('sellerSignupAlert');

    if (loginAlert) loginAlert.className = 'seller-alert-banner';
    if (signupAlert) signupAlert.className = 'seller-alert-banner';

    if (view === 'signup') {
      loginPane.classList.remove('active');
      signupPane.classList.add('active');
      const nameInput = document.getElementById('sellerSignupName');
      if (nameInput) setTimeout(() => nameInput.focus(), 150);
    } else {
      signupPane.classList.remove('active');
      loginPane.classList.add('active');
      const emailInput = document.getElementById('sellerLoginEmail');
      if (emailInput) setTimeout(() => emailInput.focus(), 150);
    }
  }

  function showAlert(formType, message, type = 'error') {
    const alertId = formType === 'login' ? 'sellerLoginAlert' : 'sellerSignupAlert';
    const box = document.getElementById(alertId);
    if (!box) return;
    box.textContent = message;
    box.className = `seller-alert-banner ${type}`;
  }

  function hideAlerts() {
    const l = document.getElementById('sellerLoginAlert');
    const s = document.getElementById('sellerSignupAlert');
    if (l) l.className = 'seller-alert-banner';
    if (s) s.className = 'seller-alert-banner';
  }

  function routeSellerAfterLogin(sellerProfile) {
    const status = sellerProfile ? sellerProfile.sellerStatus : 'PENDING';
    const onboardingStep = sellerProfile ? Number(sellerProfile.onboardingStep) : 1;

    if (status === 'APPROVED') {
      window.location.href = '/dashboards/seller/dashboard.html';
    } else if (status === 'UNDER_REVIEW') {
      window.location.href = '/seller/status.html';
    } else if (status === 'SUSPENDED') {
      window.location.href = '/seller/suspended.html';
    } else if (status === 'REQUIRES_UPDATE' || status === 'PENDING' || onboardingStep < 6) {
      window.location.href = `/seller/onboarding.html?step=${Math.max(2, onboardingStep)}`;
    } else {
      window.location.href = '/seller/status.html';
    }
  }

  function attachEvents() {
    const overlay = document.getElementById('sellerAuthModal');
    const closeBtn = document.getElementById('sellerAuthCloseBtn');
    const toSignupBtn = document.getElementById('sellerToSignupBtn');
    const toLoginBtn = document.getElementById('sellerToLoginBtn');
    const loginForm = document.getElementById('sellerLoginForm');
    const signupForm = document.getElementById('sellerSignupForm');

    // Close on overlay background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
        close();
      }
    });

    // Switch view triggers
    if (toSignupBtn) {
      toSignupBtn.addEventListener('click', () => switchView('signup'));
    }
    if (toLoginBtn) {
      toLoginBtn.addEventListener('click', () => switchView('login'));
    }

    // Password show/hide toggles
    overlay.querySelectorAll('.seller-pwd-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = ICONS.eyeOff;
        } else {
          input.type = 'password';
          btn.innerHTML = ICONS.eye;
        }
      });
    });

    // Remember me populate
    const remembered = localStorage.getItem(SELLER_REMEMBER_EMAIL_KEY);
    if (remembered) {
      const emailInput = document.getElementById('sellerLoginEmail');
      const remCheck = document.getElementById('sellerRememberMe');
      if (emailInput) emailInput.value = remembered;
      if (remCheck) remCheck.checked = true;
    }

    // Forgot password info
    const forgotLink = document.getElementById('sellerForgotLink');
    if (forgotLink) {
      forgotLink.addEventListener('click', () => {
        showAlert('login', 'Please contact support@bidmart.com or your account manager for seller password recovery.', 'success');
      });
    }

    // -------------------------------------------------------------
    // Seller Login Submit Handler
    // -------------------------------------------------------------
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlerts();

      const emailInput = document.getElementById('sellerLoginEmail');
      const passInput = document.getElementById('sellerLoginPassword');
      const remCheck = document.getElementById('sellerRememberMe');
      const submitBtn = document.getElementById('sellerLoginSubmitBtn');

      const email = emailInput.value.trim();
      const password = passInput.value;

      let hasErr = false;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('sellerLoginEmailGroup').classList.add('has-error');
        hasErr = true;
      } else {
        document.getElementById('sellerLoginEmailGroup').classList.remove('has-error');
      }

      if (!password) {
        document.getElementById('sellerLoginPasswordGroup').classList.add('has-error');
        hasErr = true;
      } else {
        document.getElementById('sellerLoginPasswordGroup').classList.remove('has-error');
      }

      if (hasErr) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying credentials…</span>';

      try {
        const resp = await window.api.post('/auth/seller/login', { email, password });
        
        // Save session
        if (window.auth && window.auth.setSession) {
          window.auth.setSession(resp.token, resp.user);
        }

        if (remCheck && remCheck.checked) {
          localStorage.setItem(SELLER_REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(SELLER_REMEMBER_EMAIL_KEY);
        }

        showAlert('login', 'Logged in successfully! Redirecting…', 'success');
        setTimeout(() => {
          routeSellerAfterLogin(resp.seller || (resp.user && resp.user.seller_profile));
        }, 600);

      } catch (err) {
        showAlert('login', err.message || 'Unable to connect to BidMart.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>LOGIN TO SELLER ACCOUNT</span>';
      }
    });

    // -------------------------------------------------------------
    // Seller Signup Submit Handler
    // -------------------------------------------------------------
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlerts();

      const nameInput = document.getElementById('sellerSignupName');
      const emailInput = document.getElementById('sellerSignupEmail');
      const phoneInput = document.getElementById('sellerSignupPhone');
      const passInput = document.getElementById('sellerSignupPass');
      const confirmInput = document.getElementById('sellerSignupConfirm');
      const submitBtn = document.getElementById('sellerSignupSubmitBtn');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      const password = passInput.value;
      const confirmPassword = confirmInput.value;

      let hasErr = false;

      if (!name || name.length < 2) {
        document.getElementById('sellerSignupNameGroup').classList.add('has-error');
        hasErr = true;
      } else {
        document.getElementById('sellerSignupNameGroup').classList.remove('has-error');
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('sellerSignupEmailGroup').classList.add('has-error');
        hasErr = true;
      } else {
        document.getElementById('sellerSignupEmailGroup').classList.remove('has-error');
      }

      if (!phone || phone.replace(/\D/g, '').length < 10) {
        document.getElementById('sellerSignupPhoneGroup').classList.add('has-error');
        hasErr = true;
      } else {
        document.getElementById('sellerSignupPhoneGroup').classList.remove('has-error');
      }

      if (!password || password.length < 8) {
        document.getElementById('sellerSignupPassGroup').classList.add('has-error');
        hasErr = true;
      } else {
        document.getElementById('sellerSignupPassGroup').classList.remove('has-error');
      }

      if (password !== confirmPassword) {
        document.getElementById('sellerSignupConfirmGroup').classList.add('has-error');
        hasErr = true;
      } else {
        document.getElementById('sellerSignupConfirmGroup').classList.remove('has-error');
      }

      if (hasErr) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating seller account…</span>';

      try {
        const resp = await window.api.post('/auth/seller/register', {
          name,
          email,
          password,
          phone,
          storeName: `${name}'s Store`,
        });

        // Save session
        if (window.auth && window.auth.setSession) {
          window.auth.setSession(resp.token, resp.user);
        }

        showAlert('signup', 'Account created! Launching seller onboarding…', 'success');
        setTimeout(() => {
          window.location.href = '/seller/onboarding.html?step=2';
        }, 700);

      } catch (err) {
        showAlert('signup', err.message || 'Unable to create seller account.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>CONTINUE TO ONBOARDING →</span>';
      }
    });
  }

  function open(view = 'login', options = {}) {
    buildModalDOM();
    const overlay = document.getElementById('sellerAuthModal');
    if (!overlay) return;

    switchView(view);
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    if (options.message) {
      showAlert(view, options.message, options.type || 'success');
    }
  }

  function close() {
    const overlay = document.getElementById('sellerAuthModal');
    if (!overlay) return;
    overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  // Global window export
  window.sellerAuth = {
    open,
    close,
  };

  // Auto-init DOM on load
  document.addEventListener('DOMContentLoaded', () => {
    buildModalDOM();
  });
})();
