-- =====================================================================
-- HYBRID MARKETPLACE + ONLINE AUCTION SYSTEM
-- Database schema (MySQL 8+)
-- =====================================================================
-- Run with:
--   mysql -u root -p < db/schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS marketplace_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE marketplace_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120)  NOT NULL,
  email           VARCHAR(190)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  phone           VARCHAR(20)   NULL,
  role            ENUM('BUYER','SELLER','ADMIN') NOT NULL DEFAULT 'BUYER',
  status          ENUM('ACTIVE','SUSPENDED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ADDRESSES
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS addresses;
CREATE TABLE addresses (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  label           VARCHAR(50)  NULL,               -- e.g. Home, Work
  full_name       VARCHAR(120) NOT NULL,
  phone           VARCHAR(20)  NOT NULL,
  line1           VARCHAR(190) NOT NULL,
  line2           VARCHAR(190) NULL,
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(100) NOT NULL,
  postal_code     VARCHAR(20)  NOT NULL,
  country         VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_addresses_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id       INT UNSIGNED NULL,
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(120) NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_slug (slug),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PRODUCTS
-- product.id is permanent across the Shop <-> Auction lifecycle.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id       BIGINT UNSIGNED NOT NULL,
  category_id     INT UNSIGNED NOT NULL,
  title           VARCHAR(190) NOT NULL,
  description     TEXT NULL,
  brand           VARCHAR(100) NULL,
  `condition`     ENUM('NEW','LIKE_NEW','USED','REFURBISHED') NOT NULL DEFAULT 'NEW',
  images          JSON NULL,                 -- array of image URLs
  sku             VARCHAR(64) NULL,          -- optional scannable code (barcode/QR payload), Phase 7
  price           DECIMAL(12,2) NOT NULL,    -- current Shop price (fixed price)
  status          ENUM(
                    'DRAFT',
                    'ACTIVE_SHOP',
                    'OUT_OF_STOCK',
                    'SHIFTING_TO_AUCTION',
                    'ACTIVE_AUCTION',
                    'AUCTION_ENDED',
                    'AUCTION_WON',
                    'AUCTION_UNSOLD',
                    'RETURNED_TO_SHOP',
                    'SOLD'
                  ) NOT NULL DEFAULT 'DRAFT',
  version         INT UNSIGNED NOT NULL DEFAULT 1,   -- optimistic locking
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_seller   FOREIGN KEY (seller_id)   REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  KEY idx_products_seller (seller_id),
  KEY idx_products_category (category_id),
  KEY idx_products_status (status),
  UNIQUE KEY uq_products_sku (sku),
  FULLTEXT KEY ft_products_search (title, description, brand)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PRODUCT STATE HISTORY
-- Full audit trail of every state-machine transition (section 8 + 42.14).
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS product_state_history;
CREATE TABLE product_state_history (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      BIGINT UNSIGNED NOT NULL,
  from_status     VARCHAR(30) NULL,
  to_status       VARCHAR(30) NOT NULL,
  changed_by      BIGINT UNSIGNED NULL,      -- user id (seller/admin/system)
  reason          VARCHAR(255) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_psh_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_psh_user    FOREIGN KEY (changed_by) REFERENCES users(id)    ON DELETE SET NULL,
  KEY idx_psh_product (product_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- INVENTORY
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS inventory;
CREATE TABLE inventory (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      BIGINT UNSIGNED NOT NULL,
  available_qty   INT NOT NULL DEFAULT 0,
  reserved_qty    INT NOT NULL DEFAULT 0,
  sold_qty        INT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_inventory_product (product_id),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT chk_inventory_nonneg CHECK (available_qty >= 0 AND reserved_qty >= 0 AND sold_qty >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- AUCTIONS
-- Only one OPEN/SCHEDULED auction per product enforced at service layer
-- (plus a partial guard via idx below).
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS auctions;
CREATE TABLE auctions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      BIGINT UNSIGNED NOT NULL,
  starting_price  DECIMAL(12,2) NOT NULL,
  reserve_price   DECIMAL(12,2) NULL,
  bid_increment   DECIMAL(12,2) NOT NULL,
  current_price   DECIMAL(12,2) NOT NULL,
  starts_at       DATETIME NOT NULL,
  ends_at         DATETIME NOT NULL,
  status          ENUM('SCHEDULED','OPEN','CLOSING','CLOSED') NOT NULL DEFAULT 'SCHEDULED',
  winning_bid_id  BIGINT UNSIGNED NULL,
  closed_at       DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_auctions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  KEY idx_auctions_product (product_id),
  KEY idx_auctions_status (status),
  KEY idx_auctions_ends_at (ends_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- BIDS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS bids;
CREATE TABLE bids (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  auction_id      BIGINT UNSIGNED NOT NULL,
  bidder_id       BIGINT UNSIGNED NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  status          ENUM('ACTIVE','OUTBID','WINNING','WON','LOST','RETRACTED') NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bids_auction FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  CONSTRAINT fk_bids_bidder  FOREIGN KEY (bidder_id)  REFERENCES users(id)    ON DELETE CASCADE,
  KEY idx_bids_auction (auction_id),
  KEY idx_bids_bidder (bidder_id),
  KEY idx_bids_auction_amount (auction_id, amount)
) ENGINE=InnoDB;

ALTER TABLE auctions
  ADD CONSTRAINT fk_auctions_winning_bid FOREIGN KEY (winning_bid_id) REFERENCES bids(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- CART ITEMS (Shop mode only)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS cart_items;
CREATE TABLE cart_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  quantity        INT UNSIGNED NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- WISHLIST ITEMS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS wishlist_items;
CREATE TABLE wishlist_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
  CONSTRAINT fk_wishlist_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  buyer_id          BIGINT UNSIGNED NOT NULL,
  address_id        BIGINT UNSIGNED NOT NULL,
  source            ENUM('SHOP','AUCTION') NOT NULL,
  auction_id        BIGINT UNSIGNED NULL,      -- set when source = AUCTION
  status            ENUM(
                      'PENDING','CONFIRMED','PAID','PROCESSING','SHIPPED',
                      'OUT_FOR_DELIVERY','DELIVERED','CANCELLED',
                      'RETURN_REQUESTED','RETURNED','REFUNDED'
                    ) NOT NULL DEFAULT 'PENDING',
  subtotal          DECIMAL(12,2) NOT NULL,
  discount          DECIMAL(12,2) NOT NULL DEFAULT 0,
  delivery_fee      DECIMAL(12,2) NOT NULL DEFAULT 0,
  total             DECIMAL(12,2) NOT NULL,
  placed_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_buyer   FOREIGN KEY (buyer_id)   REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_auction FOREIGN KEY (auction_id) REFERENCES auctions(id)  ON DELETE SET NULL,
  KEY idx_orders_buyer (buyer_id),
  KEY idx_orders_status (status),
  KEY idx_orders_auction (auction_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  seller_id       BIGINT UNSIGNED NOT NULL,
  quantity        INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price      DECIMAL(12,2) NOT NULL,
  line_total      DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_oi_seller  FOREIGN KEY (seller_id)  REFERENCES users(id)    ON DELETE RESTRICT,
  KEY idx_oi_order (order_id),
  KEY idx_oi_product (product_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ORDER STATUS HISTORY
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS order_status_history;
CREATE TABLE order_status_history (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT UNSIGNED NOT NULL,
  from_status     VARCHAR(30) NULL,
  to_status       VARCHAR(30) NOT NULL,
  changed_by      BIGINT UNSIGNED NULL,
  note            VARCHAR(255) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_osh_user  FOREIGN KEY (changed_by) REFERENCES users(id)  ON DELETE SET NULL,
  KEY idx_osh_order (order_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- RETURN REQUESTS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS return_requests;
CREATE TABLE return_requests (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_item_id   BIGINT UNSIGNED NOT NULL,
  buyer_id        BIGINT UNSIGNED NOT NULL,
  reason          VARCHAR(255) NOT NULL,
  status          ENUM('REQUESTED','APPROVED','REJECTED','PICKED_UP','REFUNDED') NOT NULL DEFAULT 'REQUESTED',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rr_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_buyer      FOREIGN KEY (buyer_id)      REFERENCES users(id)       ON DELETE CASCADE,
  KEY idx_rr_buyer (buyer_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      BIGINT UNSIGNED NOT NULL,
  buyer_id        BIGINT UNSIGNED NOT NULL,
  order_item_id   BIGINT UNSIGNED NULL,
  rating          TINYINT UNSIGNED NOT NULL,
  comment         TEXT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_buyer   FOREIGN KEY (buyer_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  KEY idx_reviews_product (product_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  type            VARCHAR(60) NOT NULL,       -- e.g. OUTBID, ORDER_SHIPPED, AUCTION_WON
  title           VARCHAR(150) NOT NULL,
  message         VARCHAR(255) NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  metadata        JSON NULL,                  -- e.g. { "order_id": 12 }
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_notifications_user (user_id, is_read)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT UNSIGNED NOT NULL,
  method          ENUM('COD','CARD','UPI','NET_BANKING','WALLET') NOT NULL,
  provider_ref    VARCHAR(150) NULL,          -- external gateway transaction id
  amount          DECIMAL(12,2) NOT NULL,
  status          ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  KEY idx_payments_order (order_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- SEARCH QUERIES
-- Logged on every search (Phase 7) so we can serve "recent searches"
-- (per-user) and "popular searches" (global, ranked by frequency).
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS search_queries;
CREATE TABLE search_queries (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NULL,       -- NULL for logged-out searches
  query           VARCHAR(190) NOT NULL,
  result_count    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_search_queries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_search_queries_user (user_id, created_at),
  KEY idx_search_queries_query (query)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
