const userModel = require('../models/user.model');
const bidderModel = require('../models/bidder.model');
const sellerModel = require('../models/seller.model');
const notificationModel = require('../models/notification.model');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiResponse');
const {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidRegisterRole,
} = require('../utils/validators');

async function toPublicUser(user) {
  // Never send password_hash to the client.
  const { password_hash, ...publicUser } = user; // eslint-disable-line no-unused-vars
  try {
    if (user.role === 'BUYER' || !user.role) {
      const bidder = await bidderModel.getOrCreate(null, user.id, {
        displayName: user.name,
        mobileNumber: user.phone,
      });
      publicUser.bidder_profile = {
        id: bidder.id,
        bidder_id: `BM-BID-${String(bidder.id).padStart(6, '0')}`,
        bidder_status: bidder.bidder_status,
        kyc_status: bidder.kyc_status,
        bidder_verified_at: bidder.bidder_verified_at,
      };
    } else if (user.role === 'SELLER') {
      const seller = await sellerModel.getOrCreateProfile(null, user.id, {
        storeName: user.store_name || user.name,
        displayName: user.name,
        businessPhone: user.phone,
        businessEmail: user.email,
      });
      publicUser.seller_profile = {
        id: seller.id,
        store_name: seller.store_name,
        seller_status: seller.seller_status,
        kyc_status: seller.kyc_status,
        payout_status: seller.payout_status,
        onboarding_step: seller.onboarding_step,
        is_approved: seller.seller_status === 'APPROVED',
        can_sell: seller.seller_status === 'APPROVED',
      };
    }
  } catch (err) {
    // Non-blocking fallback
    publicUser.bidder_profile = null;
    publicUser.seller_profile = null;
  }
  return publicUser;
}

async function register({ name, email, password, phone, role }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  const chosenRole = role || 'BUYER';

  if (!isValidName(cleanName)) {
    throw new ApiError('Name must be between 2 and 120 characters.', 400, 'INVALID_NAME');
  }
  if (!isValidEmail(cleanEmail)) {
    throw new ApiError('Please provide a valid email address.', 400, 'INVALID_EMAIL');
  }
  if (!isValidPassword(password)) {
    throw new ApiError('Password must be at least 8 characters long.', 400, 'INVALID_PASSWORD');
  }
  if (!isValidRegisterRole(chosenRole)) {
    throw new ApiError('Role must be BUYER or SELLER.', 400, 'INVALID_ROLE');
  }

  const alreadyExists = await userModel.emailExists(cleanEmail);
  if (alreadyExists) {
    throw new ApiError('An account with this email already exists.', 409, 'EMAIL_TAKEN');
  }

  const passwordHash = hashPassword(password);
  const user = await userModel.create({
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    phone,
    role: chosenRole,
  });

  const token = signToken({ sub: user.id, role: user.role });

  // If registering as a BUYER, ensure bidder profile is initialized immediately
  if (chosenRole === 'BUYER') {
    await bidderModel.getOrCreate(null, user.id, {
      displayName: cleanName,
      mobileNumber: phone,
    }).catch(() => {});
  }

  // If registering as a SELLER, initialize seller profile
  if (chosenRole === 'SELLER') {
    await sellerModel.createProfile(null, {
      userId: user.id,
      storeName: `${cleanName}'s Store`,
      displayName: cleanName,
      businessPhone: phone || null,
      businessEmail: cleanEmail,
      sellerStatus: 'PENDING',
      kycStatus: 'NOT_STARTED',
      onboardingStep: 2,
    }).catch(() => {});

    notificationModel.notifyAdmins(null, {
      type: 'NEW_SELLER',
      title: 'New seller registered',
      message: `${user.name} (${user.email}) joined as a seller.`,
      metadata: { userId: user.id },
    }).catch(() => {});
  }

  const publicUser = await toPublicUser(user);
  return { token, user: publicUser };
}

async function login({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!isValidEmail(cleanEmail) || !password) {
    throw new ApiError('Email and password are required.', 400, 'MISSING_CREDENTIALS');
  }

  const user = await userModel.findByEmail(cleanEmail);
  if (!user) {
    throw new ApiError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError('This account is not active. Contact support.', 403, 'ACCOUNT_INACTIVE');
  }

  const passwordMatches = verifyPassword(password, user.password_hash);
  if (!passwordMatches) {
    throw new ApiError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const token = signToken({ sub: user.id, role: user.role });
  const publicUser = await toPublicUser(user);
  return { token, user: publicUser };
}

async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found.', 404, 'USER_NOT_FOUND');
  }
  return toPublicUser(user);
}

async function updateProfile(userId, fields) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const allowedUpdates = {};
  if (fields.name !== undefined) {
    const cleanName = String(fields.name).trim();
    if (!isValidName(cleanName)) {
      throw new ApiError('Name must be between 2 and 120 characters.', 400, 'INVALID_NAME');
    }
    allowedUpdates.name = cleanName;
  }
  if (fields.phone !== undefined) {
    allowedUpdates.phone = fields.phone ? String(fields.phone).trim() : null;
  }
  if (fields.store_name !== undefined) {
    const cleanStoreName = fields.store_name ? String(fields.store_name).trim() : null;
    if (cleanStoreName && (cleanStoreName.length < 2 || cleanStoreName.length > 120)) {
      throw new ApiError('Store name must be between 2 and 120 characters.', 400, 'INVALID_STORE_NAME');
    }
    allowedUpdates.store_name = cleanStoreName;
  }

  return userModel.updateProfile(userId, allowedUpdates);
}

module.exports = { register, login, getProfile, updateProfile };

