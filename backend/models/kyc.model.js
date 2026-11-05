const { pool } = require('../config/db');

/**
 * KYC Model
 * Handles identity verification records and audit history.
 * Important: Always stores masked IDs (e.g. XXXX-XXXX-1234) and never exposes sensitive credentials.
 */

async function create(connOrPool, {
  userId,
  bidderId,
  fullLegalName,
  dateOfBirth,
  mobileNumber,
  addressLine,
  city,
  state,
  postalCode,
  idType,
  idNumberMasked,
  documentRef,
}) {
  const db = connOrPool || pool;
  const [res] = await db.query(
    `INSERT INTO kyc_verifications (
      user_id, bidder_id, full_legal_name, date_of_birth, mobile_number,
      address_line, city, state, postal_code, id_type, id_number_masked, document_ref, status
    ) VALUES (
      :userId, :bidderId, :fullLegalName, :dateOfBirth, :mobileNumber,
      :addressLine, :city, :state, :postalCode, :idType, :idNumberMasked, :documentRef, 'PENDING'
    )`,
    {
      userId,
      bidderId,
      fullLegalName,
      dateOfBirth: dateOfBirth || null,
      mobileNumber: mobileNumber || null,
      addressLine: addressLine || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      idType,
      idNumberMasked,
      documentRef: documentRef || null,
    }
  );

  return res.insertId;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM kyc_verifications WHERE id = :id LIMIT 1',
    { id }
  );
  return rows[0] || null;
}

async function findLatestByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT k.*, u.name as user_name, u.email as user_email
     FROM kyc_verifications k
     JOIN users u ON k.user_id = u.id
     WHERE k.user_id = :userId
     ORDER BY k.id DESC LIMIT 1`,
    { userId }
  );
  return rows[0] || null;
}

async function findHistoryByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT h.*, u.name as changed_by_name
     FROM kyc_verification_history h
     LEFT JOIN users u ON h.changed_by = u.id
     WHERE h.user_id = :userId
     ORDER BY h.id DESC`,
    { userId }
  );
  return rows;
}

async function listPending({ page = 1, limit = 20 } = {}) {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [rows] = await pool.query(
    `SELECT k.*, u.name as user_name, u.email as user_email, bp.bidder_status
     FROM kyc_verifications k
     JOIN users u ON k.user_id = u.id
     JOIN bidder_profiles bp ON k.bidder_id = bp.id
     WHERE k.status = 'PENDING'
     ORDER BY k.submitted_at ASC
     LIMIT :limit OFFSET :offset`,
    { limit: Number(limit), offset }
  );

  const [countRows] = await pool.query(
    "SELECT COUNT(*) as total FROM kyc_verifications WHERE status = 'PENDING'"
  );

  return {
    items: rows,
    total: countRows[0].total,
    page: Number(page),
    limit: Number(limit),
  };
}

async function review(connOrPool, id, { status, rejectionReason, reviewedBy }) {
  const db = connOrPool || pool;
  await db.query(
    `UPDATE kyc_verifications 
     SET status = :status, 
         rejection_reason = :rejectionReason, 
         reviewed_by = :reviewedBy, 
         reviewed_at = CURRENT_TIMESTAMP, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = :id`,
    {
      id,
      status,
      rejectionReason: rejectionReason || null,
      reviewedBy: reviewedBy || null,
    }
  );
  return findById(id);
}

async function logHistory(connOrPool, { kycId, userId, oldStatus, newStatus, reason, changedBy }) {
  const db = connOrPool || pool;
  await db.query(
    `INSERT INTO kyc_verification_history (
      kyc_id, user_id, old_status, new_status, reason, changed_by
    ) VALUES (
      :kycId, :userId, :oldStatus, :newStatus, :reason, :changedBy
    )`,
    {
      kycId,
      userId,
      oldStatus: oldStatus || null,
      newStatus,
      reason: reason || null,
      changedBy: changedBy || null,
    }
  );
}

module.exports = {
  create,
  findById,
  findLatestByUserId,
  findHistoryByUserId,
  listPending,
  review,
  logHistory,
};
