const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const assert = require('assert');
const { pool, checkConnection } = require('../config/db');
const sellerService = require('../services/seller.service');
const sellerModel = require('../models/seller.model');

async function runSellerTests() {
  console.log('==============================================================');
  console.log('--- STARTING SELLER AUTHENTICATION + ONBOARDING + KYC TESTS ---');
  console.log('==============================================================');

  await checkConnection();

  const rand = Math.floor(Math.random() * 90000) + 10000;
  const sellerEmail = `seller_corp_${rand}@testmarket.com`;
  const password = 'SellerSecurePass@123';
  const storeName = `Apex Artisans ${rand}`;

  // -------------------------------------------------------------
  // 1. SELLER REGISTRATION (Step 1: Account Creation)
  // -------------------------------------------------------------
  console.log('\n[1] Registering Seller with dedicated seller endpoint...');
  const regResult = await sellerService.registerSeller({
    name: `Master Seller ${rand}`,
    email: sellerEmail,
    password,
    phone: '9876543210',
    storeName,
  });

  assert(regResult.token, 'Registration should return JWT token');
  assert.strictEqual(regResult.user.role, 'SELLER', 'Role must strictly be SELLER');
  assert(regResult.user.seller_profile, 'Seller profile must be attached');
  assert.strictEqual(regResult.user.seller_profile.sellerStatus, 'PENDING');
  assert.strictEqual(regResult.user.seller_profile.onboardingStep, 2);
  console.log(`✔ Seller registered successfully. User ID: ${regResult.user.id}, Store: ${regResult.user.seller_profile.storeName}, Status: ${regResult.user.seller_profile.sellerStatus}`);

  // -------------------------------------------------------------
  // 2. SELLER LOGIN
  // -------------------------------------------------------------
  console.log('\n[2] Logging in as Seller...');
  const loginResult = await sellerService.loginSeller({
    email: sellerEmail,
    password,
  });

  assert(loginResult.token, 'Login should return JWT token');
  assert.strictEqual(loginResult.user.role, 'SELLER');
  assert.strictEqual(loginResult.user.seller_profile.storeName, storeName);
  console.log('✔ Seller login successful with authenticated seller profile.');

  const sellerUser = loginResult.user;

  // -------------------------------------------------------------
  // 3. VERIFY INITIAL ACCESS CHECKS
  // -------------------------------------------------------------
  console.log('\n[3] Verifying initial status access checks...');
  const initialProfile = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(initialProfile.sellerStatus, 'PENDING');
  assert.strictEqual(initialProfile.isApproved, false);
  assert.strictEqual(initialProfile.canSell, false);
  console.log('✔ Seller status correctly marked as not approved (PENDING) with canSell: false.');

  // -------------------------------------------------------------
  // 4. ONBOARDING STEP 2: Business Info
  // -------------------------------------------------------------
  console.log('\n[4] Saving Step 2: Business Information...');
  const step2Res = await sellerService.saveOnboardingStep(sellerUser, 2, {
    storeName,
    businessType: 'COMPANY',
    displayName: `Apex Artisans Brand`,
    businessDescription: 'Premier vendor for authenticated luxury watches and collectibles.',
    businessCategory: 'Collectibles & Antiques',
    businessPhone: '9876543210',
    businessEmail: sellerEmail,
    taxId: 'ABCDE1234F',
    gstin: '27ABCDE1234F1Z5',
  });

  assert(step2Res.success, 'Step 2 should succeed');
  assert.strictEqual(step2Res.nextStep, 3);
  const pAfter2 = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(pAfter2.onboardingStep, 3);
  assert.strictEqual(pAfter2.businessType, 'COMPANY');
  console.log('✔ Step 2 saved: Business details stored, onboarding_step advanced to 3.');

  // -------------------------------------------------------------
  // 5. ONBOARDING STEP 3: Business Address
  // -------------------------------------------------------------
  console.log('\n[5] Saving Step 3: Business Operating Address...');
  const step3Res = await sellerService.saveOnboardingStep(sellerUser, 3, {
    addressLine1: '402 High-Tech Park, Central Avenue',
    addressLine2: 'Phase 2, Cyber City',
    city: 'Mumbai',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    postalCode: '400076',
    country: 'India',
  });

  assert(step3Res.success, 'Step 3 should succeed');
  assert.strictEqual(step3Res.nextStep, 4);
  const pAfter3 = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(pAfter3.onboardingStep, 4);
  assert(pAfter3.address, 'Address record should be saved');
  assert.strictEqual(pAfter3.address.city, 'Mumbai');
  console.log('✔ Step 3 saved: Business address recorded.');

  // -------------------------------------------------------------
  // 6. ONBOARDING STEP 4: Payout Bank Account (Masked Security)
  // -------------------------------------------------------------
  console.log('\n[6] Saving Step 4: Payout Bank Account Details...');
  const rawAccountNumber = '1234567890123482';
  const step4Res = await sellerService.saveOnboardingStep(sellerUser, 4, {
    accountHolderName: `Apex Artisans Pvt Ltd`,
    bankName: 'HDFC Bank',
    accountNumber: rawAccountNumber,
    ifscCode: 'HDFC0001234',
  });

  assert(step4Res.success, 'Step 4 should succeed');
  assert.strictEqual(step4Res.nextStep, 5);
  const pAfter4 = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(pAfter4.onboardingStep, 5);
  assert(pAfter4.payout, 'Payout account returned');
  assert.strictEqual(pAfter4.payout.accountNumberMasked, 'XXXX XXXX 3482');
  console.log(`✔ Step 4 saved: Bank account securely masked (${pAfter4.payout.accountNumberMasked}).`);

  // -------------------------------------------------------------
  // 7. ONBOARDING STEP 5: Seller KYC Documents
  // -------------------------------------------------------------
  console.log('\n[7] Saving Step 5: Seller KYC Verification Details...');
  const rawIdNumber = '567890123456';
  const step5Res = await sellerService.saveOnboardingStep(sellerUser, 5, {
    legalName: `Apex Artisans Technologies Private Limited`,
    dobOrIncorporation: '2020-08-15',
    idType: 'AADHAAR',
    idNumber: rawIdNumber,
    documentRef: '/uploads/sellers/test_id_front.jpg',
  });

  assert(step5Res.success, 'Step 5 should succeed');
  assert.strictEqual(step5Res.nextStep, 6);
  const pAfter5 = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(pAfter5.onboardingStep, 6);
  assert(pAfter5.latestKyc, 'KYC verification record created');
  assert.strictEqual(pAfter5.latestKyc.idNumberMasked, 'XXXX-XXXX-3456');
  console.log(`✔ Step 5 saved: KYC submitted and masked (${pAfter5.latestKyc.idNumberMasked}).`);

  // -------------------------------------------------------------
  // 8. ONBOARDING STEP 6: Review & Final Submission
  // -------------------------------------------------------------
  console.log('\n[8] Submitting Step 6: Review & Final Agreement...');
  const step6Res = await sellerService.saveOnboardingStep(sellerUser, 6, {
    termsAccepted: true,
    policiesAccepted: true,
    accuracyConfirmed: true,
  });

  assert(step6Res.success, 'Step 6 should succeed');
  assert.strictEqual(step6Res.status, 'UNDER_REVIEW');
  console.log('✔ Step 6 completed! Seller status advanced to UNDER_REVIEW.');

  // Verify status profile
  const pAfter6 = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(pAfter6.sellerStatus, 'UNDER_REVIEW');
  assert.strictEqual(pAfter6.kycStatus, 'PENDING');
  assert(pAfter6.history.length > 0, 'History audit entries should exist');
  console.log(`✔ Application history recorded (${pAfter6.history.length} audit entry).`);

  // -------------------------------------------------------------
  // 9. ADMIN REVIEW: REQUEST UPDATE
  // -------------------------------------------------------------
  console.log('\n[9] Admin reviewing application -> Requesting Document Update...');
  const adminUser = { id: 1, name: 'BidMart Super Admin', email: 'admin@bidmart.com', role: 'ADMIN' };

  const reqUpdateRes = await sellerService.reviewSellerApplication(
    adminUser,
    sellerUser.seller_profile.id,
    {
      action: 'REQUEST_UPDATE',
      reason: 'Please provide higher resolution copy of the registration document.',
    }
  );

  assert.strictEqual(reqUpdateRes.sellerStatus, 'REQUIRES_UPDATE');
  console.log('✔ Admin updated status to REQUIRES_UPDATE with feedback notes.');

  // Check seller status now
  const pAfterReq = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(pAfterReq.sellerStatus, 'REQUIRES_UPDATE');
  assert.strictEqual(pAfterReq.latestKyc.status, 'REQUIRES_UPDATE');

  // -------------------------------------------------------------
  // 10. SELLER RE-SUBMITS UPDATED KYC DOCS
  // -------------------------------------------------------------
  console.log('\n[10] Seller re-submits updated documents (Step 5 -> Step 6)...');
  await sellerService.saveOnboardingStep(sellerUser, 5, {
    legalName: `Apex Artisans Technologies Private Limited`,
    dobOrIncorporation: '2020-08-15',
    idType: 'AADHAAR',
    idNumber: rawIdNumber,
    documentRef: '/uploads/sellers/high_res_incorporation.pdf',
  });

  const resubmitted = await sellerService.saveOnboardingStep(sellerUser, 6, {
    termsAccepted: true,
    policiesAccepted: true,
    accuracyConfirmed: true,
  });

  assert.strictEqual(resubmitted.status, 'UNDER_REVIEW');
  console.log('✔ Seller re-submitted application -> Status returned to UNDER_REVIEW.');

  // -------------------------------------------------------------
  // 11. ADMIN APPROVES SELLER APPLICATION
  // -------------------------------------------------------------
  console.log('\n[11] Admin reviewing application -> Approving Seller...');
  const approveRes = await sellerService.reviewSellerApplication(
    adminUser,
    sellerUser.seller_profile.id,
    {
      action: 'APPROVE',
      reason: 'All business and KYC credentials verified successfully.',
    }
  );

  assert.strictEqual(approveRes.sellerStatus, 'APPROVED');
  assert.strictEqual(approveRes.kycStatus, 'VERIFIED');
  console.log('✔ Seller APPROVED! KYC status is VERIFIED.');

  // Verify full seller profile
  const fullProfile = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(fullProfile.sellerStatus, 'APPROVED');
  assert.strictEqual(fullProfile.kycStatus, 'VERIFIED');
  assert.strictEqual(fullProfile.isApproved, true);
  assert.strictEqual(fullProfile.canSell, true);
  console.log('✔ Profile checks passed: canSell = true, isApproved = true, sellerStatus = APPROVED.');

  // -------------------------------------------------------------
  // 12. SELLER SUSPENSION WORKFLOW
  // -------------------------------------------------------------
  console.log('\n[12] Testing Admin Suspension workflow...');
  const suspendRes = await sellerService.reviewSellerApplication(
    adminUser,
    sellerUser.seller_profile.id,
    {
      action: 'SUSPEND',
      reason: 'Account suspended pending policy compliance review.',
    }
  );

  assert.strictEqual(suspendRes.sellerStatus, 'SUSPENDED');
  const suspendedProfile = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(suspendedProfile.canSell, false);
  console.log('✔ Seller SUSPENDED: canSell set to false, status is SUSPENDED.');

  // Reactivate for final healthy state
  console.log('\n[13] Reactivating Seller to APPROVED...');
  const reactivateRes = await sellerService.reviewSellerApplication(
    adminUser,
    sellerUser.seller_profile.id,
    {
      action: 'UNSUSPEND',
      reason: 'Account reinstated after compliance review.',
    }
  );
  assert.strictEqual(reactivateRes.sellerStatus, 'APPROVED');
  const reinstatedProfile = await sellerService.getSellerFullProfile(sellerUser.id);
  assert.strictEqual(reinstatedProfile.canSell, true);
  console.log('✔ Seller reinstated to APPROVED with canSell = true.');

  console.log('\n==============================================================');
  console.log('ALL SELLER AUTHENTICATION + ONBOARDING + KYC TESTS PASSED! ✔');
  console.log('==============================================================\n');
  process.exit(0);
}

runSellerTests().catch((err) => {
  console.error('\n✘ SELLER TEST FAILURE:', err);
  process.exit(1);
});
