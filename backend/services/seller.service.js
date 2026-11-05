const userModel = require('../models/user.model');
const sellerModel = require('../models/seller.model');
const notificationModel = require('../models/notification.model');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiResponse');
const { withTransaction } = require('../config/db');
const {
  isValidEmail,
  isValidPassword,
  isValidName,
} = require('../utils/validators');

const ALLOWED_BUSINESS_TYPES = [
  'INDIVIDUAL',
  'SOLE_PROPRIETORSHIP',
  'PARTNERSHIP',
  'COMPANY',
  'OTHER',
];

const ALLOWED_SELLER_KYC_ID_TYPES = [
  'AADHAAR',
  'PAN',
  'PASSPORT',
  'DRIVING_LICENSE',
  'VOTER_ID',
  'GSTIN_CERTIFICATE',
  'COMPANY_PAN',
  'BUSINESS_REGISTRATION',
];

/**
 * Mask an account number (e.g. 123456789012 -> "XXXX XXXX 9012")
 */
function maskAccountNumber(accNumber) {
  const clean = String(accNumber || '').replace(/\s|-/g, '').trim();
  if (clean.length < 4) return 'XXXX';
  const last4 = clean.slice(-4);
  return `XXXX XXXX ${last4}`;
}

/**
 * Mask an ID number
 */
function maskIdNumber(idNumber, idType) {
  const clean = String(idNumber || '').replace(/\s|-/g, '').trim().toUpperCase();
  if (clean.length < 4) return 'XXXX';
  const last4 = clean.slice(-4);
  if (idType === 'AADHAAR' && clean.length === 12) {
    return `XXXX-XXXX-${last4}`;
  }
  const maskedPrefix = 'X'.repeat(Math.max(2, clean.length - 4));
  return `${maskedPrefix}${last4}`;
}

/**
 * Validates IFSC format (4 letters, '0', 6 alphanumeric)
 */
function isValidIFSC(ifsc) {
  if (!ifsc) return false;
  const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
  return regex.test(String(ifsc).trim());
}

/**
 * Validates PIN code (6 digits for India)
 */
function isValidPINCode(pin) {
  if (!pin) return false;
  const regex = /^[1-9][0-9]{5}$/;
  return regex.test(String(pin).trim());
}

/**
 * Format seller profile representation for public/frontend responses
 */
function formatSellerProfile(profile, address = null, payout = null, kyc = null, history = []) {
  if (!profile) return null;
  return {
    id: profile.id,
    userId: profile.user_id,
    storeName: profile.store_name,
    businessType: profile.business_type,
    displayName: profile.display_name || profile.user_name || profile.store_name,
    businessDescription: profile.business_description,
    businessCategory: profile.business_category,
    businessPhone: profile.business_phone || profile.user_phone,
    businessEmail: profile.business_email || profile.user_email,
    logoUrl: profile.logo_url,
    bannerUrl: profile.banner_url,
    sellerStatus: profile.seller_status,
    kycStatus: profile.kyc_status,
    payoutStatus: profile.payout_status,
    onboardingStep: profile.onboarding_step,
    taxIdMasked: profile.tax_id ? maskIdNumber(profile.tax_id, 'PAN') : null,
    gstinMasked: profile.gstin ? maskIdNumber(profile.gstin, 'GSTIN_CERTIFICATE') : null,
    termsAccepted: Boolean(profile.terms_accepted),
    policiesAccepted: Boolean(profile.policies_accepted),
    accuracyConfirmed: Boolean(profile.accuracy_confirmed),
    submittedAt: profile.submitted_at,
    approvedAt: profile.approved_at,
    rejectionReason: profile.rejection_reason,
    isApproved: profile.seller_status === 'APPROVED',
    canSell: profile.seller_status === 'APPROVED',
    address: address ? {
      id: address.id,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2,
      city: address.city,
      state: address.state,
      district: address.district,
      postalCode: address.postal_code,
      country: address.country,
    } : null,
    payout: payout ? {
      id: payout.id,
      accountHolderName: payout.account_holder_name,
      bankName: payout.bank_name,
      accountNumberMasked: payout.account_number_masked,
      ifscCode: payout.ifsc_code,
      isVerified: Boolean(payout.is_verified),
    } : null,
    latestKyc: kyc ? {
      id: kyc.id,
      legalName: kyc.legal_name,
      dobOrIncorporation: kyc.dob_or_incorporation,
      idType: kyc.id_type,
      idNumberMasked: kyc.id_number_masked,
      status: kyc.status,
      rejectionReason: kyc.rejection_reason,
      documentRef: kyc.document_ref,
      submittedAt: kyc.submitted_at,
      reviewedAt: kyc.reviewed_at,
    } : null,
    history: history.map(h => ({
      id: h.id,
      oldStatus: h.old_status,
      newStatus: h.new_status,
      reason: h.reason,
      changedByName: h.changed_by_name || 'System / Admin',
      createdAt: h.created_at,
    })),
  };
}

// ----------------------------------------------------------------------
// Seller Authentication: Register
// ----------------------------------------------------------------------

async function registerSeller({ name, email, password, phone, storeName }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  const cleanStore = (storeName || '').trim() || `${cleanName}'s Store`;

  if (!isValidName(cleanName)) {
    throw new ApiError('Name must be between 2 and 120 characters.', 400, 'INVALID_NAME');
  }
  if (!isValidEmail(cleanEmail)) {
    throw new ApiError('Please provide a valid email address.', 400, 'INVALID_EMAIL');
  }
  if (!isValidPassword(password)) {
    throw new ApiError('Password must be at least 8 characters long.', 400, 'INVALID_PASSWORD');
  }
  if (cleanPhone && cleanPhone.length < 7) {
    throw new ApiError('Please provide a valid phone number.', 400, 'INVALID_PHONE');
  }

  const alreadyExists = await userModel.emailExists(cleanEmail);
  if (alreadyExists) {
    throw new ApiError('An account with this email already exists.', 409, 'EMAIL_TAKEN');
  }

  return withTransaction(async (conn) => {
    const passwordHash = hashPassword(password);
    const [userRes] = await conn.query(
      `INSERT INTO users (name, email, password_hash, phone, role, status, store_name)
       VALUES (:name, :email, :passwordHash, :phone, 'SELLER', 'ACTIVE', :storeName)`,
      {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        phone: cleanPhone || null,
        storeName: cleanStore,
      }
    );
    const userId = userRes.insertId;

    // Create Seller Profile
    const sellerProfile = await sellerModel.createProfile(conn, {
      userId,
      storeName: cleanStore,
      businessType: 'INDIVIDUAL',
      displayName: cleanName,
      businessPhone: cleanPhone || null,
      businessEmail: cleanEmail,
      sellerStatus: 'PENDING',
      kycStatus: 'NOT_STARTED',
      onboardingStep: 2, // Account created -> next is Business Info
    });

    // Notify Admins
    notificationModel.notifyAdmins(conn, {
      type: 'NEW_SELLER',
      title: 'New Seller Account Created',
      message: `${cleanName} registered a seller account for "${cleanStore}". Onboarding in progress.`,
      metadata: { userId, sellerId: sellerProfile.id },
    }).catch(() => {});

    // Notify Seller
    notificationModel.create(conn, {
      userId,
      type: 'SELLER_ACCOUNT_CREATED',
      title: 'Welcome to BidMart Seller Portal!',
      message: 'Your seller account has been created. Please complete your business verification to start selling.',
      metadata: { sellerId: sellerProfile.id },
    }).catch(() => {});

    const token = signToken({ sub: userId, role: 'SELLER' });
    const formattedProfile = formatSellerProfile(sellerProfile);

    return {
      token,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone || null,
        role: 'SELLER',
        status: 'ACTIVE',
        store_name: cleanStore,
        seller_profile: formattedProfile,
      },
      seller: formattedProfile,
    };
  });
}

// ----------------------------------------------------------------------
// Seller Authentication: Login
// ----------------------------------------------------------------------

async function loginSeller({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!isValidEmail(cleanEmail) || !password) {
    throw new ApiError('Email and password are required.', 400, 'MISSING_CREDENTIALS');
  }

  const user = await userModel.findByEmail(cleanEmail);
  if (!user) {
    throw new ApiError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Verify Role is SELLER or ADMIN
  if (user.role !== 'SELLER' && user.role !== 'ADMIN') {
    throw new ApiError(
      'This login portal is exclusively for BidMart Sellers. Please use the Buyer login.',
      403,
      'NOT_A_SELLER_ACCOUNT'
    );
  }

  // Check Account Status
  if (user.status === 'BLOCKED') {
    throw new ApiError('Your seller account has been blocked. Please contact BidMart compliance.', 403, 'ACCOUNT_BLOCKED');
  }
  if (user.status === 'SUSPENDED') {
    throw new ApiError('Your seller account is currently suspended. Please contact support.', 403, 'ACCOUNT_SUSPENDED');
  }
  if (user.status !== 'ACTIVE') {
    throw new ApiError('This account is inactive. Contact support.', 403, 'ACCOUNT_INACTIVE');
  }

  const passwordMatches = verifyPassword(password, user.password_hash);
  if (!passwordMatches) {
    throw new ApiError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Get or initialize seller profile
  const profile = await sellerModel.getOrCreateProfile(null, user.id, {
    storeName: user.store_name || user.name,
    displayName: user.name,
    businessPhone: user.phone,
    businessEmail: user.email,
  });

  const address = await sellerModel.getAddressBySellerId(null, profile.id);
  const payout = await sellerModel.getPayoutBySellerId(null, profile.id);
  const kyc = await sellerModel.getLatestKycBySellerId(null, profile.id);
  const history = await sellerModel.getHistoryBySellerId(null, profile.id);

  const formattedProfile = formatSellerProfile(profile, address, payout, kyc, history);
  const token = signToken({ sub: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      store_name: profile.store_name || user.store_name,
      seller_profile: formattedProfile,
    },
    seller: formattedProfile,
  };
}

// ----------------------------------------------------------------------
// Seller Profile Retrieval
// ----------------------------------------------------------------------

async function getSellerFullProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const profile = await sellerModel.getOrCreateProfile(null, userId, {
    storeName: user.store_name || user.name,
    displayName: user.name,
    businessPhone: user.phone,
    businessEmail: user.email,
  });

  const address = await sellerModel.getAddressBySellerId(null, profile.id);
  const payout = await sellerModel.getPayoutBySellerId(null, profile.id);
  const kyc = await sellerModel.getLatestKycBySellerId(null, profile.id);
  const history = await sellerModel.getHistoryBySellerId(null, profile.id);

  return formatSellerProfile(profile, address, payout, kyc, history);
}

// ----------------------------------------------------------------------
// Seller Onboarding: Multi-step Save
// ----------------------------------------------------------------------

async function saveOnboardingStep(user, stepNumber, data) {
  const step = Number(stepNumber);
  const profile = await sellerModel.getOrCreateProfile(null, user.id, {
    storeName: user.store_name || user.name,
    displayName: user.name,
    businessPhone: user.phone,
    businessEmail: user.email,
  });

  if (profile.seller_status === 'APPROVED') {
    // If approved, onboarding is already complete, but profile updates are allowed via settings
  }

  return withTransaction(async (conn) => {
    // -------------------------------------------------------------
    // STEP 2: Business Information
    // -------------------------------------------------------------
    if (step === 2) {
      const {
        storeName,
        businessType,
        displayName,
        businessDescription,
        businessCategory,
        businessPhone,
        businessEmail,
        taxId,
        gstin,
      } = data;

      const cleanStore = (storeName || '').trim();
      if (!cleanStore || cleanStore.length < 2 || cleanStore.length > 120) {
        throw new ApiError('Store / Business name must be between 2 and 120 characters.', 400, 'INVALID_STORE_NAME');
      }

      const cleanType = (businessType || 'INDIVIDUAL').toUpperCase();
      if (!ALLOWED_BUSINESS_TYPES.includes(cleanType)) {
        throw new ApiError(`Invalid business type. Allowed: ${ALLOWED_BUSINESS_TYPES.join(', ')}`, 400, 'INVALID_BUSINESS_TYPE');
      }

      if (businessEmail && !isValidEmail(businessEmail)) {
        throw new ApiError('Please enter a valid business email.', 400, 'INVALID_EMAIL');
      }

      const updates = {
        store_name: cleanStore,
        business_type: cleanType,
        display_name: displayName ? displayName.trim() : null,
        business_description: businessDescription ? businessDescription.trim() : null,
        business_category: businessCategory ? businessCategory.trim() : null,
        business_phone: businessPhone ? businessPhone.trim() : null,
        business_email: businessEmail ? businessEmail.trim().toLowerCase() : null,
        tax_id: taxId ? taxId.trim().toUpperCase() : null,
        gstin: gstin ? gstin.trim().toUpperCase() : null,
        onboarding_step: Math.max(profile.onboarding_step, 3),
      };

      await sellerModel.updateProfileFields(conn, profile.id, updates);
      await conn.query('UPDATE users SET store_name = :storeName WHERE id = :userId', {
        storeName: cleanStore,
        userId: user.id,
      });

      return { success: true, step: 2, nextStep: 3, message: 'Business information saved.' };
    }

    // -------------------------------------------------------------
    // STEP 3: Business Address
    // -------------------------------------------------------------
    if (step === 3) {
      const {
        addressLine1,
        addressLine2,
        city,
        state,
        district,
        postalCode,
        country = 'India',
      } = data;

      const cleanLine1 = (addressLine1 || '').trim();
      const cleanCity = (city || '').trim();
      const cleanState = (state || '').trim();
      const cleanPostal = (postalCode || '').trim();

      if (!cleanLine1 || cleanLine1.length < 5) {
        throw new ApiError('Please provide a complete street address (Line 1).', 400, 'INVALID_ADDRESS');
      }
      if (!cleanCity || cleanCity.length < 2) {
        throw new ApiError('Please provide a valid city.', 400, 'INVALID_CITY');
      }
      if (!cleanState || cleanState.length < 2) {
        throw new ApiError('Please provide a valid state.', 400, 'INVALID_STATE');
      }
      if (!isValidPINCode(cleanPostal)) {
        throw new ApiError('Please provide a valid 6-digit PIN code.', 400, 'INVALID_POSTAL_CODE');
      }

      await sellerModel.upsertAddress(conn, {
        sellerId: profile.id,
        userId: user.id,
        addressLine1: cleanLine1,
        addressLine2: addressLine2 ? addressLine2.trim() : null,
        city: cleanCity,
        state: cleanState,
        district: district ? district.trim() : null,
        postalCode: cleanPostal,
        country: country.trim(),
      });

      await sellerModel.updateProfileFields(conn, profile.id, {
        onboarding_step: Math.max(profile.onboarding_step, 4),
      });

      return { success: true, step: 3, nextStep: 4, message: 'Business address saved.' };
    }

    // -------------------------------------------------------------
    // STEP 4: Payout Details
    // -------------------------------------------------------------
    if (step === 4) {
      const {
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
      } = data;

      const cleanHolder = (accountHolderName || '').trim();
      const cleanBank = (bankName || '').trim();
      const cleanAcc = (accountNumber || '').replace(/\s|-/g, '').trim();
      const cleanIFSC = (ifscCode || '').trim().toUpperCase();

      if (!cleanHolder || cleanHolder.length < 3) {
        throw new ApiError('Account holder name must be at least 3 characters.', 400, 'INVALID_HOLDER_NAME');
      }
      if (!cleanBank || cleanBank.length < 2) {
        throw new ApiError('Bank name is required.', 400, 'INVALID_BANK_NAME');
      }
      if (!cleanAcc || cleanAcc.length < 8 || cleanAcc.length > 20 || !/^\d+$/.test(cleanAcc)) {
        throw new ApiError('Please enter a valid bank account number (8–20 digits).', 400, 'INVALID_ACCOUNT_NUMBER');
      }
      if (!isValidIFSC(cleanIFSC)) {
        throw new ApiError('Please enter a valid Indian IFSC code (e.g. HDFC0001234).', 400, 'INVALID_IFSC');
      }

      const masked = maskAccountNumber(cleanAcc);

      await sellerModel.upsertPayout(conn, {
        sellerId: profile.id,
        userId: user.id,
        accountHolderName: cleanHolder,
        bankName: cleanBank,
        accountNumberMasked: masked,
        ifscCode: cleanIFSC,
        isVerified: 0,
      });

      await sellerModel.updateProfileFields(conn, profile.id, {
        payout_status: 'PENDING',
        onboarding_step: Math.max(profile.onboarding_step, 5),
      });

      return { success: true, step: 4, nextStep: 5, message: 'Payout details securely saved.' };
    }

    // -------------------------------------------------------------
    // STEP 5: KYC Verification Details
    // -------------------------------------------------------------
    if (step === 5) {
      const {
        legalName,
        dobOrIncorporation,
        idType,
        idNumber,
        documentRef,
      } = data;

      const cleanLegal = (legalName || '').trim();
      const cleanType = (idType || '').trim().toUpperCase();
      const cleanId = (idNumber || '').replace(/\s|-/g, '').trim();

      if (!cleanLegal || cleanLegal.length < 3) {
        throw new ApiError('Please provide full legal name as per government ID.', 400, 'INVALID_LEGAL_NAME');
      }
      if (!ALLOWED_SELLER_KYC_ID_TYPES.includes(cleanType)) {
        throw new ApiError(`Invalid ID type. Allowed: ${ALLOWED_SELLER_KYC_ID_TYPES.join(', ')}`, 400, 'INVALID_ID_TYPE');
      }
      if (!cleanId || cleanId.length < 4) {
        throw new ApiError('Please enter a valid government identification number.', 400, 'INVALID_ID_NUMBER');
      }

      const masked = maskIdNumber(cleanId, cleanType);

      await sellerModel.createKyc(conn, {
        sellerId: profile.id,
        userId: user.id,
        legalName: cleanLegal,
        dobOrIncorporation: dobOrIncorporation || null,
        idType: cleanType,
        idNumberMasked: masked,
        documentRef: documentRef || null,
        status: 'PENDING',
      });

      await sellerModel.updateProfileFields(conn, profile.id, {
        kyc_status: 'IN_PROGRESS',
        onboarding_step: Math.max(profile.onboarding_step, 6),
      });

      return { success: true, step: 5, nextStep: 6, message: 'KYC details submitted for review.' };
    }

    // -------------------------------------------------------------
    // STEP 6: Final Review & Submission
    // -------------------------------------------------------------
    if (step === 6) {
      const {
        termsAccepted,
        policiesAccepted,
        accuracyConfirmed,
      } = data;

      if (!termsAccepted || !policiesAccepted || !accuracyConfirmed) {
        throw new ApiError(
          'You must accept the BidMart Seller Terms, Marketplace Policies, and confirm the accuracy of your information before submitting.',
          400,
          'AGREEMENTS_REQUIRED'
        );
      }

      // Verify all prerequisite steps exist
      const address = await sellerModel.getAddressBySellerId(conn, profile.id);
      if (!address) {
        throw new ApiError('Business address is missing. Please complete Step 3.', 400, 'MISSING_ADDRESS');
      }

      const payout = await sellerModel.getPayoutBySellerId(conn, profile.id);
      if (!payout) {
        throw new ApiError('Payout details are missing. Please complete Step 4.', 400, 'MISSING_PAYOUT');
      }

      const kyc = await sellerModel.getLatestKycBySellerId(conn, profile.id);
      if (!kyc) {
        throw new ApiError('KYC verification details are missing. Please complete Step 5.', 400, 'MISSING_KYC');
      }

      const oldStatus = profile.seller_status;
      const submittedAt = new Date();

      await sellerModel.updateProfileFields(conn, profile.id, {
        seller_status: 'UNDER_REVIEW',
        kyc_status: 'PENDING',
        terms_accepted: 1,
        policies_accepted: 1,
        accuracy_confirmed: 1,
        submitted_at: submittedAt,
        onboarding_step: 6,
      });

      // Audit log
      await sellerModel.logHistory(conn, {
        sellerId: profile.id,
        userId: user.id,
        oldStatus,
        newStatus: 'UNDER_REVIEW',
        reason: 'Seller completed multi-step onboarding and submitted application for review.',
        changedBy: user.id,
      });

      // Notify Admins
      notificationModel.notifyAdmins(conn, {
        type: 'SELLER_APPLICATION_SUBMITTED',
        title: 'New Seller Application for Review',
        message: `Seller "${profile.store_name}" (${user.name}) submitted onboarding for approval.`,
        metadata: { sellerId: profile.id, userId: user.id },
      }).catch(() => {});

      // Notify Seller
      notificationModel.create(conn, {
        userId: user.id,
        type: 'APPLICATION_SUBMITTED',
        title: 'Seller Application Submitted',
        message: 'Your seller application is under review. Our compliance team will review your business credentials and notify you shortly.',
        metadata: { sellerId: profile.id },
      }).catch(() => {});

      return {
        success: true,
        step: 6,
        status: 'UNDER_REVIEW',
        message: 'Your seller application has been submitted successfully and is now under review.',
      };
    }

    throw new ApiError(`Invalid onboarding step ${stepNumber}.`, 400, 'INVALID_STEP');
  });
}

// ----------------------------------------------------------------------
// Store Settings Update (from Seller Center Settings)
// ----------------------------------------------------------------------

async function updateStoreSettings(userId, fields) {
  const profile = await sellerModel.getProfileByUserId(null, userId);
  if (!profile) {
    throw new ApiError('Seller profile not found.', 404, 'SELLER_NOT_FOUND');
  }

  const updates = {};
  if (fields.storeName !== undefined) {
    const cleanStore = String(fields.storeName).trim();
    if (cleanStore.length < 2 || cleanStore.length > 120) {
      throw new ApiError('Store name must be between 2 and 120 characters.', 400, 'INVALID_STORE_NAME');
    }
    updates.store_name = cleanStore;
    await userModel.updateProfile(userId, { store_name: cleanStore });
  }

  if (fields.displayName !== undefined) {
    updates.display_name = fields.displayName ? String(fields.displayName).trim() : null;
  }
  if (fields.businessDescription !== undefined) {
    updates.business_description = fields.businessDescription ? String(fields.businessDescription).trim() : null;
  }
  if (fields.businessCategory !== undefined) {
    updates.business_category = fields.businessCategory ? String(fields.businessCategory).trim() : null;
  }
  if (fields.businessPhone !== undefined) {
    updates.business_phone = fields.businessPhone ? String(fields.businessPhone).trim() : null;
  }
  if (fields.businessEmail !== undefined) {
    const cleanEmail = fields.businessEmail ? String(fields.businessEmail).trim().toLowerCase() : null;
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      throw new ApiError('Invalid business email format.', 400, 'INVALID_EMAIL');
    }
    updates.business_email = cleanEmail;
  }
  if (fields.logoUrl !== undefined) {
    updates.logo_url = fields.logoUrl ? String(fields.logoUrl).trim() : null;
  }
  if (fields.bannerUrl !== undefined) {
    updates.banner_url = fields.bannerUrl ? String(fields.bannerUrl).trim() : null;
  }

  await sellerModel.updateProfileFields(null, profile.id, updates);
  return getSellerFullProfile(userId);
}

// ----------------------------------------------------------------------
// Admin: List Applications & Review
// ----------------------------------------------------------------------

async function listApplications(adminUser, query) {
  return sellerModel.listApplications(null, query);
}

async function getApplicationDetails(adminUser, sellerId) {
  const profile = await sellerModel.getProfileById(null, sellerId);
  if (!profile) {
    throw new ApiError('Seller application not found.', 404, 'NOT_FOUND');
  }
  const address = await sellerModel.getAddressBySellerId(null, sellerId);
  const payout = await sellerModel.getPayoutBySellerId(null, sellerId);
  const kyc = await sellerModel.getLatestKycBySellerId(null, sellerId);
  const history = await sellerModel.getHistoryBySellerId(null, sellerId);

  return formatSellerProfile(profile, address, payout, kyc, history);
}

async function reviewSellerApplication(adminUser, sellerId, { action, reason, kycStatus }) {
  const cleanAction = (action || '').trim().toUpperCase();
  const validActions = ['APPROVE', 'REJECT', 'REQUEST_UPDATE', 'SUSPEND', 'UNSUSPEND', 'BLOCK'];

  if (!validActions.includes(cleanAction)) {
    throw new ApiError(`Invalid review action. Allowed: ${validActions.join(', ')}`, 400, 'INVALID_ACTION');
  }

  return withTransaction(async (conn) => {
    const profile = await sellerModel.getProfileById(conn, sellerId);
    if (!profile) {
      throw new ApiError('Seller application not found.', 404, 'NOT_FOUND');
    }

    const oldStatus = profile.seller_status;
    let targetSellerStatus = oldStatus;
    let targetKycStatus = profile.kyc_status;
    let targetUserStatus = 'ACTIVE';
    let approvedAt = profile.approved_at;

    if (cleanAction === 'APPROVE') {
      targetSellerStatus = 'APPROVED';
      targetKycStatus = 'VERIFIED';
      approvedAt = new Date();
    } else if (cleanAction === 'REJECT') {
      targetSellerStatus = 'REJECTED';
      targetKycStatus = 'REJECTED';
    } else if (cleanAction === 'REQUEST_UPDATE') {
      targetSellerStatus = 'REQUIRES_UPDATE';
      targetKycStatus = 'REQUIRES_UPDATE';
    } else if (cleanAction === 'SUSPEND') {
      targetSellerStatus = 'SUSPENDED';
      targetUserStatus = 'SUSPENDED';
    } else if (cleanAction === 'UNSUSPEND') {
      targetSellerStatus = 'APPROVED';
      targetUserStatus = 'ACTIVE';
    } else if (cleanAction === 'BLOCK') {
      targetSellerStatus = 'BLOCKED';
      targetUserStatus = 'BLOCKED';
    }

    // Update Seller Profile
    await sellerModel.updateProfileFields(conn, sellerId, {
      seller_status: targetSellerStatus,
      kyc_status: targetKycStatus,
      rejection_reason: reason || null,
      approved_at: approvedAt,
    });

    // Update Users table status if suspended/blocked/unsuspended
    if (cleanAction === 'SUSPEND' || cleanAction === 'BLOCK' || cleanAction === 'UNSUSPEND') {
      await conn.query('UPDATE users SET status = :status WHERE id = :userId', {
        status: targetUserStatus,
        userId: profile.user_id,
      });
    }

    // If latest KYC exists, review it accordingly
    const latestKyc = await sellerModel.getLatestKycBySellerId(conn, sellerId);
    if (latestKyc && (cleanAction === 'APPROVE' || cleanAction === 'REJECT' || cleanAction === 'REQUEST_UPDATE')) {
      await sellerModel.reviewKyc(conn, latestKyc.id, {
        status: targetKycStatus,
        rejectionReason: reason || null,
        reviewedBy: adminUser.id,
      });
    }

    // Log history
    await sellerModel.logHistory(conn, {
      sellerId,
      userId: profile.user_id,
      oldStatus,
      newStatus: targetSellerStatus,
      reason: reason || `Admin action: ${cleanAction}`,
      changedBy: adminUser.id,
    });

    // Send notification to seller
    let notifTitle = `Seller Application: ${targetSellerStatus}`;
    let notifMsg = `Your seller account status has been updated to ${targetSellerStatus}.`;

    if (cleanAction === 'APPROVE') {
      notifTitle = '🎉 Seller Account Approved!';
      notifMsg = 'Congratulations! Your seller application and business KYC have been approved. You can now list products and launch auctions on BidMart.';
    } else if (cleanAction === 'REJECT') {
      notifTitle = 'Seller Application Rejected';
      notifMsg = `Your seller application could not be approved: ${reason || 'Details did not meet compliance requirements.'}`;
    } else if (cleanAction === 'REQUEST_UPDATE') {
      notifTitle = 'Seller Application: Information Update Required';
      notifMsg = `Please update your seller details: ${reason || 'Additional verification required.'}`;
    } else if (cleanAction === 'SUSPEND') {
      notifTitle = 'Seller Account Suspended';
      notifMsg = `Your seller privileges have been temporarily suspended. Reason: ${reason || 'Compliance review in progress.'}`;
    }

    await notificationModel.create(conn, {
      userId: profile.user_id,
      type: `SELLER_${targetSellerStatus}`,
      title: notifTitle,
      message: notifMsg,
      metadata: { sellerId, action: cleanAction, reason },
    }).catch(() => {});

    return {
      success: true,
      sellerId,
      sellerStatus: targetSellerStatus,
      kycStatus: targetKycStatus,
      message: `Seller application updated to ${targetSellerStatus}.`,
    };
  });
}

module.exports = {
  registerSeller,
  loginSeller,
  getSellerFullProfile,
  saveOnboardingStep,
  updateStoreSettings,
  listApplications,
  getApplicationDetails,
  reviewSellerApplication,
};
