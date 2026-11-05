/**
 * Shared auth helpers.
 *
 * Wraps the /api/auth/* endpoints (register, login, logout, me) and
 * manages the client-side session (JWT + user profile in localStorage).
 * `api.js` reads the token from here automatically on every request.
 */

const TOKEN_KEY = 'marketplace_token';
const USER_KEY = 'marketplace_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.dispatchEvent(new CustomEvent('bidmart:auth-change', { detail: { user } }));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
  window.location.href = `/dashboards/${user.role.toLowerCase()}/dashboard.html`;
}

window.auth = {
  getToken,
  getUser,
  setSession,
  clearSession,
  isLoggedIn,
  hasRole,
  requireRole,
  requireAuth,
  register,
  login,
  logout,
  refreshProfile,
  redirectToDashboard,
};
