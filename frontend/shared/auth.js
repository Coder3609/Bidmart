/**
 * Shared auth helpers.
 *
 * Wraps the /api/auth/* endpoints (register, login, logout, me) and
 * manages the client-side session (JWT + user profile in localStorage).
 * `api.js` reads the token from here automatically on every request.
 */

const TOKEN_KEY = 'marketplace_token';
const USER_KEY = 'marketplace_user';
const SELLER_TOKEN_KEY = 'bidmart_seller_token';
const SELLER_USER_KEY = 'bidmart_seller_user';

function isSellerPage() {
  return window.location.pathname.startsWith('/seller/');
}

function getToken() {
  if (isSellerPage()) {
    return localStorage.getItem(SELLER_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  }
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  if (isSellerPage()) {
    const sRaw = localStorage.getItem(SELLER_USER_KEY);
    if (sRaw) {
      try { return JSON.parse(sRaw); } catch(_) {}
    }
  }
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function getSellerUser() {
  const sRaw = localStorage.getItem(SELLER_USER_KEY);
  return sRaw ? JSON.parse(sRaw) : null;
}

function setSession(token, user) {
  if (user && (user.role === 'SELLER' || user.role === 'seller' || isSellerPage())) {
    localStorage.setItem(SELLER_TOKEN_KEY, token);
    localStorage.setItem(SELLER_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  document.dispatchEvent(new CustomEvent('bidmart:auth-change', { detail: { user } }));
}

function setBuyerSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.dispatchEvent(new CustomEvent('bidmart:auth-change', { detail: { user } }));
}

function setSellerSession(token, user) {
  localStorage.setItem(SELLER_TOKEN_KEY, token);
  localStorage.setItem(SELLER_USER_KEY, JSON.stringify(user));
  document.dispatchEvent(new CustomEvent('bidmart:auth-change', { detail: { user } }));
}

function clearSession() {
  if (isSellerPage()) {
    localStorage.removeItem(SELLER_TOKEN_KEY);
    localStorage.removeItem(SELLER_USER_KEY);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  document.dispatchEvent(new CustomEvent('bidmart:auth-change', { detail: { user: null } }));
}

function isLoggedIn() {
  return Boolean(getToken());
}

function hasRole(role) {
  const user = getUser();
  return Boolean(user && user.role === role);
}

/**
 * Guard used at the top of role-specific pages, e.g.:
 *   window.auth.requireRole('SELLER');
 * Dashboard pages (Phase 6) will call this before rendering anything.
 */
function requireRole(role) {
  if (!isLoggedIn() || !hasRole(role)) {
    window.location.href = '/auth/login.html';
  }
}

/** Guard for pages any logged-in role can use (e.g. notifications) — just requires being logged in. */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/auth/login.html';
  }
}

/**
 * POST /api/auth/register — role must be 'BUYER' or 'SELLER'.
 * On success, stores the session so the user is immediately logged in.
 */
async function register({ name, email, password, phone, role }) {
  const result = await window.api.post('/auth/register', { name, email, password, phone, role });
  setSession(result.token, result.user);
  return result.user;
}

/** POST /api/auth/login — stores the session on success. */
async function login({ email, password }) {
  const result = await window.api.post('/auth/login', { email, password });
  setSession(result.token, result.user);
  return result.user;
}

/** POST /api/auth/logout, then always clear the local session. */
async function logout() {
  try {
    await window.api.post('/auth/logout');
  } finally {
    clearSession();
  }
}

/** GET /api/auth/me — refreshes the cached profile from the server. */
async function refreshProfile() {
  const profile = await window.api.get('/auth/me');
  const token = getToken();
  setSession(token, profile);
  return profile;
}

/** Redirects a logged-in user to their role's dashboard. Used on login/register success. */
function redirectToDashboard() {
  const user = getUser();
  if (!user) return;
  if (user.role === 'SELLER' || user.store_name) {
    window.location.href = '/seller/products.html';
  } else {
    window.location.href = '/shop/profile.html';
  }
}

/** Social Login (Google / Apple) seamless simulation or OAuth */
async function loginWithSocial(provider) {
  // If demo/simulation, log in as verified buyer
  try {
    const email = provider === 'google' ? 'rahul@bidmart.test' : 'priya@bidmart.test';
    const user = await login({ email, password: 'Password123!' });
    window.location.href = '/shop/shop.html';
    return user;
  } catch (err) {
    alert(`Could not sign in with ${provider}: ${err.message}`);
  }
}

window.auth = {
  getToken,
  getUser,
  getSellerUser,
  setSession,
  setBuyerSession,
  setSellerSession,
  clearSession,
  isLoggedIn,
  hasRole,
  requireRole,
  requireAuth,
  register,
  login,
  loginWithSocial,
  logout,
  refreshProfile,
  redirectToDashboard,
};
