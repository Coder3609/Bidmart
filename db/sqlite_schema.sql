-- SQLite Schema for Hybrid Marketplace
PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  store_name      TEXT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  phone           TEXT NULL,
  role            TEXT NOT NULL DEFAULT 'BUYER',
  status          TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS addresses;
CREATE TABLE addresses (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label           TEXT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  line1           TEXT NOT NULL,
  line2           TEXT NULL,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  postal_code     TEXT NOT NULL,
  country         TEXT NOT NULL DEFAULT 'India',
  is_default      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id       INTEGER NULL REFERENCES categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title           TEXT NOT NULL,
  description     TEXT NULL,
  brand           TEXT NULL,
  condition       TEXT NOT NULL DEFAULT 'NEW',
  images          TEXT NULL,
  sku             TEXT NULL UNIQUE,
  price           NUMERIC NOT NULL,
  status          TEXT NOT NULL DEFAULT 'DRAFT',
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS product_state_history;
CREATE TABLE product_state_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_status     TEXT NULL,
  to_status       TEXT NOT NULL,
  changed_by      INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  reason          TEXT NULL,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS product_images;
CREATE TABLE product_images (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,
  storage_path    TEXT NULL,
  is_primary      INTEGER NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS product_view_logs;
CREATE TABLE product_view_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at       TEXT NOT NULL,
  view_count      INTEGER NOT NULL DEFAULT 1,
  UNIQUE(product_id, viewed_at)
);

DROP TABLE IF EXISTS inventory;
CREATE TABLE inventory (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  available_qty   INTEGER NOT NULL DEFAULT 0,
  reserved_qty    INTEGER NOT NULL DEFAULT 0,
  sold_qty        INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS auctions;
CREATE TABLE auctions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  starting_price  NUMERIC NOT NULL,
  reserve_price   NUMERIC NULL,
  bid_increment   NUMERIC NOT NULL,
  current_price   NUMERIC NOT NULL,
  starts_at       TEXT NOT NULL,
  ends_at         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'SCHEDULED',
  winning_bid_id  INTEGER NULL,
  closed_at       TEXT NULL,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS bids;
CREATE TABLE bids (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  auction_id      INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          NUMERIC NOT NULL,
  status          TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS cart_items;
CREATE TABLE cart_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

DROP TABLE IF EXISTS wishlist_items;
CREATE TABLE wishlist_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id        INTEGER NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  source            TEXT NOT NULL,
  auction_id        INTEGER NULL REFERENCES auctions(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  subtotal          NUMERIC NOT NULL,
  discount          NUMERIC NOT NULL DEFAULT 0,
  delivery_fee      NUMERIC NOT NULL DEFAULT 0,
  total             NUMERIC NOT NULL,
  placed_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      NUMERIC NOT NULL,
  line_total      NUMERIC NOT NULL
);

DROP TABLE IF EXISTS order_status_history;
CREATE TABLE order_status_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status     TEXT NULL,
  to_status       TEXT NOT NULL,
  changed_by      INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  note            TEXT NULL,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS return_requests;
CREATE TABLE return_requests (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id   INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  buyer_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'REQUESTED',
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_item_id   INTEGER NULL,
  rating          INTEGER NOT NULL,
  comment         TEXT NULL,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  is_read         INTEGER NOT NULL DEFAULT 0,
  metadata        TEXT NULL,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id        INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method          TEXT NOT NULL,
  provider_ref    TEXT NULL,
  amount          NUMERIC NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING',
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS search_queries;
CREATE TABLE search_queries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  query           TEXT NOT NULL,
  result_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS wallet_balances;
CREATE TABLE wallet_balances (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_balance     NUMERIC NOT NULL DEFAULT 0.00,
  reserved_balance  NUMERIC NOT NULL DEFAULT 0.00,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS wallet_transactions;
CREATE TABLE wallet_transactions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount            NUMERIC NOT NULL,
  type              TEXT NOT NULL,
  reference_id      TEXT NULL,
  description       TEXT NULL,
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS bidder_kyc;
CREATE TABLE bidder_kyc (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  id_type           TEXT NOT NULL,
  id_number         TEXT NOT NULL,
  document_url      TEXT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason  TEXT NULL,
  verified_at       TEXT NULL,
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS seller_details;
CREATE TABLE seller_details (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  business_name     TEXT NOT NULL,
  business_type     TEXT NOT NULL DEFAULT 'INDIVIDUAL',
  tax_id            TEXT NULL,
  bank_account_no   TEXT NULL,
  bank_ifsc         TEXT NULL,
  bank_name         TEXT NULL,
  onboarding_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

PRAGMA foreign_keys = ON;

