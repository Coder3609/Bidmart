-- =====================================================================
-- MIGRATION 005 — Seller Authentication, Profiles, KYC & Payout System
-- Adds:
--   1. seller_profiles (Store identity, business info, tax identifiers, seller & KYC status)
--   2. seller_addresses (Business registered address & dispatch location)
--   3. seller_payout_accounts (Secure banking/payout details with masked account storage)
--   4. seller_kyc_verifications (Seller identity & business document verification records)
--   5. seller_application_history (Audit trail for seller review & state transitions)
-- =====================================================================

USE marketplace_db;

-- 1. Seller Profiles
CREATE TABLE IF NOT EXISTS seller_profiles (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id                 BIGINT UNSIGNED NOT NULL,
  store_name              VARCHAR(190) NOT NULL,
  business_type           ENUM('INDIVIDUAL','SOLE_PROPRIETORSHIP','PARTNERSHIP','COMPANY','OTHER') NOT NULL DEFAULT 'INDIVIDUAL',
  display_name            VARCHAR(120) NULL,
  business_description    TEXT NULL,
  business_category       VARCHAR(100) NULL,
  business_phone          VARCHAR(20) NULL,
  business_email          VARCHAR(190) NULL,
  logo_url                VARCHAR(255) NULL,
  banner_url              VARCHAR(255) NULL,
  seller_status           ENUM('PENDING','UNDER_REVIEW','APPROVED','REJECTED','REQUIRES_UPDATE','SUSPENDED','BLOCKED') NOT NULL DEFAULT 'PENDING',
  kyc_status              ENUM('NOT_STARTED','IN_PROGRESS','PENDING','VERIFIED','REJECTED','REQUIRES_UPDATE') NOT NULL DEFAULT 'NOT_STARTED',
  payout_status           ENUM('NOT_CONFIGURED','PENDING','VERIFIED') NOT NULL DEFAULT 'NOT_CONFIGURED',
  onboarding_step         INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Current onboarding step 1-6',
  tax_id                  VARCHAR(50) NULL COMMENT 'PAN or National Tax Identifier',
  gstin                   VARCHAR(50) NULL COMMENT 'GSTIN for Indian Registered Businesses',
  terms_accepted          TINYINT(1) NOT NULL DEFAULT 0,
  policies_accepted       TINYINT(1) NOT NULL DEFAULT 0,
  accuracy_confirmed      TINYINT(1) NOT NULL DEFAULT 0,
  submitted_at            TIMESTAMP NULL,
  approved_at             TIMESTAMP NULL,
  rejection_reason        VARCHAR(255) NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sp_user (user_id),
  KEY idx_sp_status (seller_status),
  KEY idx_sp_kyc (kyc_status),
  CONSTRAINT fk_sp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Dedicated seller profiles with onboarding progress and verification states.';

-- 2. Seller Addresses
CREATE TABLE IF NOT EXISTS seller_addresses (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id               BIGINT UNSIGNED NOT NULL,
  user_id                 BIGINT UNSIGNED NOT NULL,
  address_line1           VARCHAR(255) NOT NULL,
  address_line2           VARCHAR(255) NULL,
  city                    VARCHAR(100) NOT NULL,
  state                   VARCHAR(100) NOT NULL,
  district                VARCHAR(100) NULL,
  postal_code             VARCHAR(20) NOT NULL,
  country                 VARCHAR(100) NOT NULL DEFAULT 'India',
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sa_seller (seller_id),
  KEY idx_sa_user (user_id),
  CONSTRAINT fk_sa_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Registered business & pickup addresses for sellers.';

-- 3. Seller Payout Accounts (Masked bank details)
CREATE TABLE IF NOT EXISTS seller_payout_accounts (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id               BIGINT UNSIGNED NOT NULL,
  user_id                 BIGINT UNSIGNED NOT NULL,
  account_holder_name     VARCHAR(190) NOT NULL,
  bank_name               VARCHAR(100) NOT NULL,
  account_number_masked   VARCHAR(50) NOT NULL COMMENT 'Masked representation, e.g. XXXX XXXX 4821',
  account_number_hash     VARCHAR(255) NULL COMMENT 'Hash/tokenized reference for duplicate checks',
  ifsc_code               VARCHAR(20) NOT NULL,
  is_verified             TINYINT(1) NOT NULL DEFAULT 0,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_spa_seller (seller_id),
  KEY idx_spa_user (user_id),
  CONSTRAINT fk_spa_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_spa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Seller payout destinations with masked account security.';

-- 4. Seller KYC Verifications
CREATE TABLE IF NOT EXISTS seller_kyc_verifications (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id               BIGINT UNSIGNED NOT NULL,
  user_id                 BIGINT UNSIGNED NOT NULL,
  legal_name              VARCHAR(190) NOT NULL,
  dob_or_incorporation    DATE NULL,
  id_type                 ENUM('AADHAAR','PAN','PASSPORT','DRIVING_LICENSE','VOTER_ID','GSTIN_CERTIFICATE','COMPANY_PAN','BUSINESS_REGISTRATION') NOT NULL,
  id_number_masked        VARCHAR(50) NOT NULL,
  document_ref            VARCHAR(255) NULL,
  status                  ENUM('PENDING','VERIFIED','REJECTED','REQUIRES_UPDATE') NOT NULL DEFAULT 'PENDING',
  rejection_reason        VARCHAR(255) NULL,
  reviewed_by             BIGINT UNSIGNED NULL,
  submitted_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at             TIMESTAMP NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_skyc_seller (seller_id),
  KEY idx_skyc_user (user_id),
  KEY idx_skyc_status (status),
  CONSTRAINT fk_skyc_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_skyc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_skyc_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Seller identity and business KYC verification records.';

-- 5. Seller Application & Status Audit History
CREATE TABLE IF NOT EXISTS seller_application_history (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id               BIGINT UNSIGNED NOT NULL,
  user_id                 BIGINT UNSIGNED NOT NULL,
  old_status              VARCHAR(50) NULL,
  new_status              VARCHAR(50) NOT NULL,
  reason                  VARCHAR(255) NULL,
  changed_by              BIGINT UNSIGNED NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sah_seller (seller_id),
  KEY idx_sah_user (user_id),
  CONSTRAINT fk_sah_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_sah_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sah_changer FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Audit log of all seller application state changes.';
