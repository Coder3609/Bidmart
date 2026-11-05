-- =====================================================================
-- MIGRATION 001 — Seller Center
-- Adds:
--   1. store_name column to users (for seller store branding)
--   2. product_view_logs table (for real product-view analytics)
--
-- Run with:
--   mysql -u root -p marketplace_db < db/migrations/001_seller_center.sql
-- =====================================================================

USE marketplace_db;

-- ---------------------------------------------------------------------
-- 1. Add store_name to users
--    Nullable — fallback to user.name when NULL (handled in JS/service)
-- ---------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS store_name VARCHAR(120) NULL
    COMMENT 'Public-facing store name for SELLER accounts. Falls back to name when NULL.'
    AFTER phone;

-- ---------------------------------------------------------------------
-- 2. Product view logs — daily aggregation per product
--    One row per (product_id, viewed_at date).
--    Incremented via ON DUPLICATE KEY UPDATE — no separate log rows.
--    Keeps the table small while supporting date-range chart queries.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_view_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT UNSIGNED NOT NULL,
  viewed_at   DATE            NOT NULL,
  view_count  INT UNSIGNED    NOT NULL DEFAULT 1,
  UNIQUE KEY uq_pvl_product_date (product_id, viewed_at),
  KEY         idx_pvl_product  (product_id),
  KEY         idx_pvl_date     (viewed_at),
  CONSTRAINT fk_pvl_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Daily product-view aggregates for seller analytics.';
