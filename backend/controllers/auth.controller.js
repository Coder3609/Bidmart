const authService = require('../services/auth.service');
const { success } = require('../utils/apiResponse');

async function register(req, res, next) {
  try {
    const { name, email, password, phone, role } = req.body;
    const result = await authService.register({ name, email, password, phone, role });
    return success(res, result, 'Account created successfully.', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return success(res, result, 'Logged in successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * Logout is stateless with JWTs — the client simply discards the token.
 * This endpoint exists so the frontend has one consistent call to make
 * and so a future token-blacklist/refresh-token scheme can slot in here
 * without changing the client.
 */
async function logout(req, res) {
  return success(res, null, 'Logged out successfully.');
}

async function me(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user.id);
    return success(res, profile, 'Current user profile.');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/me — update profile fields (name, phone, store_name).
 * Requires the caller to be authenticated. Identity comes from the JWT — the
 * frontend never sends a user_id in the body (that would be a security bypass).
 */
async function updateMe(req, res, next) {
  try {
    const updated = await authService.updateProfile(req.user.id, req.body);
    return success(res, updated, 'Profile updated.');
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, updateMe };

