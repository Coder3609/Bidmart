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
    if (req.user.role === 'ADMIN') {
      return next();
    }
    if (req.user.role !== 'SELLER') {
      return next(new ApiError('Only registered sellers can perform this action.', 403, 'FORBIDDEN'));
    }

    const profile = await sellerModel.getProfileByUserId(null, req.user.id);
    if (!profile || profile.seller_status !== 'APPROVED') {
      const status = profile ? profile.seller_status : 'PENDING';
      let message = 'Your seller account is currently pending verification and review. Active approval is required to list products or launch auctions.';
      if (status === 'SUSPENDED') {
        message = 'Your seller privileges are currently suspended. Please contact BidMart compliance.';
      } else if (status === 'REQUIRES_UPDATE') {
        message = 'Additional verification details are required for your seller account before listing products.';
      } else if (status === 'REJECTED') {
        message = 'Your seller application could not be approved. Please review verification details.';
      }
      return next(new ApiError(message, 403, 'SELLER_NOT_APPROVED'));
    }

    req.sellerProfile = profile;
    next();
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

