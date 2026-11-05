-- Migration 004: Bidder Profiles and KYC Verification System
-- Run via ensureMigrations() in db.js or via MySQL CLI

CREATE TABLE IF NOT EXISTS bidder_profiles (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT UNSIGNED NOT NULL,
  display_name        VARCHAR(120) NULL,
  mobile_number       VARCHAR(20) NULL,
  bidder_status       ENUM('PENDING','ACTIVE','SUSPENDED','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  kyc_status          ENUM('NOT_STARTED','PENDING','VERIFIED','REJECTED','REQUIRES_UPDATE') NOT NULL DEFAULT 'NOT_STARTED',
  bidder_verified_at  TIMESTAMP NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bidder_user (user_id),
  KEY idx_bidder_status (bidder_status),
  KEY idx_bidder_kyc (kyc_status),
  CONSTRAINT fk_bp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Dedicated bidder account status & KYC eligibility for auction participation.';

CREATE TABLE IF NOT EXISTS kyc_verifications (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT UNSIGNED NOT NULL,
  bidder_id           BIGINT UNSIGNED NOT NULL,
  full_legal_name     VARCHAR(190) NOT NULL,
  date_of_birth       DATE NULL,
  mobile_number       VARCHAR(20) NULL,
  address_line        VARCHAR(255) NULL,
  city                VARCHAR(100) NULL,
  state               VARCHAR(100) NULL,
  postal_code         VARCHAR(20) NULL,
  id_type             ENUM('AADHAAR','PAN','PASSPORT','DRIVING_LICENSE','VOTER_ID','NATIONAL_ID') NOT NULL,
  id_number_masked    VARCHAR(50) NOT NULL,
  document_ref        VARCHAR(255) NULL,
  status              ENUM('PENDING','VERIFIED','REJECTED','REQUIRES_UPDATE') NOT NULL DEFAULT 'PENDING',
  rejection_reason    VARCHAR(255) NULL,
  submitted_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at         TIMESTAMP NULL,
  reviewed_by         BIGINT UNSIGNED NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_kyc_user (user_id),
  KEY idx_kyc_bidder (bidder_id),
  KEY idx_kyc_status (status),
  CONSTRAINT fk_kyc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_kyc_bidder FOREIGN KEY (bidder_id) REFERENCES bidder_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_kyc_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Secure KYC verification records with masked IDs.';

CREATE TABLE IF NOT EXISTS kyc_verification_history (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kyc_id              BIGINT UNSIGNED NOT NULL,
  user_id             BIGINT UNSIGNED NOT NULL,
  old_status          VARCHAR(50) NULL,
  new_status          VARCHAR(50) NOT NULL,
  reason              VARCHAR(255) NULL,
  changed_by          BIGINT UNSIGNED NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_kyc_hist_kyc (kyc_id),
  KEY idx_kyc_hist_user (user_id),
  CONSTRAINT fk_kyc_hist_kyc FOREIGN KEY (kyc_id) REFERENCES kyc_verifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_kyc_hist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_kyc_hist_changer FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Audit trail of all KYC state transitions.';
