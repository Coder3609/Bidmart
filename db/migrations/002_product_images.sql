-- =====================================================================
-- MIGRATION 002 — Product Images Table
-- Adds relational product_images table to support multi-image galleries,
-- primary image indicators, and custom sort order.
--
-- Run with:
--   mysql -u root -p marketplace_db < db/migrations/002_product_images.sql
-- =====================================================================

USE marketplace_db;

CREATE TABLE IF NOT EXISTS product_images (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT UNSIGNED NOT NULL,
  image_url   VARCHAR(255)    NOT NULL,
  is_primary  TINYINT(1)      NOT NULL DEFAULT 0,
  sort_order  INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  KEY idx_pi_product (product_id),
  KEY idx_pi_primary (is_primary)
) ENGINE=InnoDB COMMENT='Relational product images with primary and sorting order.';
