const bidderModel = require('../models/bidder.model');
const kycModel = require('../models/kyc.model');
const notificationModel = require('../models/notification.model');
const { ApiError } = require('../utils/apiResponse');
const { withTransaction } = require('../config/db');

const ALLOWED_ID_TYPES = ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'NATIONAL_ID'];

/**
 * Mask an ID number to keep only the last 4 characters visible.
 * Example: "123456789012" -> "XXXX-XXXX-9012" or "ABCDE1234F" -> "XXXXXX234F"
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

async function getKycStatus(userId) {
  const bidder = await bidderModel.getOrCreate(null, userId);
  const latestVerification = await kycModel.findLatestByUserId(userId);
  const history = await kycModel.findHistoryByUserId(userId);

  const isEligibleToBid = bidder.bidder_status === 'ACTIVE' && bidder.kyc_status === 'VERIFIED';

  return {
    bidderId: `BM-BID-${String(bidder.id).padStart(6, '0')}`,
    bidderProfileId: bidder.id,
    bidderStatus: bidder.bidder_status,
    kycStatus: bidder.kyc_status,
    verifiedAt: bidder.bidder_verified_at,
    isEligibleToBid,
    latestVerification: latestVerification ? {
      id: latestVerification.id,
      fullLegalName: latestVerification.full_legal_name,
      idType: latestVerification.id_type,
      idNumberMasked: latestVerification.id_number_masked,
      status: latestVerification.status,
      rejectionReason: latestVerification.rejection_reason,
      submittedAt: latestVerification.submitted_at,
      reviewedAt: latestVerification.reviewed_at,
    } : null,
    historyCount: history.length,
  };
}

async function submitKyc(user, payload) {
  const {
    fullLegalName,
    dateOfBirth,
    mobileNumber,
    addressLine,
    city,
    state,
    postalCode,
    idType,
    idNumber,
    documentRef,
  } = payload;

  const cleanName = (fullLegalName || '').trim();
  if (!cleanName || cleanName.length < 3) {
    throw new ApiError('Please provide your full legal name as per official government ID.', 400, 'INVALID_NAME');
  }

  const cleanType = (idType || '').trim().toUpperCase();
  if (!ALLOWED_ID_TYPES.includes(cleanType)) {
    throw new ApiError(`Invalid ID type. Allowed: ${ALLOWED_ID_TYPES.join(', ')}`, 400, 'INVALID_ID_TYPE');
  }

  const cleanIdNumber = (idNumber || '').replace(/\s|-/g, '').trim();
  if (!cleanIdNumber || cleanIdNumber.length < 4) {
    throw new ApiError('Please enter a valid government identity number.', 400, 'INVALID_ID_NUMBER');
  }

  const maskedId = maskIdNumber(cleanIdNumber, cleanType);

  return withTransaction(async (conn) => {
    const bidder = await bidderModel.getOrCreate(conn, user.id, {
      displayName: user.name,
      mobileNumber: user.phone,
    });

    if (bidder.kyc_status === 'VERIFIED') {
      throw new ApiError('Your bidder account is already verified.', 409, 'ALREADY_VERIFIED');
    }

    const oldStatus = bidder.kyc_status;

    // Insert verification record
    const kycId = await kycModel.create(conn, {
      userId: user.id,
      bidderId: bidder.id,
      fullLegalName: cleanName,
      dateOfBirth: dateOfBirth || null,
      mobileNumber: mobileNumber || user.phone || null,
      addressLine: addressLine || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      idType: cleanType,
      idNumberMasked: maskedId,
      documentRef: documentRef || null,
    });

    // Update bidder status to PENDING
    await bidderModel.updateKycStatus(conn, user.id, 'PENDING', null);

    // Audit history
    await kycModel.logHistory(conn, {
      kycId,
      userId: user.id,
      oldStatus,
      newStatus: 'PENDING',
      reason: 'KYC documents submitted by bidder',
      changedBy: user.id,
    });

    // Notification to user
    await notificationModel.create(conn, {
      userId: user.id,
      type: 'KYC_SUBMITTED',
      title: 'KYC verification submitted',
      message: 'Your identity documents have been submitted and are under review.',
      metadata: { kycId },
    });

    return {
      success: true,
      kycId,
      kycStatus: 'PENDING',
      message: 'KYC submitted successfully and is now pending review.',
    };
  });
}

async function getKycHistory(userId) {
  const history = await kycModel.findHistoryByUserId(userId);
  return history.map(h => ({
    id: h.id,
    oldStatus: h.old_status,
    newStatus: h.new_status,
    reason: h.reason,
    changedByName: h.changed_by_name || 'System / Admin',
    createdAt: h.created_at,
  }));
}

async function listPending(query) {
  return kycModel.listPending(query);
}

async function reviewKyc(reviewerUser, kycId, { status, reason }) {
  const targetStatus = (status || '').trim().toUpperCase();
  if (!['VERIFIED', 'REJECTED', 'REQUIRES_UPDATE'].includes(targetStatus)) {
    throw new ApiError('Invalid review status. Must be VERIFIED, REJECTED, or REQUIRES_UPDATE.', 400, 'INVALID_STATUS');
  }

  return withTransaction(async (conn) => {
    const kyc = await kycModel.findById(kycId);
    if (!kyc) {
      throw new ApiError('KYC record not found.', 404, 'KYC_NOT_FOUND');
    }

    const oldStatus = kyc.status;
    const verifiedAt = targetStatus === 'VERIFIED' ? new Date() : null;

    await kycModel.review(conn, kycId, {
      status: targetStatus,
      rejectionReason: reason || null,
      reviewedBy: reviewerUser.id,
    });

    await bidderModel.updateKycStatus(conn, kyc.user_id, targetStatus, verifiedAt);

    await kycModel.logHistory(conn, {
      kycId,
      userId: kyc.user_id,
      oldStatus,
      newStatus: targetStatus,
      reason: reason || (targetStatus === 'VERIFIED' ? 'Identity verification approved' : 'Verification rejected/requires update'),
      changedBy: reviewerUser.id,
    });

    let notifTitle = 'KYC Status Update';
    let notifMsg = `Your KYC verification status is now ${targetStatus}.`;

    if (targetStatus === 'VERIFIED') {
      notifTitle = 'KYC Verified!';
      notifMsg = 'Your bidder account has been verified. You are now eligible to place live auction bids.';
    } else if (targetStatus === 'REJECTED') {
      notifTitle = 'KYC Verification Rejected';
      notifMsg = `Your KYC verification was rejected: ${reason || 'Please provide valid government credentials.'}`;
    } else if (targetStatus === 'REQUIRES_UPDATE') {
      notifTitle = 'KYC Requires Update';
      notifMsg = `Please update your KYC information: ${reason || 'Additional identity details required.'}`;
    }

    await notificationModel.create(conn, {
      userId: kyc.user_id,
      type: `KYC_${targetStatus}`,
      title: notifTitle,
      message: notifMsg,
      metadata: { kycId, status: targetStatus, reason },
    });

    return {
      success: true,
      kycId,
      status: targetStatus,
      message: `KYC status updated to ${targetStatus}.`,
    };
  });
}

module.exports = {
  getKycStatus,
  submitKyc,
  getKycHistory,
  listPending,
  reviewKyc,
};
