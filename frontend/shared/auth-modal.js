/**
 * BidMart Premium Buyer & Bidder Authentication Modal System
 * Provides animated Login <-> Sign Up with moving 3D auction objects (hammer, coins, paddle, shield),
 * diagonal glowing divider, post-signup KYC step prompt, and seamless action resumption.
 */

(function () {
  const REMEMBER_EMAIL_KEY = 'bidmart_remember_email';
  let currentView = 'login'; // 'login' | 'signup' | 'forgot' | 'kyc-prompt'
  let pendingSuccessCallback = null;
  let activeContext = 'auction'; // 'auction' | 'shop'

  // Icons SVG
  const ICONS = {
    user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>`,
    mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2"/><path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    phone: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    eye: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>`,
    eyeOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    gavel: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 4l6 6M4 14l6 6M2 22l6-6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 16l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  };

  /** Toast Notification Service */
  function showToast(message, type = 'success') {
    let host = document.getElementById('bidmart-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'bidmart-toast-host';
      host.className = 'bidmart-toast-host';
      document.body.appendChild(host);
    }

    const toast = document.createElement('div');
    toast.className = `bidmart-toast-item ${type}`;
    toast.innerHTML = `
      <div class="bidmart-toast-icon">${type === 'success' ? ICONS.check : (type === 'error' ? '!' : 'ℹ')}</div>
      <div class="bidmart-toast-text">${message}</div>
    `;

    host.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('is-hiding');
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  /** Build Modal HTML Structure */
  function buildModalDOM() {
    if (document.getElementById('buyerAuthModal')) return;

    // Ensure CSS is loaded
    if (!document.getElementById('buyer-auth-css')) {
      const link = document.createElement('link');
      link.id = 'buyer-auth-css';
      link.rel = 'stylesheet';
      link.href = '/shared/auth-modal.css';
      document.head.appendChild(link);
    }

    const modalHTML = `
      <div class="buyer-auth-overlay" id="buyerAuthModal" role="dialog" aria-modal="true" aria-label="BidMart Bidder Authentication">
        
        <!-- Floating 3D Ambient Background Objects -->
        <div class="auc-floating-objects-layer" aria-hidden="true">
          <!-- 1. Floating Auction Hammer / Gavel -->
          <div class="auc-float-item auc-obj-hammer" id="aucFloatHammer">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M14 4l6 6M4 14l6 6M2 22l6-6M9 9l6 6" stroke="#0FFCBE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 16l4 4" stroke="#0FFCBE" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- 2. Floating Gold Coins -->
          <div class="auc-float-item auc-obj-coin auc-coin-1">
            <span>₹</span>
          </div>
          <div class="auc-float-item auc-obj-coin auc-coin-2">
            <span>₹</span>
          </div>

          <!-- 3. Floating Bid Paddle Card -->
          <div class="auc-float-item auc-obj-paddle">
            <div class="auc-paddle-head">
              <span class="auc-paddle-num">#88</span>
            </div>
            <div class="auc-paddle-handle"></div>
          </div>

          <!-- 4. Security Shield Icon with Pulse -->
          <div class="auc-float-item auc-obj-shield">
            ${ICONS.shield}
          </div>

          <!-- 5. Product Box -->
          <div class="auc-float-item auc-obj-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="#106EBE" stroke-width="2"/>
              <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="#0FFCBE" stroke-width="2"/>
            </svg>
          </div>
        </div>

        <div class="buyer-auth-modal" id="buyerAuthCard">
          
          <!-- Close Button -->
          <button type="button" class="auth-close-btn" id="buyerAuthCloseBtn" aria-label="Close authentication modal">
            ${ICONS.close}
          </button>

          <div class="auth-panels-wrapper">
            
            <!-- Forms Sliding Container -->
            <div class="auth-forms-container">
              
              <!-- 1. LOGIN FORM VIEW -->
              <div class="auth-form-view active-view" id="authViewLogin">
                <div class="auth-brand-badge">
                  <span class="brand-logo-icon">
                    <svg width="20" height="20" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="7" fill="#106EBE"/><path d="M7 19L12 9.5l2.8 5.8 2.4-4.5 3.8 8.2" stroke="#0FFCBE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span class="brand-logo-text">Bid<span class="brand-logo-mint">Mart</span> <small style="font-size:0.75rem;color:#94A3B8;font-weight:600;margin-left:4px;">Auction Center</small></span>
                </div>

                <h2 class="auth-title" id="authLoginTitle">Welcome Back, Bidder</h2>
                <p class="auth-subtitle" id="authLoginSubtitle">Login to continue bidding on verified auctions.</p>

                <div class="auth-alert-banner" id="loginAlertBox" role="alert"></div>

                <form id="buyerLoginForm" novalidate>
                  <div class="auth-field-group" id="loginEmailGroup">
                    <label for="buyerLoginEmail">Email Address</label>
                    <div class="auth-input-wrap">
                      <span class="auth-input-icon">${ICONS.mail}</span>
                      <input type="email" id="buyerLoginEmail" name="email" class="auth-input" placeholder="bidder@example.com" autocomplete="email" required />
                    </div>
                    <div class="field-error-msg" id="loginEmailError">Please enter a valid email address.</div>
                  </div>

                  <div class="auth-field-group" id="loginPasswordGroup">
                    <label for="buyerLoginPassword">Password</label>
                    <div class="auth-input-wrap">
                      <span class="auth-input-icon">${ICONS.lock}</span>
                      <input type="password" id="buyerLoginPassword" name="password" class="auth-input has-toggle" placeholder="••••••••" autocomplete="current-password" required />
                      <button type="button" class="auth-pwd-toggle" data-target="buyerLoginPassword" aria-label="Toggle password visibility">${ICONS.eye}</button>
                    </div>
                    <div class="field-error-msg" id="loginPasswordError">Password is required.</div>
                  </div>

                  <div class="auth-options-row">
                    <label class="auth-checkbox-label">
                      <input type="checkbox" id="buyerRememberMe" checked />
                      <span>Remember Me</span>
                    </label>
                    <button type="button" class="auth-link-forgot" id="btnGoForgot">Forgot Password?</button>
                  </div>

                  <button type="submit" class="btn-auth-submit" id="btnLoginSubmit">
                    <span>LOGIN & CONTINUE</span>
                  </button>

                  <div class="auth-switch-prompt">
                    Don't have a bidder account?
                    <button type="button" class="auth-switch-link" id="btnSwitchToSignup">CREATE BIDDER ACCOUNT</button>
                  </div>
                </form>
              </div>

              <!-- 2. SIGN UP FORM VIEW -->
              <div class="auth-form-view" id="authViewSignup">
                <div class="auth-brand-badge">
                  <span class="brand-logo-icon">
                    <svg width="20" height="20" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="7" fill="#106EBE"/><path d="M7 19L12 9.5l2.8 5.8 2.4-4.5 3.8 8.2" stroke="#0FFCBE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span class="brand-logo-text">Bid<span class="brand-logo-mint">Mart</span> <small style="font-size:0.75rem;color:#94A3B8;font-weight:600;margin-left:4px;">Bidder Registration</small></span>
                </div>

                <h2 class="auth-title" id="authSignupTitle">Become a BidMart Bidder</h2>
                <p class="auth-subtitle" id="authSignupSubtitle">Create your bidder account to participate in verified online auctions.</p>

                <div class="auth-alert-banner" id="signupAlertBox" role="alert"></div>

                <form id="buyerSignupForm" novalidate>
                  <div class="auth-field-group" id="signupNameGroup">
                    <label for="buyerSignupName">Full Name</label>
                    <div class="auth-input-wrap">
                      <span class="auth-input-icon">${ICONS.user}</span>
                      <input type="text" id="buyerSignupName" name="name" class="auth-input" placeholder="Amit Sharma" autocomplete="name" required />
                    </div>
                    <div class="field-error-msg" id="signupNameError">Full name must be at least 2 characters.</div>
                  </div>

                  <div class="auth-field-row">
                    <div class="auth-field-group" id="signupEmailGroup">
                      <label for="buyerSignupEmail">Email Address</label>
                      <div class="auth-input-wrap">
                        <span class="auth-input-icon">${ICONS.mail}</span>
                        <input type="email" id="buyerSignupEmail" name="email" class="auth-input" placeholder="amit@example.com" autocomplete="email" required />
                      </div>
                      <div class="field-error-msg" id="signupEmailError">Valid email required.</div>
                    </div>

                    <div class="auth-field-group" id="signupPhoneGroup">
                      <label for="buyerSignupPhone">Mobile Number</label>
                      <div class="auth-input-wrap">
                        <span class="auth-input-icon">${ICONS.phone}</span>
                        <input type="tel" id="buyerSignupPhone" name="phone" class="auth-input" placeholder="9800000000" autocomplete="tel" required />
                      </div>
                      <div class="field-error-msg" id="signupPhoneError">Mobile number is required.</div>
                    </div>
                  </div>

                  <div class="auth-field-row">
                    <div class="auth-field-group" id="signupPasswordGroup">
                      <label for="buyerSignupPassword">Password</label>
                      <div class="auth-input-wrap">
                        <span class="auth-input-icon">${ICONS.lock}</span>
                        <input type="password" id="buyerSignupPassword" name="password" class="auth-input has-toggle" placeholder="Min 8 chars" autocomplete="new-password" required />
                        <button type="button" class="auth-pwd-toggle" data-target="buyerSignupPassword" aria-label="Toggle password visibility">${ICONS.eye}</button>
                      </div>
                      <div class="field-error-msg" id="signupPasswordError">At least 8 characters.</div>
                    </div>

                    <div class="auth-field-group" id="signupConfirmPasswordGroup">
                      <label for="buyerSignupConfirmPassword">Confirm Password</label>
                      <div class="auth-input-wrap">
                        <span class="auth-input-icon">${ICONS.lock}</span>
                        <input type="password" id="buyerSignupConfirmPassword" name="confirmPassword" class="auth-input has-toggle" placeholder="Confirm" autocomplete="new-password" required />
                        <button type="button" class="auth-pwd-toggle" data-target="buyerSignupConfirmPassword" aria-label="Toggle confirm password visibility">${ICONS.eye}</button>
                      </div>
                      <div class="field-error-msg" id="signupConfirmPasswordError">Passwords must match.</div>
                    </div>
                  </div>

                  <button type="submit" class="btn-auth-submit" id="btnSignupSubmit" style="margin-top:6px;">
                    <span>CREATE BIDDER ACCOUNT</span>
                  </button>

                  <div class="auth-switch-prompt">
                    Already have an account?
                    <button type="button" class="auth-switch-link" id="btnSwitchToLogin">LOGIN</button>
                  </div>
                </form>
              </div>

              <!-- 3. FORGOT PASSWORD VIEW -->
              <div class="auth-form-view" id="authViewForgot">
                <div class="auth-brand-badge">
                  <span class="brand-logo-icon">
                    <svg width="20" height="20" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="7" fill="#106EBE"/><path d="M7 19L12 9.5l2.8 5.8 2.4-4.5 3.8 8.2" stroke="#0FFCBE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>
                  <span class="brand-logo-text">Bid<span class="brand-logo-mint">Mart</span></span>
                </div>

                <h2 class="auth-title">Reset Password</h2>
                <p class="auth-subtitle">Enter your registered email and we will send password reset instructions.</p>

                <div class="auth-alert-banner" id="forgotAlertBox" role="alert"></div>

                <form id="buyerForgotForm" novalidate>
                  <div class="auth-field-group" id="forgotEmailGroup">
                    <label for="buyerForgotEmail">Email Address</label>
                    <div class="auth-input-wrap">
                      <span class="auth-input-icon">${ICONS.mail}</span>
                      <input type="email" id="buyerForgotEmail" name="email" class="auth-input" placeholder="name@example.com" required />
                    </div>
                    <div class="field-error-msg" id="forgotEmailError">Please enter a valid email address.</div>
                  </div>

                  <button type="submit" class="btn-auth-submit" id="btnForgotSubmit" style="margin-top:12px;">
                    <span>SEND RESET LINK</span>
                  </button>

                  <div class="auth-switch-prompt">
                    Remember your password?
                    <button type="button" class="auth-switch-link" id="btnForgotBackToLogin">Back to Login</button>
                  </div>
                </form>
              </div>

              <!-- 4. POST-SIGNUP KYC ONBOARDING STEP VIEW -->
              <div class="auth-form-view" id="authViewKycPrompt">
                <div class="auth-brand-badge">
                  <span class="brand-logo-icon" style="background:#059669;">
                    ${ICONS.shield}
                  </span>
                  <span class="brand-logo-text">BidMart <span class="brand-logo-mint">KYC Step</span></span>
                </div>

                <h2 class="auth-title" style="color:#0FFCBE;">COMPLETE YOUR KYC</h2>
                <p class="auth-subtitle">Your bidder account has been created. To participate in auctions, complete your identity verification.</p>

                <div class="auth-kyc-progress-box">
                  <div class="kyc-step-item done">
                    <span class="step-icon">✓</span>
                    <span class="step-label">Account Created</span>
                  </div>
                  <div class="kyc-step-item done">
                    <span class="step-icon">✓</span>
                    <span class="step-label">Profile Information</span>
                  </div>
                  <div class="kyc-step-item active">
                    <span class="step-icon">→</span>
                    <span class="step-label">KYC Verification</span>
                  </div>
                  <div class="kyc-step-item locked">
                    <span class="step-icon">🔒</span>
                    <span class="step-label">Auction Eligibility</span>
                  </div>
                </div>

                <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px;">
                  <button type="button" class="btn-auth-submit" id="btnStartKycNow" style="background:linear-gradient(135deg, #10B981 0%, #0FFCBE 100%);color:#061B33;">
                    <span>START KYC VERIFICATION</span>
                  </button>
                  
                  <button type="button" class="btn-auth-ghost" id="btnKycLater" style="color:#94A3B8;border-color:rgba(255,255,255,0.2);">
                    <span>Complete Later</span>
                  </button>
                </div>
              </div>

            </div>

            <!-- Glowing Diagonal Divider & Hero Sliding Panel -->
            <div class="auth-overlay-slider">
              <div class="auth-slider-content">
                
                <!-- Left Hero Panel (Shown in Sign Up mode) -->
                <div class="auth-slider-panel">
                  <div class="auth-panel-hammer-icon">
                    ${ICONS.gavel}
                  </div>
                  <h3 class="auth-slider-title">Welcome Back, Bidder!</h3>
                  <p class="auth-slider-text">Already registered? Log in to monitor your active bids, fund your wallet, and win live auctions.</p>
                  
                  <ul class="auth-perks-list">
                    <li class="auth-perk-item">
                      <span class="auth-perk-icon">🔨</span>
                      <span>Real-time live auction bidding</span>
                    </li>
                    <li class="auth-perk-item">
                      <span class="auth-perk-icon">💰</span>
                      <span>Escrow-protected wallet transactions</span>
                    </li>
                    <li class="auth-perk-item">
                      <span class="auth-perk-icon">🛡️</span>
                      <span>Verified bidder status & instant notifications</span>
                    </li>
                  </ul>

                  <button type="button" class="btn-auth-ghost" id="btnHeroSignIn">
                    <span>SIGN IN</span>
                  </button>
                </div>

                <!-- Right Hero Panel (Shown in Login mode) -->
                <div class="auth-slider-panel">
                  <div class="auth-panel-hammer-icon">
                    ${ICONS.gavel}
                  </div>
                  <h3 class="auth-slider-title">New to BidMart Auctions?</h3>
                  <p class="auth-slider-text">Join verified online auctions. Place live bids, track lot timers, and win items with complete escrow safety.</p>
                  
                  <ul class="auth-perks-list">
                    <li class="auth-perk-item">
                      <span class="auth-perk-icon">⚡</span>
                      <span>Instant bid updates with automated holds</span>
                    </li>
                    <li class="auth-perk-item">
                      <span class="auth-perk-icon">🔐</span>
                      <span>Secure KYC identity verification</span>
                    </li>
                    <li class="auth-perk-item">
                      <span class="auth-perk-icon">🏆</span>
                      <span>Exclusive electronics, jewelry & rare items</span>
                    </li>
                  </ul>

                  <button type="button" class="btn-auth-ghost" id="btnHeroSignUp">
                    <span>CREATE BIDDER ACCOUNT</span>
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    wireModalEvents();
  }

  /** Wire All Internal Modal Events & Forms */
  function wireModalEvents() {
    const overlay = document.getElementById('buyerAuthModal');
    const card = document.getElementById('buyerAuthCard');
    const closeBtn = document.getElementById('buyerAuthCloseBtn');

    if (!overlay || !card) return;

    // Close handlers
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-active')) {
        closeModal();
      }
    });

    // Prevent clicks inside card from closing overlay
    card.addEventListener('click', (e) => e.stopPropagation());

    // Switch buttons
    document.getElementById('btnSwitchToSignup')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchMode('signup');
    });

    document.getElementById('btnHeroSignUp')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchMode('signup');
    });

    document.getElementById('btnSwitchToLogin')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchMode('login');
    });

    document.getElementById('btnHeroSignIn')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchMode('login');
    });

    document.getElementById('btnGoForgot')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchMode('forgot');
    });

    document.getElementById('btnForgotBackToLogin')?.addEventListener('click', (e) => {
      e.preventDefault();
      switchMode('login');
    });

    // KYC Prompt buttons
    document.getElementById('btnStartKycNow')?.addEventListener('click', () => {
      closeModal();
      window.location.href = '/auction/kyc.html';
    });

    document.getElementById('btnKycLater')?.addEventListener('click', () => {
      closeModal();
      if (typeof pendingSuccessCallback === 'function') {
        const cb = pendingSuccessCallback;
        pendingSuccessCallback = null;
        cb(window.auth ? window.auth.getUser() : null);
      }
    });

    // Password Show/Hide toggles
    card.querySelectorAll('.auth-pwd-toggle').forEach((toggleBtn) => {
      toggleBtn.addEventListener('click', () => {
        const targetId = toggleBtn.dataset.target;
        const input = document.getElementById(targetId);
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggleBtn.innerHTML = isPassword ? ICONS.eyeOff : ICONS.eye;
      });
    });

    // Form Submissions
    wireLoginForm();
    wireSignupForm();
    wireForgotForm();
  }

  /** Mode Switcher: 'login' | 'signup' | 'forgot' | 'kyc-prompt' */
  function switchMode(mode) {
    currentView = mode;
    const card = document.getElementById('buyerAuthCard');
    const viewLogin = document.getElementById('authViewLogin');
    const viewSignup = document.getElementById('authViewSignup');
    const viewForgot = document.getElementById('authViewForgot');
    const viewKyc = document.getElementById('authViewKycPrompt');

    clearAllErrors();

    if (mode === 'signup') {
      card.classList.add('is-signup');
      setTimeout(() => {
        viewLogin.classList.remove('active-view');
        viewForgot.classList.remove('active-view');
        viewKyc?.classList.remove('active-view');
        viewSignup.classList.add('active-view');
        document.getElementById('buyerSignupName')?.focus();
      }, 150);
    } else if (mode === 'login') {
      card.classList.remove('is-signup');
      setTimeout(() => {
        viewSignup.classList.remove('active-view');
        viewForgot.classList.remove('active-view');
        viewKyc?.classList.remove('active-view');
        viewLogin.classList.add('active-view');
        document.getElementById('buyerLoginEmail')?.focus();
      }, 150);
    } else if (mode === 'forgot') {
      card.classList.remove('is-signup');
      viewLogin.classList.remove('active-view');
      viewSignup.classList.remove('active-view');
      viewKyc?.classList.remove('active-view');
      viewForgot.classList.add('active-view');
      document.getElementById('buyerForgotEmail')?.focus();
    } else if (mode === 'kyc-prompt') {
      card.classList.remove('is-signup');
      viewLogin.classList.remove('active-view');
      viewSignup.classList.remove('active-view');
      viewForgot.classList.remove('active-view');
      viewKyc?.classList.add('active-view');
    }
  }

  function showAlert(alertBoxId, message, isSuccess = false) {
    const alertBox = document.getElementById(alertBoxId);
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `auth-alert-banner is-visible ${isSuccess ? 'is-success' : ''}`;
  }

  function hideAlert(alertBoxId) {
    const alertBox = document.getElementById(alertBoxId);
    if (!alertBox) return;
    alertBox.className = 'auth-alert-banner';
    alertBox.textContent = '';
  }

  function clearAllErrors() {
    ['loginAlertBox', 'signupAlertBox', 'forgotAlertBox'].forEach(hideAlert);
    document.querySelectorAll('.auth-field-group').forEach((g) => g.classList.remove('has-error'));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  }

  /** 1. Wire Login Form Submission */
  function wireLoginForm() {
    const form = document.getElementById('buyerLoginForm');
    const emailInput = document.getElementById('buyerLoginEmail');
    const passwordInput = document.getElementById('buyerLoginPassword');
    const rememberCheckbox = document.getElementById('buyerRememberMe');
    const submitBtn = document.getElementById('btnLoginSubmit');

    if (!form) return;

    // Prefill remembered email
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (remembered && emailInput) {
      emailInput.value = remembered;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const email = (emailInput.value || '').trim();
      const password = passwordInput.value || '';
      let hasError = false;

      if (!isValidEmail(email)) {
        document.getElementById('loginEmailGroup').classList.add('has-error');
        hasError = true;
      }
      if (!password) {
        document.getElementById('loginPasswordGroup').classList.add('has-error');
        hasError = true;
      }

      if (hasError) return;

      // Handle loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="auth-spinner"></span><span>Verifying credentials…</span>`;

      try {
        const result = await window.api.post('/auth/login', { email, password });
        
        // Save session
        window.auth.setSession(result.token, result.user);

        // Remember Me
        if (rememberCheckbox && rememberCheckbox.checked) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

        // Notify app
        document.dispatchEvent(new CustomEvent('bidmart:auth-change', { detail: { user: result.user } }));
        if (typeof window.renderSellerHeader === 'function') window.renderSellerHeader();
        if (typeof window.renderAuctionSidebar === 'function') window.renderAuctionSidebar();

        closeModal();
        const firstName = result.user.name ? result.user.name.split(' ')[0] : 'there';
        showToast(`Welcome back, ${firstName}!`, 'success');

        // Execute pending protected action
        if (typeof pendingSuccessCallback === 'function') {
          const cb = pendingSuccessCallback;
          pendingSuccessCallback = null;
          cb(result.user);
        }
      } catch (err) {
        showAlert('loginAlertBox', err.message || 'Incorrect email or password.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>LOGIN & CONTINUE</span>`;
      }
    });
  }

  /** 2. Wire Sign Up Form Submission (BUYER-ONLY) */
  function wireSignupForm() {
    const form = document.getElementById('buyerSignupForm');
    const nameInput = document.getElementById('buyerSignupName');
    const emailInput = document.getElementById('buyerSignupEmail');
    const phoneInput = document.getElementById('buyerSignupPhone');
    const passwordInput = document.getElementById('buyerSignupPassword');
    const confirmPasswordInput = document.getElementById('buyerSignupConfirmPassword');
    const submitBtn = document.getElementById('btnSignupSubmit');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const name = (nameInput.value || '').trim();
      const email = (emailInput.value || '').trim();
      const phone = (phoneInput.value || '').trim();
      const password = passwordInput.value || '';
      const confirmPassword = confirmPasswordInput.value || '';
      let hasError = false;

      if (name.length < 2) {
        document.getElementById('signupNameGroup').classList.add('has-error');
        hasError = true;
      }
      if (!isValidEmail(email)) {
        document.getElementById('signupEmailGroup').classList.add('has-error');
        hasError = true;
      }
      if (!phone || phone.length < 7) {
        document.getElementById('signupPhoneGroup').classList.add('has-error');
        hasError = true;
      }
      if (password.length < 8) {
        document.getElementById('signupPasswordGroup').classList.add('has-error');
        hasError = true;
      }
      if (password !== confirmPassword) {
        document.getElementById('signupConfirmPasswordGroup').classList.add('has-error');
        hasError = true;
      }

      if (hasError) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="auth-spinner"></span><span>Creating bidder account…</span>`;

      try {
        // Explicitly send role = 'BUYER'
        const result = await window.api.post('/auth/register', {
          name,
          email,
          phone,
          password,
          role: 'BUYER',
        });

        // Save session
        window.auth.setSession(result.token, result.user);

        // Notify app
        document.dispatchEvent(new CustomEvent('bidmart:auth-change', { detail: { user: result.user } }));
        if (typeof window.renderSellerHeader === 'function') window.renderSellerHeader();
        if (typeof window.renderAuctionSidebar === 'function') window.renderAuctionSidebar();

        showToast(`Bidder account created for ${name}!`, 'success');

        // Transition to KYC Onboarding Prompt inside the modal
        switchMode('kyc-prompt');

      } catch (err) {
        showAlert('signupAlertBox', err.message || 'Unable to create bidder account. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>CREATE BIDDER ACCOUNT</span>`;
      }
    });
  }

  /** 3. Wire Forgot Password Form */
  function wireForgotForm() {
    const form = document.getElementById('buyerForgotForm');
    const emailInput = document.getElementById('buyerForgotEmail');
    const submitBtn = document.getElementById('btnForgotSubmit');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors();

      const email = (emailInput.value || '').trim();
      if (!isValidEmail(email)) {
        document.getElementById('forgotEmailGroup').classList.add('has-error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="auth-spinner"></span><span>Sending…</span>`;

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>SEND RESET LINK</span>`;
        showAlert('forgotAlertBox', `Password reset instructions have been sent to ${email}. Check your inbox!`, true);
      }, 600);
    });
  }

  /** Public Open Method */
  function openModal(mode = 'login', options = {}) {
    buildModalDOM();
    const overlay = document.getElementById('buyerAuthModal');
    if (!overlay) return;

    pendingSuccessCallback = options.onSuccess || null;
    activeContext = options.context || 'auction';

    // Custom prompt / subtitle if protected action triggered
    const subtitle = document.getElementById('authLoginSubtitle');
    if (subtitle) {
      subtitle.textContent = options.message || 'Login to continue bidding on verified auctions.';
    }

    switchMode(mode);

    // Show modal with animation
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  /** Public Close Method */
  function closeModal() {
    const overlay = document.getElementById('buyerAuthModal');
    if (!overlay) return;

    overlay.classList.remove('is-active');
    document.body.style.overflow = '';
    clearAllErrors();
  }

  /**
   * Protected Buyer/Bidder Action Guard.
   * If logged in, executes action immediately.
   * If guest, opens Buyer Auth Modal and resumes action on login success.
   */
  function requireBuyerAuth(actionCallback, message = 'Sign in to your BidMart account to continue.') {
    if (window.auth && window.auth.isLoggedIn()) {
      if (typeof actionCallback === 'function') actionCallback(window.auth.getUser());
      return;
    }

    openModal('login', {
      message,
      onSuccess: (user) => {
        if (typeof actionCallback === 'function') actionCallback(user);
      }
    });
  }

  // Export to Global Window Object
  window.buyerAuth = {
    open: openModal,
    close: closeModal,
    showToast,
    requireBuyerAuth,
    switchMode,
  };

  // Initialize DOM on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildModalDOM);
  } else {
    buildModalDOM();
  }
})();
