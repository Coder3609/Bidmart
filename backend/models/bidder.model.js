const { pool } = require('../config/db');

/**
 * Bidder Model
 * Manages bidder profiles, bidder verification status, and auction participation eligibility.
 */

async function getOrCreate(connOrPool, userId, defaults = {}) {
  const db = connOrPool || pool;
  const [rows] = await db.query(
    'SELECT * FROM bidder_profiles WHERE user_id = :userId LIMIT 1',
    { userId }
  );

  if (rows.length > 0) {
    return rows[0];
  }

  const displayName = defaults.displayName || defaults.name || null;
  const mobileNumber = defaults.mobileNumber || defaults.phone || null;

  await db.query(
    `INSERT INTO bidder_profiles (user_id, display_name, mobile_number, bidder_status, kyc_status)
     VALUES (:userId, :displayName, :mobileNumber, 'ACTIVE', 'NOT_STARTED')
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    { userId, displayName, mobileNumber }
  );

  const [createdRows] = await db.query(
    'SELECT * FROM bidder_profiles WHERE user_id = :userId LIMIT 1',
    { userId }
  );
  return createdRows[0];
}

async function findByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM bidder_profiles WHERE user_id = :userId LIMIT 1',
    { userId }
  );
  return rows[0] || null;
}

async function updateKycStatus(connOrPool, userId, kycStatus, verifiedAt = null) {
  const db = connOrPool || pool;
  await db.query(
    `UPDATE bidder_profiles 
     SET kyc_status = :kycStatus, 
         bidder_verified_at = :verifiedAt, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = :userId`,
    { userId, kycStatus, verifiedAt: verifiedAt ? new Date(verifiedAt) : null }
  );
}

async function updateBidderStatus(connOrPool, userId, bidderStatus) {
  const db = connOrPool || pool;
  await db.query(
    `UPDATE bidder_profiles 
     SET bidder_status = :bidderStatus, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = :userId`,
    { userId, bidderStatus }
  );
}

async function updateProfile(connOrPool, userId, { displayName, mobileNumber }) {
  const db = connOrPool || pool;
  await db.query(
    `UPDATE bidder_profiles 
     SET display_name = COALESCE(:displayName, display_name), 
         mobile_number = COALESCE(:mobileNumber, mobile_number), 
         updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = :userId`,
    { userId, displayName, mobileNumber }
  );
  return findByUserId(userId);
}

module.exports = {
  getOrCreate,
  findByUserId,
  updateKycStatus,
  updateBidderStatus,
  updateProfile,
};
