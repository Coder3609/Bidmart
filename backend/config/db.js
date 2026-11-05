/**
 * Database connection module.
 *
 * Uses mysql2/promise with a connection pool so every controller/service
 * can safely run concurrent queries (important for auction bidding).
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'marketplace_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
  queueLimit: 0,
  dateStrings: false,
  namedPlaceholders: true,
});

/**
 * Auto-ensure migration changes (store_name on users and product_view_logs table).
 */
async function ensureMigrations() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users LIKE 'store_name'");
    if (!cols.length) {
      await pool.query("ALTER TABLE users ADD COLUMN store_name VARCHAR(120) NULL AFTER phone");
    }
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_view_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id BIGINT UNSIGNED NOT NULL,
        viewed_at DATE NOT NULL,
        view_count INT UNSIGNED NOT NULL DEFAULT 1,
        UNIQUE KEY uq_pvl_product_date (product_id, viewed_at),
        KEY idx_pvl_product (product_id),
        KEY idx_pvl_date (viewed_at),
        CONSTRAINT fk_pvl_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB COMMENT='Daily product-view aggregates for seller analytics.';
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id  BIGINT UNSIGNED NOT NULL,
        image_url   VARCHAR(255)    NOT NULL,
        storage_path VARCHAR(255)   NULL,
        is_primary  TINYINT(1)      NOT NULL DEFAULT 0,
        sort_order  INT UNSIGNED    NOT NULL DEFAULT 0,
        created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        KEY idx_pi_product (product_id),
        KEY idx_pi_primary (is_primary)
      ) ENGINE=InnoDB COMMENT='Relational product images with primary and sorting order.';
    `);
    const [cols] = await pool.query("SHOW COLUMNS FROM product_images LIKE 'storage_path'");
    if (!cols.length) {
      await pool.query("ALTER TABLE product_images ADD COLUMN storage_path VARCHAR(255) NULL AFTER image_url");
    }
    const [uCols] = await pool.query("SHOW COLUMNS FROM product_images LIKE 'updated_at'");
    if (!uCols.length) {
      await pool.query("ALTER TABLE product_images ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_balances (
        id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id           BIGINT UNSIGNED NOT NULL,
        total_balance     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        reserved_balance  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_wallet_user (user_id),
        CONSTRAINT fk_wb_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id           BIGINT UNSIGNED NOT NULL,
        type              ENUM('DEPOSIT','WITHDRAWAL','AUCTION_HOLD','AUCTION_HOLD_RELEASE','AUCTION_CAPTURE','PURCHASE','REFUND','ADJUSTMENT') NOT NULL,
        amount            DECIMAL(15,2) NOT NULL,
        reference_type    VARCHAR(60) NULL,
        reference_id      BIGINT UNSIGNED NULL,
        description       VARCHAR(255) NULL,
        status            ENUM('PENDING','COMPLETED','FAILED') NOT NULL DEFAULT 'COMPLETED',
        created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_wt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_wt_user (user_id),
        KEY idx_wt_created (created_at)
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
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
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
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
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
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
        CONSTRAINT fk_kyc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
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
        onboarding_step         INT UNSIGNED NOT NULL DEFAULT 1,
        tax_id                  VARCHAR(50) NULL,
        gstin                   VARCHAR(50) NULL,
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
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
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
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_payout_accounts (
        id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        seller_id               BIGINT UNSIGNED NOT NULL,
        user_id                 BIGINT UNSIGNED NOT NULL,
        account_holder_name     VARCHAR(190) NOT NULL,
        bank_name               VARCHAR(100) NOT NULL,
        account_number_masked   VARCHAR(50) NOT NULL,
        account_number_hash     VARCHAR(255) NULL,
        ifsc_code               VARCHAR(20) NOT NULL,
        is_verified             TINYINT(1) NOT NULL DEFAULT 0,
        created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_spa_seller (seller_id),
        KEY idx_spa_user (user_id),
        CONSTRAINT fk_spa_seller FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE,
        CONSTRAINT fk_spa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
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
        CONSTRAINT fk_skyc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }

  try {
    await pool.query(`
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
        CONSTRAINT fk_sah_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  } catch (err) {
    // Handled gracefully
  }
}


/**
 * Simple helper to verify the database is reachable.
 * Used by the /api/health endpoint and on server startup.
 */
async function checkConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
    await ensureMigrations();
    return true;
  } finally {
    conn.release();
  }
}

/**
 * Run a callback inside a transaction with a dedicated connection.
 * Pass this connection into your model/service queries instead of the pool
 * whenever the operation must be atomic (bidding, checkout, auction close).
 *
 * Example:
 *   await withTransaction(async (conn) => {
 *     await conn.query('UPDATE ... FOR UPDATE');
 *     await conn.query('INSERT ...');
 *   });
 */
async function withTransaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, checkConnection, withTransaction, ensureMigrations };

