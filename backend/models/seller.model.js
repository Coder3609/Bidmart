const { pool } = require('../config/db');

/**
 * Seller Model — Data layer for Seller Profiles, Addresses, Payout Accounts,
 * KYC Verifications, and Application Status Audit History.
 */

// Helper to get active pool or transaction connection
function db(conn) {
  return conn || pool;
}

// ----------------------------------------------------------------------
// Seller Profiles
// ----------------------------------------------------------------------

async function getProfileByUserId(conn, userId) {
  const [rows] = await db(conn).query(
    `SELECT sp.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.status AS user_status
     FROM seller_profiles sp
     JOIN users u ON sp.user_id = u.id
     WHERE sp.user_id = :userId
     LIMIT 1`,
    { userId }
  );
  return rows[0] || null;
}

async function getProfileById(conn, sellerId) {
  const [rows] = await db(conn).query(
    `SELECT sp.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.status AS user_status
     FROM seller_profiles sp
     JOIN users u ON sp.user_id = u.id
     WHERE sp.id = :sellerId
     LIMIT 1`,
    { sellerId }
  );
  return rows[0] || null;
}

async function createProfile(conn, {
  userId,
  storeName,
  businessType = 'INDIVIDUAL',
  displayName = null,
  businessDescription = null,
  businessCategory = null,
  businessPhone = null,
  businessEmail = null,
  sellerStatus = 'PENDING',
  kycStatus = 'NOT_STARTED',
  onboardingStep = 1,
}) {
  const [result] = await db(conn).query(
    `INSERT INTO seller_profiles (
       user_id, store_name, business_type, display_name,
       business_description, business_category, business_phone,
       business_email, seller_status, kyc_status, onboarding_step
     ) VALUES (
       :userId, :storeName, :businessType, :displayName,
       :businessDescription, :businessCategory, :businessPhone,
       :businessEmail, :sellerStatus, :kycStatus, :onboardingStep
     )`,
    {
      userId,
      storeName,
      businessType,
      displayName,
      businessDescription,
      businessCategory,
      businessPhone,
      businessEmail,
      sellerStatus,
      kycStatus,
      onboardingStep,
    }
  );
  return getProfileById(conn, result.insertId);
}

async function getOrCreateProfile(conn, userId, fallback = {}) {
  let profile = await getProfileByUserId(conn, userId);
  if (!profile) {
    const storeName = fallback.storeName || fallback.displayName || `Store-${userId}`;
    profile = await createProfile(conn, {
      userId,
      storeName,
      businessType: fallback.businessType || 'INDIVIDUAL',
      displayName: fallback.displayName || null,
      businessPhone: fallback.businessPhone || null,
      businessEmail: fallback.businessEmail || null,
      onboardingStep: 1,
    });
  }
  return profile;
}

async function updateProfileFields(conn, sellerId, fields) {
  const allowed = [
    'store_name', 'business_type', 'display_name', 'business_description',
    'business_category', 'business_phone', 'business_email', 'logo_url',
    'banner_url', 'seller_status', 'kyc_status', 'payout_status',
    'onboarding_step', 'tax_id', 'gstin', 'terms_accepted',
    'policies_accepted', 'accuracy_confirmed', 'submitted_at',
    'approved_at', 'rejection_reason',
  ];

  const setClauses = [];
  const params = { sellerId };

  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key) || value === undefined) continue;
    setClauses.push(`${key} = :${key}`);
    params[key] = value === '' ? null : value;
  }

  if (setClauses.length === 0) return getProfileById(conn, sellerId);

  await db(conn).query(
    `UPDATE seller_profiles SET ${setClauses.join(', ')} WHERE id = :sellerId`,
    params
  );
  return getProfileById(conn, sellerId);
}

// ----------------------------------------------------------------------
// Seller Address
// ----------------------------------------------------------------------

async function getAddressBySellerId(conn, sellerId) {
  const [rows] = await db(conn).query(
    `SELECT * FROM seller_addresses WHERE seller_id = :sellerId ORDER BY id DESC LIMIT 1`,
    { sellerId }
  );
  return rows[0] || null;
}

async function upsertAddress(conn, {
  sellerId,
  userId,
  addressLine1,
  addressLine2 = null,
  city,
  state,
  district = null,
  postalCode,
  country = 'India',
}) {
  const existing = await getAddressBySellerId(conn, sellerId);
  if (existing) {
    await db(conn).query(
      `UPDATE seller_addresses SET
         address_line1 = :addressLine1,
         address_line2 = :addressLine2,
         city = :city,
         state = :state,
         district = :district,
         postal_code = :postalCode,
         country = :country
       WHERE id = :id`,
      {
        id: existing.id,
        addressLine1,
        addressLine2,
        city,
        state,
        district,
        postalCode,
        country,
      }
    );
    return getAddressBySellerId(conn, sellerId);
  }

  const [result] = await db(conn).query(
    `INSERT INTO seller_addresses (
       seller_id, user_id, address_line1, address_line2,
       city, state, district, postal_code, country
     ) VALUES (
       :sellerId, :userId, :addressLine1, :addressLine2,
       :city, :state, :district, :postalCode, :country
     )`,
    {
      sellerId,
      userId,
      addressLine1,
      addressLine2,
      city,
      state,
      district,
      postalCode,
      country,
    }
  );
  const [rows] = await db(conn).query(
    `SELECT * FROM seller_addresses WHERE id = :id`,
    { id: result.insertId }
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Seller Payout Accounts (Masked Bank Security)
// ----------------------------------------------------------------------

async function getPayoutBySellerId(conn, sellerId) {
  const [rows] = await db(conn).query(
    `SELECT id, seller_id, user_id, account_holder_name, bank_name,
            account_number_masked, ifsc_code, is_verified, created_at, updated_at
     FROM seller_payout_accounts
     WHERE seller_id = :sellerId
     ORDER BY id DESC LIMIT 1`,
    { sellerId }
  );
  return rows[0] || null;
}

async function upsertPayout(conn, {
  sellerId,
  userId,
  accountHolderName,
  bankName,
  accountNumberMasked,
  accountNumberHash = null,
  ifscCode,
  isVerified = 0,
}) {
  const existing = await getPayoutBySellerId(conn, sellerId);
  if (existing) {
    await db(conn).query(
      `UPDATE seller_payout_accounts SET
         account_holder_name = :accountHolderName,
         bank_name = :bankName,
         account_number_masked = :accountNumberMasked,
         account_number_hash = :accountNumberHash,
         ifsc_code = :ifscCode,
         is_verified = :isVerified
       WHERE id = :id`,
      {
        id: existing.id,
        accountHolderName,
        bankName,
        accountNumberMasked,
        accountNumberHash,
        ifscCode,
        isVerified,
      }
    );
    return getPayoutBySellerId(conn, sellerId);
  }

  const [result] = await db(conn).query(
    `INSERT INTO seller_payout_accounts (
       seller_id, user_id, account_holder_name, bank_name,
       account_number_masked, account_number_hash, ifsc_code, is_verified
     ) VALUES (
       :sellerId, :userId, :accountHolderName, :bankName,
       :accountNumberMasked, :accountNumberHash, :ifscCode, :isVerified
     )`,
    {
      sellerId,
      userId,
      accountHolderName,
      bankName,
      accountNumberMasked,
      accountNumberHash,
      ifscCode,
      isVerified,
    }
  );
  return getPayoutBySellerId(conn, sellerId);
}

// ----------------------------------------------------------------------
// Seller KYC Verifications
// ----------------------------------------------------------------------

async function getLatestKycBySellerId(conn, sellerId) {
  const [rows] = await db(conn).query(
    `SELECT id, seller_id, user_id, legal_name, dob_or_incorporation,
            id_type, id_number_masked, document_ref, status, rejection_reason,
            reviewed_by, submitted_at, reviewed_at, created_at, updated_at
     FROM seller_kyc_verifications
     WHERE seller_id = :sellerId
     ORDER BY id DESC LIMIT 1`,
    { sellerId }
  );
  return rows[0] || null;
}

async function createKyc(conn, {
  sellerId,
  userId,
  legalName,
  dobOrIncorporation = null,
  idType,
  idNumberMasked,
  documentRef = null,
  status = 'PENDING',
}) {
  const [result] = await db(conn).query(
    `INSERT INTO seller_kyc_verifications (
       seller_id, user_id, legal_name, dob_or_incorporation,
       id_type, id_number_masked, document_ref, status
     ) VALUES (
       :sellerId, :userId, :legalName, :dobOrIncorporation,
       :idType, :idNumberMasked, :documentRef, :status
     )`,
    {
      sellerId,
      userId,
      legalName,
      dobOrIncorporation,
      idType,
      idNumberMasked,
      documentRef,
      status,
    }
  );
  const [rows] = await db(conn).query(
    `SELECT * FROM seller_kyc_verifications WHERE id = :id`,
    { id: result.insertId }
  );
  return rows[0];
}

async function reviewKyc(conn, kycId, { status, rejectionReason = null, reviewedBy = null }) {
  await db(conn).query(
    `UPDATE seller_kyc_verifications SET
       status = :status,
       rejection_reason = :rejectionReason,
       reviewed_by = :reviewedBy,
       reviewed_at = CURRENT_TIMESTAMP
     WHERE id = :kycId`,
    { kycId, status, rejectionReason, reviewedBy }
  );
  const [rows] = await db(conn).query(
    `SELECT * FROM seller_kyc_verifications WHERE id = :kycId`,
    { kycId }
  );
  return rows[0];
}

// ----------------------------------------------------------------------
// Seller Application History (Audit log)
// ----------------------------------------------------------------------

async function logHistory(conn, { sellerId, userId, oldStatus, newStatus, reason = null, changedBy = null }) {
  const [result] = await db(conn).query(
    `INSERT INTO seller_application_history (
       seller_id, user_id, old_status, new_status, reason, changed_by
     ) VALUES (
       :sellerId, :userId, :oldStatus, :newStatus, :reason, :changedBy
     )`,
    { sellerId, userId, oldStatus, newStatus, reason, changedBy }
  );
  return result.insertId;
}

async function getHistoryBySellerId(conn, sellerId) {
  const [rows] = await db(conn).query(
    `SELECT sah.*, u.name AS changed_by_name
     FROM seller_application_history sah
     LEFT JOIN users u ON sah.changed_by = u.id
     WHERE sah.seller_id = :sellerId
     ORDER BY sah.id DESC`,
    { sellerId }
  );
  return rows;
}

// ----------------------------------------------------------------------
// Admin Queries — List Applications with Filters & Pagination
// ----------------------------------------------------------------------

async function listApplications(conn, {
  status,
  kycStatus,
  search,
  page = 1,
  limit = 20,
} = {}) {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const conditions = [];
  const params = { limit: Number(limit), offset: Number(offset) };

  if (status) {
    conditions.push('sp.seller_status = :status');
    params.status = status;
  }
  if (kycStatus) {
    conditions.push('sp.kyc_status = :kycStatus');
    params.kycStatus = kycStatus;
  }
  if (search) {
    conditions.push('(sp.store_name LIKE :q OR u.name LIKE :q OR u.email LIKE :q)');
    params.q = `%${search}%`;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await db(conn).query(
    `SELECT COUNT(*) AS total
     FROM seller_profiles sp
     JOIN users u ON sp.user_id = u.id
     ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await db(conn).query(
    `SELECT sp.*, u.name AS seller_name, u.email AS seller_email, u.phone AS seller_phone,
            sa.city AS address_city, sa.state AS address_state, sa.postal_code,
            spa.account_number_masked, spa.bank_name, spa.ifsc_code,
            skyc.id_type AS kyc_id_type, skyc.id_number_masked AS kyc_id_masked,
            skyc.status AS kyc_verification_status, skyc.document_ref AS kyc_doc_ref
     FROM seller_profiles sp
     JOIN users u ON sp.user_id = u.id
     LEFT JOIN seller_addresses sa ON sa.seller_id = sp.id
     LEFT JOIN seller_payout_accounts spa ON spa.seller_id = sp.id
     LEFT JOIN seller_kyc_verifications skyc ON skyc.id = (
       SELECT MAX(id) FROM seller_kyc_verifications WHERE seller_id = sp.id
     )
     ${whereClause}
     ORDER BY sp.updated_at DESC
     LIMIT :limit OFFSET :offset`,
    params
  );

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
    applications: rows,
  };
}

module.exports = {
  getProfileByUserId,
  getProfileById,
  createProfile,
  getOrCreateProfile,
  updateProfileFields,
  getAddressBySellerId,
  upsertAddress,
  getPayoutBySellerId,
  upsertPayout,
  getLatestKycBySellerId,
  createKyc,
  reviewKyc,
  logHistory,
  getHistoryBySellerId,
  listApplications,
};
