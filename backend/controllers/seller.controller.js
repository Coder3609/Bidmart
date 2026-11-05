const sellerService = require('../services/seller.service');
const { success } = require('../utils/apiResponse');

// ----------------------------------------------------------------------
// Seller Authentication & Onboarding
// ----------------------------------------------------------------------

async function register(req, res, next) {
  try {
    const { name, email, password, phone, storeName } = req.body;
    const result = await sellerService.registerSeller({
      name,
      email,
      password,
      phone,
      storeName,
    });
    return success(res, result, 'Seller account created successfully. Welcome to BidMart Seller Portal!', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await sellerService.loginSeller({ email, password });
    return success(res, result, 'Seller authenticated successfully.');
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await sellerService.getSellerFullProfile(req.user.id);
    return success(res, profile, 'Seller profile retrieved.');
  } catch (err) {
    next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const profile = await sellerService.getSellerFullProfile(req.user.id);
    return success(res, {
      id: profile.id,
      storeName: profile.storeName,
      sellerStatus: profile.sellerStatus,
      kycStatus: profile.kycStatus,
      payoutStatus: profile.payoutStatus,
      onboardingStep: profile.onboardingStep,
      isApproved: profile.isApproved,
      canSell: profile.canSell,
      rejectionReason: profile.rejectionReason,
      submittedAt: profile.submittedAt,
      approvedAt: profile.approvedAt,
      latestKyc: profile.latestKyc,
      history: profile.history,
    }, 'Seller application status retrieved.');
  } catch (err) {
    next(err);
  }
}

async function saveStep(req, res, next) {
  try {
    const { step, ...stepData } = req.body;
    const result = await sellerService.saveOnboardingStep(req.user, step, stepData);
    return success(res, result, result.message || 'Onboarding step saved.');
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const updated = await sellerService.updateStoreSettings(req.user.id, req.body);
    return success(res, updated, 'Store settings updated successfully.');
  } catch (err) {
    next(err);
  }
}

// ----------------------------------------------------------------------
// Admin Endpoints for Seller Review & Approval
// ----------------------------------------------------------------------

async function adminListApplications(req, res, next) {
  try {
    const result = await sellerService.listApplications(req.user, req.query);
    return success(res, result, 'Seller applications retrieved.');
  } catch (err) {
    next(err);
  }
}

async function adminGetApplication(req, res, next) {
  try {
    const result = await sellerService.getApplicationDetails(req.user, req.params.id);
    return success(res, result, 'Seller application details retrieved.');
  } catch (err) {
    next(err);
  }
}

async function adminReviewApplication(req, res, next) {
  try {
    const result = await sellerService.reviewSellerApplication(req.user, req.params.id, req.body);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  getStatus,
  saveStep,
  updateSettings,
  adminListApplications,
  adminGetApplication,
  adminReviewApplication,
};
