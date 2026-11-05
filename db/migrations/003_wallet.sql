-- Migration 003: Wallet system
-- Run via ensureMigrations() in db.js

CREATE TABLE IF NOT EXISTS wallet_balances (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  total_balance     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  reserved_balance  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wallet_user (user_id),
  CONSTRAINT fk_wb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_wallet_nonneg CHECK (total_balance >= 0 AND reserved_balance >= 0 AND total_balance >= reserved_balance)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  type              ENUM('DEPOSIT','WITHDRAWAL','AUCTION_HOLD','AUCTION_HOLD_RELEASE','AUCTION_CAPTURE','PURCHASE','REFUND','ADJUSTMENT') NOT NULL,
  amount            DECIMAL(15,2) NOT NULL,
  reference_type    VARCHAR(60) NULL,   -- 'auction', 'order', etc.
  reference_id      BIGINT UNSIGNED NULL,
  description       VARCHAR(255) NULL,
  status            ENUM('PENDING','COMPLETED','FAILED') NOT NULL DEFAULT 'COMPLETED',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_wt_user (user_id),
  KEY idx_wt_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wallet_holds (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  auction_id        BIGINT UNSIGNED NOT NULL,
  bid_id            BIGINT UNSIGNED NULL,
  amount            DECIMAL(15,2) NOT NULL,
  status            ENUM('ACTIVE','RELEASED','CAPTURED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at       TIMESTAMP NULL,
  CONSTRAINT fk_wh_user    FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_wh_auction FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  KEY idx_wh_user (user_id),
  KEY idx_wh_auction (auction_id),
  KEY idx_wh_status (status)
) ENGINE=InnoDB;
