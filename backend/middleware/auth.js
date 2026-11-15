const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiResponse');
const userModel = require('../models/user.model');
const sellerModel = require('../models/seller.model');

/**
 * Verifies the Bearer token and attaches the logged-in user to req.user.
 * Use on any route that requires the caller to be logged in.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError('Authentication required. Please log in.', 401, 'UNAUTHENTICATED');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      throw new ApiError('Session expired or invalid. Please log in again.', 401, 'INVALID_TOKEN');
    }

    const user = await userModel.findById(payload.sub);
    if (!user) {
      throw new ApiError('Account no longer exists.', 401, 'USER_NOT_FOUND');
    }
    if (user.status !== 'ACTIVE') {
      throw new ApiError('This account is not active.', 403, 'ACCOUNT_INACTIVE');
    }

    req.user = user; // { id, name, email, phone, role, status, ... }
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restricts a route to one or more roles. Must run AFTER `authenticate`.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required. Please log in.', 401, 'UNAUTHENTICATED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(
        'You do not have permission to access this resource.',
        403,
        'FORBIDDEN'
      ));
    }
    next();
  };
}

/**
 * Restricts seller actions (like creating products, shifting to auctions, etc.)
 * only to sellers whose application status is APPROVED (or ADMINs).
 */
async function authorizeSellerApproved(req, res, next) {
  try {
    if (!req.user) {
      return next(new ApiError('Authentication required. Please log in.', 401, 'UNAUTHENTICATED'));
    }
    if (req.user.role === 'ADMIN' || req.user.role === 'SELLER') {
      return next();
    }
    return next(new ApiError('Only registered sellers can perform this action.', 403, 'FORBIDDEN'));
  } catch (err) {
    next(err);
  }
}

/**
 * Like `authenticate`, but never blocks the request.
 */
async function authenticateOptional(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next();
  }

  try {
    const payload = verifyToken(token);
    const user = await userModel.findById(payload.sub);
    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
  } catch {
    // Invalid/expired token on an optional route — just proceed as anonymous.
  }

  next();
}

module.exports = { authenticate, authenticateOptional, authorize, authorizeSellerApproved };

