-- =====================================================================
-- HYBRID MARKETPLACE + ONLINE AUCTION SYSTEM
-- Supabase / PostgreSQL Schema
-- =====================================================================
-- Run this script in your Supabase Project -> SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_condition AS ENUM ('NEW', 'LIKE_NEW', 'USED', 'REFURBISHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM (
    'DRAFT', 'ACTIVE_SHOP', 'OUT_OF_STOCK', 'SHIFTING_TO_AUCTION',
    'ACTIVE_AUCTION', 'AUCTION_ENDED', 'AUCTION_WON', 'AUCTION_UNSOLD',
    'RETURNED_TO_SHOP', 'SOLD'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE auction_status AS ENUM ('SCHEDULED', 'OPEN', 'CLOSING', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE bid_status AS ENUM ('ACTIVE', 'OUTBID', 'WINNING', 'WON', 'LOST', 'RETRACTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_source AS ENUM ('SHOP', 'AUCTION');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'PENDING', 'CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
    'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE return_status AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PICKED_UP', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('COD', 'CARD', 'UPI', 'NET_BANKING', 'WALLET');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  store_name      VARCHAR(120) NULL,
  email           VARCHAR(190) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  phone           VARCHAR(20)  NULL,
  role            user_role NOT NULL DEFAULT 'BUYER',
  status          user_status NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ADDRESSES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label           VARCHAR(50)  NULL,
  full_name       VARCHAR(120) NOT NULL,
  phone           VARCHAR(20)  NOT NULL,
  line1           VARCHAR(190) NOT NULL,
  line2           VARCHAR(190) NULL,
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(100) NOT NULL,
  postal_code     VARCHAR(20)  NOT NULL,
  country         VARCHAR(100) NOT NULL DEFAULT 'India',
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  parent_id       INT NULL REFERENCES categories(id) ON DELETE SET NULL,
  name            VARCHAR(100) NOT NULL,
  slug            VARCHAR(120) NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title           VARCHAR(190) NOT NULL,
  description     TEXT NULL,
  brand           VARCHAR(100) NULL,
  condition       product_condition NOT NULL DEFAULT 'NEW',
  images          JSONB NULL,
  sku             VARCHAR(64) NULL UNIQUE,
  price           NUMERIC(12,2) NOT NULL,
  status          product_status NOT NULL DEFAULT 'DRAFT',
  version         INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- PRODUCT STATE HISTORY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_state_history (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_status     VARCHAR(30) NULL,
  to_status       VARCHAR(30) NOT NULL,
  changed_by      BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  reason          VARCHAR(255) NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- PRODUCT IMAGES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url       VARCHAR(255) NOT NULL,
  storage_path    VARCHAR(255) NULL,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- PRODUCT VIEW LOGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_view_logs (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at       DATE NOT NULL,
  view_count      INT NOT NULL DEFAULT 1,
  UNIQUE(product_id, viewed_at)
);

-- ---------------------------------------------------------------------
-- INVENTORY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  available_qty   INT NOT NULL DEFAULT 0,
  reserved_qty    INT NOT NULL DEFAULT 0,
  sold_qty        INT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_inv_qty CHECK (available_qty >= 0 AND reserved_qty >= 0 AND sold_qty >= 0)
);

-- ---------------------------------------------------------------------
-- AUCTIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auctions (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  starting_price  NUMERIC(12,2) NOT NULL,
  reserve_price   NUMERIC(12,2) NULL,
  bid_increment   NUMERIC(12,2) NOT NULL,
  current_price   NUMERIC(12,2) NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  status          auction_status NOT NULL DEFAULT 'SCHEDULED',
  winning_bid_id  BIGINT NULL,
  closed_at       TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- BIDS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bids (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auction_id      BIGINT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  status          bid_status NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE auctions ADD CONSTRAINT fk_auctions_win_bid FOREIGN KEY (winning_bid_id) REFERENCES bids(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------
-- CART ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity        INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ---------------------------------------------------------------------
-- WISHLIST ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist_items (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ---------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  buyer_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id        BIGINT NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  source            order_source NOT NULL,
  auction_id        BIGINT NULL REFERENCES auctions(id) ON DELETE SET NULL,
  status            order_status NOT NULL DEFAULT 'PENDING',
  subtotal          NUMERIC(12,2) NOT NULL,
  discount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL,
  placed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  quantity        INT NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL,
  line_total      NUMERIC(12,2) NOT NULL
);

-- ---------------------------------------------------------------------
-- ORDER STATUS HISTORY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status     VARCHAR(30) NULL,
  to_status       VARCHAR(30) NOT NULL,
  changed_by      BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  note            VARCHAR(255) NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- RETURN REQUESTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS return_requests (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_item_id   BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  buyer_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason          VARCHAR(255) NOT NULL,
  status          return_status NOT NULL DEFAULT 'REQUESTED',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_item_id   BIGINT NULL,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(60) NOT NULL,
  title           VARCHAR(150) NOT NULL,
  message         VARCHAR(255) NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method          payment_method NOT NULL,
  provider_ref    VARCHAR(150) NULL,
  amount          NUMERIC(12,2) NOT NULL,
  status          payment_status NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- SEARCH QUERIES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_queries (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  query           VARCHAR(190) NOT NULL,
  result_count    INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- WALLET BALANCES & TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_balances (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_balance     NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  reserved_balance  NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount            NUMERIC(15,2) NOT NULL,
  type              VARCHAR(50) NOT NULL,
  reference_id      VARCHAR(100) NULL,
  description       VARCHAR(255) NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- KYC & SELLER DETAILS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bidder_kyc (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  id_type           VARCHAR(50) NOT NULL,
  id_number         VARCHAR(100) NOT NULL,
  document_url      VARCHAR(255) NULL,
  status            VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  rejection_reason  VARCHAR(255) NULL,
  verified_at       TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_details (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  business_name     VARCHAR(150) NOT NULL,
  business_type     VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL',
  tax_id            VARCHAR(50) NULL,
  bank_account_no   VARCHAR(50) NULL,
  bank_ifsc         VARCHAR(20) NULL,
  bank_name         VARCHAR(100) NULL,
  onboarding_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

