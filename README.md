# BidMart — Hybrid Marketplace + Online Auction System

**Shop it. Bid it. Own it.**

A hybrid e-commerce platform combining fixed-price shopping (like Amazon/Flipkart)
with live online auctions on the same product catalog. This is a real full-stack
application — Node.js/Express backend, MySQL database, vanilla JS frontend — built
in phases.

> **Status: Phase 8 — Notifications, Reviews, Returns & Analytics.** Auth,
> products, the Shop buy path, the full auction lifecycle, real dashboards,
> global search + scan, and now a complete post-purchase loop — notifications,
> product reviews, and a full return/refund workflow — are all working. This
> completes the planned 8-phase build. See [Roadmap](#roadmap) below.

---

## 1. Project Overview

The platform has two modes sharing the same product catalog and the same
`product_id`:

- **Shop Mode** — Product → Add to Cart → Checkout → Order → Payment → Shipping → Delivery → Review
- **Auction Mode** — Product → Auction → Live Bidding → Auction Ends → Winner → Order → Payment → Shipping → Delivery

A product's lifecycle is governed by a backend-enforced state machine
(see [Product State Machine](#7-product-state-machine)) — the frontend never
decides state transitions.

## 2. Features (planned across all phases)

- Buyer, Seller, and Admin dashboards
- Fixed-price shopping: cart, checkout, orders, wishlist, returns, reviews
- Live auctions: bidding, concurrency-safe closing, winner/unsold handling
- Global search with filters, plus a barcode/QR/image scan integration point
- Database-backed notifications
- Reporting & analytics for sellers/admins

## 3. Technology Stack

| Layer     | Choice |
|-----------|--------|
| Frontend  | HTML5, CSS3, vanilla JavaScript, Fetch API |
| Backend   | Node.js, Express.js, REST API |
| Database  | MySQL 8+ via `mysql2/promise` (connection pooling) |
| Auth      | Password hashing (bcrypt) + JWT, role-based authorization *(Phase 2)* |

## 4. Folder Structure

```text
marketplace/
├── backend/
│   ├── config/db.js                     # MySQL pool + transaction helper
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── product.controller.js
│   │   ├── cart.controller.js
│   │   ├── wishlist.controller.js
│   │   ├── address.controller.js
│   │   └── order.controller.js
│   ├── middleware/
│   │   ├── auth.js                      # authenticate, authenticateOptional, authorize
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── category.model.js
│   │   ├── product.model.js
│   │   ├── inventory.model.js
│   │   ├── cart.model.js
│   │   ├── wishlist.model.js
│   │   ├── address.model.js
│   │   ├── order.model.js
│   │   └── payment.model.js
│   ├── routes/
│   │   ├── health.routes.js
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   ├── product.routes.js
│   │   ├── cart.routes.js
│   │   ├── wishlist.routes.js
│   │   ├── address.routes.js
│   │   └── order.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── category.service.js
│   │   ├── product.service.js           # ownership checks, validation, status changes
│   │   ├── cart.service.js
│   │   ├── wishlist.service.js
│   │   ├── address.service.js
│   │   └── order.service.js             # checkout transaction, fulfillment transitions
│   ├── state-machine/
│   │   ├── productStateMachine.js       # product status transitions
│   │   └── orderStateMachine.js         # order status transitions (buyer/seller/admin actors)
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── jwt.js
│   │   ├── password.js
│   │   └── validators.js
│   ├── tests/                           # (later phase)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── db/
│   ├── schema.sql
│   └── seed.sql
├── frontend/
│   ├── index.html                       # now shows real featured products
│   ├── auth/
│   │   ├── login.html
│   │   └── register.html
│   ├── shop/
│   │   ├── shop.html                    # browse/filter/search catalog
│   │   ├── product.html                 # product detail, add to cart / buy now / wishlist
│   │   ├── cart.html
│   │   ├── checkout.html                # address + payment method + place order
│   │   ├── wishlist.html
│   │   ├── orders.html                  # buyer's order history
│   │   └── order-detail.html            # status timeline + role-aware action buttons
│   ├── seller/
│   │   ├── products.html                # create products, trigger state transitions
│   │   └── orders.html                  # seller's sales, links into order-detail.html
│   ├── dashboards/
│   │   ├── buyer/dashboard.html         # links to My Orders / Wishlist
│   │   ├── seller/dashboard.html        # links to My Products / My Sales
│   │   └── admin/dashboard.html
│   └── shared/
│       ├── api.js
│       ├── auth.js
│       ├── header.js
│       ├── footer.js
│       ├── product-card.js              # shared card renderer + ₹ formatter
│       └── theme.css
├── package.json
├── README.md
└── .gitignore
```

Live auctions, global search/scan, and the richer admin dashboard (reports,
user management) are still ahead (see [Roadmap](#roadmap)). Everything listed
under `frontend/shop/` and `frontend/seller/` above is now a real, working
page backed by live data — no more placeholders for the shop side.

## 5. Database Setup

Requires **MySQL 8+**.

```bash
# 1. Create the database and all tables
mysql -u root -p < db/schema.sql

# 2. Load demo data (users, categories, products, auctions, bids)
mysql -u root -p marketplace_db < db/seed.sql
```

`schema.sql` creates `marketplace_db` and 17 tables: `users`, `addresses`,
`categories`, `products`, `product_state_history`, `inventory`, `auctions`,
`bids`, `cart_items`, `wishlist_items`, `orders`, `order_items`,
`order_status_history`, `return_requests`, `reviews`, `notifications`,
`payments`, `search_queries` — with primary/foreign keys, indexes, enums, and timestamps.

### Demo Shop Catalog & Seeding

The platform includes a realistic, production-quality Shop Mode dataset (~208 items total):
- **20 Shopping Categories**: Electronics, Computers & Laptops, Mobiles & Accessories, Audio, Cameras, Fashion, Men's Fashion, Women's Fashion, Shoes, Bags & Accessories, Home & Kitchen, Furniture, Beauty & Personal Care, Sports & Fitness, Books, Gaming, Toys & Kids, Automotive, Smart Home, Office & Stationery.
- **200+ Demo Products**: Realistic Indian Rupee prices, brands, descriptions, condition ratings, and initial inventory stock (`ACTIVE_SHOP`).
- **10 Demo Sellers**: Accounts mapped across categories (`TechWorld`, `Urban Fashion`, `HomeStyle`, `SportsZone`, `Gadget Planet`, `BookNest`, `AutoCare`, `OfficeMart`, `BeautyCare`, `KidZone`).
- **Local SVG Assets & Fallbacks**: Every product has a dedicated vector SVG under `frontend/assets/products/<category-slug>/` with universal `onerror` fallback support.
- **Untouched Auction Mode**: Existing auction items (Products #5-#8, Auctions #1-#4) remain fully preserved.

To re-generate the seed data and vector image assets at any time:
```bash
node db/generate_seed.js
mysql -u root -p marketplace_db < db/seed.sql
```

## 6. Environment Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your MySQL credentials:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=marketplace_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=replace_this_with_a_long_random_string
```

Never commit `.env` — it's already in `.gitignore`.

## 7. Installation & Running

### Demo Shop Data

`db/seed.sql` includes 20 shopping categories, 204 active Shop products,
10 demo sellers, inventory for every product, and local SVG product artwork
under `frontend/assets/products/`. The four pre-existing auction products and
their auction records are retained unchanged.

To regenerate the deterministic catalog and its local image assets:

```bash
node db/generate_seed.js
```

Then import the seed into an existing `marketplace_db` database:

```bash
mysql -u root -p marketplace_db < db/seed.sql
```

For a complete reset, run `db/schema.sql` first, then run the seed command.

### Windows quick start

After MySQL is running, configure `backend/.env` (especially `DB_PASSWORD`)
and run this single command from the project root:

```powershell
node start.js
```

This launcher works even when PowerShell blocks `npm.ps1` under a restrictive
execution policy.

```bash
# From the project root
npm run install:backend   # installs backend/node_modules

# Development (auto-restart with nodemon)
npm run dev

# Production
npm start
```

The Express server serves the API **and** the frontend together, so once it's
running, open:

```text
http://localhost:5000
```

Health check (confirms API + database connectivity):

```text
http://localhost:5000/api/health
```

## 8. Authentication

Passwords are hashed with Node's built-in `crypto.scrypt` (no extra native
dependency required) and sessions are JSON Web Tokens signed with
`JWT_SECRET` from `.env`, expiring after `JWT_EXPIRES_IN` (default 7 days).

### Endpoints

| Method | Path | Auth required | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | No | `{ name, email, password, phone?, role? }` — role must be `BUYER` or `SELLER` |
| POST | `/api/auth/login` | No | `{ email, password }` |
| POST | `/api/auth/logout` | No | Stateless — client just discards the token |
| GET  | `/api/auth/me` | Yes | Returns the logged-in user's profile |

Successful register/login responses look like:

```json
{
  "success": true,
  "message": "Logged in successfully.",
  "data": {
    "token": "<jwt>",
    "user": { "id": 2, "name": "Rahul Sharma", "email": "rahul@bidmart.test", "role": "BUYER", ... }
  }
}
```

Send the token on subsequent requests: `Authorization: Bearer <jwt>`.
The frontend's `shared/auth.js` + `shared/api.js` handle this automatically
once you call `window.auth.login(...)` or `window.auth.register(...)`.

### Role-based protection

`backend/middleware/auth.js` exports two guards used together on any route
that needs it:

```js
router.post('/products', authenticate, authorize('SELLER', 'ADMIN'), controller.create);
```

- `authenticate` — verifies the JWT and attaches `req.user`.
- `authorize('SELLER', 'ADMIN')` — 403s if `req.user.role` isn't in the list.

This is what will stop a BUYER from reaching seller/admin-only endpoints in
Phase 3+, matching the spec's access rules (BUYER can't access `/seller` or
`/admin`; SELLER can't access `/admin`).

### Try it

All seeded accounts (see `db/seed.sql`) use the password `Password123!`:

```text
admin@bidmart.test       ADMIN
rahul@bidmart.test       BUYER
priya@bidmart.test       BUYER
techworld@bidmart.test   SELLER
urbanfashion@bidmart.test SELLER
```

Or open `http://localhost:5000/frontend/auth/register.html` to create a new
BUYER/SELLER account, and `http://localhost:5000/frontend/auth/login.html`
to log in. A successful login redirects to a minimal role dashboard that
calls `GET /api/auth/me` to prove the whole chain works.

## 9. Product State Machine

```text
DRAFT → ACTIVE_SHOP → SHIFTING_TO_AUCTION → ACTIVE_AUCTION → AUCTION_ENDED
                                                                   │
                                                     ┌─────────────┴─────────────┐
                                                   WIN                        UNSOLD
                                                     │                           │
                                                     ▼                           ▼
                                               AUCTION_WON               AUCTION_UNSOLD
                                                     │                           │
                                                     ▼                  ┌────────┴────────┐
                                              ORDER CREATED           RELIST      RETURNED_TO_SHOP
                                                                                       │
                                                                                       ▼
                                                                                 ACTIVE_SHOP

ACTIVE_SHOP ↔ OUT_OF_STOCK  (independent toggle)
```

`product.id` never changes across this lifecycle — Shop and Auction modes
share the same row. Every transition is written to `product_state_history`.

**Implementation:** `backend/state-machine/productStateMachine.js` is the
single source of truth. Every transition is tagged with who may trigger it:

- **`OWNER_OR_ADMIN`** — the product's seller or an admin, via `PATCH /api/products/:id/status`. That's `DRAFT → ACTIVE_SHOP` (publish) and `ACTIVE_SHOP ↔ OUT_OF_STOCK`. Two AUCTION_UNSOLD transitions (`→ ACTIVE_AUCTION` / `→ RETURNED_TO_SHOP`) are also tagged `OWNER_OR_ADMIN` in the table below, but as of Phase 5 the generic status endpoint deliberately refuses them (`409 USE_AUCTION_ENDPOINT`) — they must go through `POST /api/auctions/relist` / `POST /api/auctions/return-to-shop` instead, since those endpoints also create the new auction row or run the automatic follow-up transition atomically.
- **`SYSTEM`** — only a trusted backend service can trigger it. As of Phase 5 this is real: `auction.service.js` drives every `SHIFTING_TO_AUCTION → ACTIVE_AUCTION → AUCTION_ENDED → AUCTION_WON/AUCTION_UNSOLD → SOLD` step, and `order.service.js` drives `ACTIVE_SHOP → SHIFTING_TO_AUCTION`/checkout's out-of-stock flip. These are rejected with `403 SYSTEM_ONLY_TRANSITION` if attempted through the manual endpoint — a seller can't fake winning their own auction.

Every change (manual or system) is written to `product_state_history` with
`from_status`, `to_status`, `changed_by`, and an optional `reason`.

## 10. Products API *(Phase 3)*

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/products` | No | Public catalog — only `ACTIVE_SHOP` / `ACTIVE_AUCTION`. Query: `categoryId`, `search`, `page`, `limit` |
| GET | `/api/products/my` | SELLER/ADMIN | Your own products, any status. Query: `status`, `page`, `limit` |
| GET | `/api/products/:id` | Optional | Public if listed; owner/admin can also view their own drafts |
| POST | `/api/products` | SELLER/ADMIN | Creates a `DRAFT` product + its `inventory` row |
| PUT | `/api/products/:id` | SELLER (owner)/ADMIN | Edits title/description/brand/condition/images/price/category — **not** status |
| DELETE | `/api/products/:id` | SELLER (owner)/ADMIN | Only while `status = DRAFT` |
| GET | `/api/products/:id/transitions` | SELLER (owner)/ADMIN | Lists the manual status changes available right now |
| PATCH | `/api/products/:id/status` | SELLER (owner)/ADMIN | `{ status, reason? }` — validated by the state machine |

`GET /api/categories` lists the seed categories (Electronics, Fashion, Home
& Living, Mobiles, Laptops, Watches).

### Try it

Log in as a seller (`techworld@bidmart.test` / `Password123!`) at
`http://localhost:5000/frontend/auth/login.html`, then open **My Products**
from the seller dashboard (or go straight to
`http://localhost:5000/frontend/seller/products.html`). You can create a
product, publish it to Shop, mark it out of stock, and restock it — each
click calls the state machine and you'll see the status pill update.

## 11. Shop Flow — Cart, Checkout & Orders *(Phase 4)*

Browse → Product Detail → Add to Cart / Buy Now → Checkout → Order → Track → Return.
Only products with `status = ACTIVE_SHOP` are purchasable — enforced both in
`cart.service.js` (can't add an unavailable product) and again inside the
checkout transaction (never trusts the cart snapshot).

### Checkout, precisely

`order.service.js`'s `checkout()` runs as a single DB transaction:

1. Row-locks each product **and** its inventory row (`SELECT ... FOR UPDATE`) so two people checking out the last unit at the same time can't both succeed.
2. Re-validates status and stock straight from the database — price and availability are never taken from the client or the cart cache.
3. Decrements `available_qty`, bumps `sold_qty`. If stock hits exactly zero, it calls `transitionProduct(..., isSystemCall: true)` to flip the product to `OUT_OF_STOCK` automatically — the same state machine from Phase 3, just invoked by a trusted service instead of a person.
4. Creates the `orders` row (`status = CONFIRMED`), one `order_items` row per product, the first `order_status_history` entry, and a `payments` row.
5. Empties the cart.

**Payments today:** `COD` records a `PENDING` payment (settled on delivery).
Any other method (`CARD`/`UPI`/`NET_BANKING`/`WALLET`) is recorded as
`SUCCESS` immediately — there's no real payment gateway wired up yet, so
this is clearly a simulation for development, matching the "Online Payment
(Development Mode)" label shown at checkout.

### Order state machine

Implemented in `backend/state-machine/orderStateMachine.js`, same spirit as
the product one but the "who can trigger it" is a *relationship* to the
order rather than a single owner:

```text
CONFIRMED → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED → RETURN_REQUESTED → RETURNED → REFUNDED
     │            │
     ▼            ▼
CANCELLED    CANCELLED
```

| From | To | Who |
|---|---|---|
| CONFIRMED | PROCESSING | Seller |
| CONFIRMED | CANCELLED | Buyer |
| PROCESSING | SHIPPED | Seller |
| PROCESSING | CANCELLED | Seller |
| SHIPPED | OUT_FOR_DELIVERY | Seller |
| OUT_FOR_DELIVERY | DELIVERED | Seller |
| DELIVERED | RETURN_REQUESTED | Buyer |
| RETURN_REQUESTED | RETURNED | Seller |
| RETURNED | REFUNDED | Admin |

An **admin** can always perform any transition, regardless of the table
above. Cancelling an order restocks the affected inventory (it does not
automatically flip a product back from `OUT_OF_STOCK` to `ACTIVE_SHOP` —
that's a deliberate manual step for the seller to review).

**Known simplification** (documented here on purpose): status is tracked at
the whole-order level even though one order can contain items from multiple
sellers. Any seller with an item in the order can advance the *whole*
order's fulfillment status. Splitting status per seller is a reasonable
future enhancement, out of scope for this phase.

### API endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET/POST/PATCH/DELETE | `/api/cart` | Any logged-in user | `POST { productId, quantity? }`, `PATCH /:productId { quantity }` (0 removes it) |
| GET/POST/DELETE | `/api/wishlist` | Any logged-in user | `POST { productId }` |
| GET/POST/DELETE | `/api/addresses` | Any logged-in user | First address saved becomes the default automatically |
| POST | `/api/orders` | Any logged-in user | Checkout: `{ addressId, paymentMethod }` |
| GET | `/api/orders/my` | Any logged-in user | Your orders as a buyer |
| GET | `/api/orders/my-sales` | SELLER/ADMIN | Orders containing your products |
| GET | `/api/orders/:id` | Buyer / involved seller / admin | 404s (not 403) for anyone else — doesn't reveal the order exists |
| GET | `/api/orders/:id/transitions` | Buyer / involved seller / admin | Only the transitions *this caller* may trigger |
| PATCH | `/api/orders/:id/status` | Buyer / involved seller / admin | `{ status, note? }` — validated by the order state machine |

### Try it end to end

1. Log in as a buyer (`rahul@bidmart.test` / `Password123!`).
2. Go to **Shop**, open a product, **Add to Cart**.
3. Go to **Cart** → **Proceed to Checkout**, add an address, pick Cash on Delivery, **Place Order**.
4. You'll land on the order detail page with a status timeline.
5. Log in as the seller who owns that product (`techworld@bidmart.test` or `urbanfashion@bidmart.test`) → **My Sales** → open the order → **Start processing** → **Mark as shipped** → etc. Watch the timeline update.

## 12. Auction Flow *(Phase 5)*

Seller shifts an `ACTIVE_SHOP` product to auction (sets starting bid, increment,
reserve price, start/end times) → buyers bid while the auction is open → the
backend closes the auction automatically (row-level locking, reserve-price
check) → the winner completes their order by choosing an address/payment
method → or the seller relists / returns the unsold product to Shop.

### API

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/auctions` | No | Public listing. Query: `status` (`ALL`/`LIVE`/`SCHEDULED`/`CLOSED`), `page`, `limit`, `sort` |
| GET | `/api/auctions/my` | SELLER/ADMIN | Your own auctions, any status |
| GET | `/api/auctions/my-bids` | Any logged-in | Your bid history, one row per auction you've bid on |
| POST | `/api/auctions` | SELLER (owner)/ADMIN | `{ productId, startingPrice, reservePrice?, bidIncrement, startsAt, endsAt }` — moves an `ACTIVE_SHOP` product into the auction flow |
| POST | `/api/auctions/relist` | SELLER (owner)/ADMIN | Same body as above, for an `AUCTION_UNSOLD` product — starts a fresh auction round on the *same* product |
| POST | `/api/auctions/return-to-shop` | SELLER (owner)/ADMIN | `{ productId }` — sends an `AUCTION_UNSOLD` product back to `ACTIVE_SHOP` |
| POST | `/api/auctions/run-scheduler` | ADMIN | Manually ticks the open/close scheduler (also runs automatically every 15s) |
| GET | `/api/auctions/by-product/:productId` | No | Hand-off from a product page to its auction — resolves to the active or most recent auction |
| GET | `/api/auctions/:id` | Optional | Auction detail; includes `myBid` and `minNextBid` when logged in |
| GET | `/api/auctions/:id/bids` | No | Bid history for one auction |
| POST | `/api/auctions/:id/bids` | BUYER | `{ amount }` — place a bid |
| POST | `/api/auctions/:id/complete-order` | Winning bidder | `{ addressId, paymentMethod }` — the winner's payment step, creates the order |

### Concurrency & closing, precisely

`auction.service.js#placeBid` locks the parent `auctions` row
(`SELECT ... FOR UPDATE`) before reading the current highest bid — this
serializes every bid on one auction through a single connection at a time,
so two bidders racing to be "the new highest" can never both succeed. The
minimum next bid is `current_price + bid_increment` (or `starting_price` if
there are no bids yet); the previous highest bid flips to `OUTBID` and its
bidder gets a notification.

`auction.service.js#closeAuctionById` is what the background scheduler (a
15-second `setInterval` in `server.js`) and each auction page's lazy sync
both call — it's **idempotent**: if the auction is already `CLOSED` it's a
no-op, so overlapping ticks or a slow request racing the interval can never
double-close an auction or create two orders. Inside one transaction it:
locks the auction, finds the highest bid, checks it against `reserve_price`,
flips auction/product status (`ACTIVE_AUCTION → AUCTION_ENDED → AUCTION_WON`
or `→ AUCTION_UNSOLD`), marks the losing bids `LOST`, and writes
notifications for the winner, the seller, and every losing bidder.

Order creation is deliberately **not** automatic at close time — the backend
has no delivery address to use yet. Instead, `AUCTION_WON` sits until the
winner calls `POST /api/auctions/:id/complete-order` with an address and
payment method (reusing the same order/payment/inventory logic as Shop
checkout), which is what finally drives `AUCTION_WON → SOLD`. That call is
also idempotent — replaying it after the order already exists just returns
the existing order instead of creating a second one.

### Try it

> **Note:** the seeded auctions (`db/seed.sql`) have `ends_at` timestamps that
> are already in the past by the time you're reading this — that's
> intentional. The first scheduler tick after you start the server will
> immediately close all four of them, which is a good way to see the
> win/unsold paths fire without waiting: auction #3 (Rolex) has a winning
> bid above its reserve and will resolve to `AUCTION_WON`, the other three
> will resolve to `AUCTION_UNSOLD`. To try live bidding yourself, create a
> new auction with an end time in the future, as below.

1. Log in as a seller, go to **My Auctions** (`/frontend/seller/auctions.html`), and click **Move to Auction** on a Shop product — set a starting price, increment, and a short end time.
2. In another browser/incognito window, log in as a buyer, open **Live Auctions**, and place a bid. Watch the price and bid history update (the page polls every 5s while open).
3. Wait for the end time (or, as an admin, call `POST /api/auctions/run-scheduler`) — the auction closes automatically.
4. As the winning buyer, open the auction page again and click **Complete Order** to pick an address and payment method.
5. If nobody bid enough to clear the reserve, log back in as the seller and either **Relist** or **Return to Shop** from the same unsold item.

## 13. Dashboards *(Phase 6)*

One aggregate endpoint per role, each scoped so a user can only ever see
their own numbers (admin is the one intentionally unscoped, marketplace-wide
view, and is locked to the `ADMIN` role).

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/api/dashboard/buyer` | BUYER | Order/bid/wishlist counts, 5 most recent orders, auctions you're currently the highest bidder on |
| GET | `/api/dashboard/seller` | SELLER | Product/listing/auction counts, total orders + revenue across your products, 5 most recent sales, 5 most recent auctions |
| GET | `/api/dashboard/admin` | ADMIN | Marketplace-wide user/product/order counts and revenue, a 7-day orders+revenue series (`salesOverview`), 8 most recent orders and auctions across everyone |

All three replace what was a Phase 2 placeholder ("Welcome back, confirming
auth works") with real numbers — `frontend/dashboards/{buyer,seller,admin}/dashboard.html`.
The admin page renders `salesOverview` as a small CSS/HTML bar chart (no
charting library needed) so revenue trends are visible at a glance.

## 14. Search & Scan *(Phase 7)*

### Search

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/search?q=` | Optional | Quick combined preview — top 6 products + top 6 auctions, logs the query |
| GET | `/api/search/products` | Optional | Full Shop search. Query: `q, categoryId, minPrice, maxPrice, brand, condition, availability, sort, page, limit` |
| GET | `/api/search/auctions` | Optional | Full Auction search. Query: `q, categoryId, minBid, maxBid, sellerId, condition, endingSoon, minBids, sort, page, limit` |
| GET | `/api/search/assist?q=` | Optional | No `q` (or <2 chars) → `{ recent, popular }` for the header dropdown. `q` (2+ chars) → `{ mode: 'autocomplete', suggestions }` |
| DELETE | `/api/search/recent` | Yes | Clears the logged-in user's search history |

Every search on `/products` or `/auctions` is logged to `search_queries`
(`search.model.js`) — that's what powers "recent searches" (per-user) and
"popular searches" (global, last 30 days) in the header dropdown
(`frontend/shared/header.js`), and what the results page
(`frontend/search/search.html`) hits directly for its two tabs (Products /
Auctions) and their filter panels.

### Scan

Per the brief, this project does **not fake image recognition**. What's real:

| Method | Path | Notes |
|---|---|---|
| GET | `/api/scan/status` | Reports whether barcode/QR lookup and image search are configured |
| POST | `/api/scan/lookup` | `{ code }` — a deterministic DB lookup, not AI: matches a product's `sku`, its numeric id, or a `bidmart:product:<id\|sku>` QR payload |
| POST | `/api/scan/image` | `{ imageBase64 }` — a real integration point. With no vision provider configured (the honest default — see `SCAN_IMAGE_PROVIDER_API_KEY` in `.env.example`), it returns `{ configured: false, message: 'Scan service not configured.' }` instead of pretending to recognize the photo |

`frontend/scan/scan.html` has three tabs: **Barcode/QR** (live camera
decoding via the browser's native `BarcodeDetector` API where supported,
plus a "decode from an uploaded photo" fallback — both are real decoding,
not a canned demo), **Image Search** (calls `/api/scan/image` and shows
whatever it honestly returns), and **Enter Code** (manual SKU/ID entry,
works everywhere). Since the seeded products don't have a `sku` set, the
easiest way to try it is **Enter Code** with a plain product id (e.g. `1`).

## 15. Notifications, Reviews & Returns *(Phase 8)*

### Notifications

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/notifications` | Yes | `?page&limit` — your own notifications, newest first, plus `unreadCount` |
| PATCH | `/api/notifications/:id/read` | Yes | Marks one notification read (scoped to you — can't touch anyone else's) |
| PATCH | `/api/notifications/read-all` | Yes | Marks everything read |

The header bell (`frontend/shared/header.js`) polls the unread count, opens a
small dropdown of the latest 6 on click (and marks them read), and links to
the full list at `frontend/notifications.html`. Real events feed it —
nothing here is simulated:

| Event | Who's notified |
|---|---|
| New bid placed | The auction's seller |
| Outbid / auction won / lost / unsold | The relevant bidder(s) *(Phase 5)* |
| Order placed | The buyer, every seller in the order, and all admins |
| Order shipped / delivered | The buyer |
| Return requested | The item's seller, and all admins |
| Return approved / rejected / received / refunded | The buyer |
| New seller registers | All admins |
| A product is published (Draft → Shop) | All admins |

### Reviews

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/reviews/product/:productId` | No | `{ summary: { averageRating, totalReviews }, items, pagination }` |
| GET | `/api/reviews/pending` | BUYER | Delivered order items you haven't reviewed yet |
| GET | `/api/reviews/mine` | BUYER | Reviews you've written |
| POST | `/api/reviews` | BUYER | `{ orderItemId, rating (1-5), comment? }` |

A review is only allowed once the order actually reached `DELIVERED` at some
point in its `order_status_history` (checked there, not the order's
*current* status, so an item is still reviewable after it moves on to a
return) — and only once per order item. `shop/product.html` shows the
rating summary and review list; `shop/order-detail.html` shows a **Write a
Review** button per eligible item.

### Returns & refunds

Return requests are their own record (`return_requests` — reason, status),
separate from but synced with the order's own status, so multiple sellers in
one order can each handle their own item's return independently.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/returns` | BUYER | `{ orderItemId, reason }` — only on a `DELIVERED` order; moves the order to `RETURN_REQUESTED` |
| PATCH | `/api/returns/:id/respond` | SELLER (owner)/ADMIN | `{ decision: 'APPROVE' \| 'REJECT' }` — rejecting returns the order to `DELIVERED` |
| PATCH | `/api/returns/:id/picked-up` | SELLER (owner)/ADMIN | Confirms the item was physically received back — moves the order to `RETURNED` |
| PATCH | `/api/returns/:id/refund` | ADMIN | Closes the loop — order → `REFUNDED`, payment → `REFUNDED` |
| GET | `/api/returns/mine` | BUYER | Your own return requests |
| GET | `/api/returns/seller` | SELLER/ADMIN | Return requests on your products. `?status=` to filter |
| GET | `/api/returns` | ADMIN | Every return request, platform-wide |

Full lifecycle: `REQUESTED → APPROVED → PICKED_UP → REFUNDED`, or
`REQUESTED → REJECTED`. `shop/order-detail.html` has the buyer's **Request
Return** button (delivered items only); `seller/returns.html` is where
sellers approve/reject/mark-received and admins process the refund — the
same page adapts based on the logged-in role.

**Why this needed its own guarded endpoint** (the same pattern as Phase 5's
`USE_AUCTION_ENDPOINT`): the order state machine already had a
`DELIVERED → RETURN_REQUESTED` transition reachable through the generic
`PATCH /api/orders/:id/status`, but firing it there would flip the order's
status with no `return_requests` row for anyone to act on. `order.service.js`
now refuses that one transition (`409 USE_RETURNS_ENDPOINT`) and points to
`POST /api/returns` instead, which does both atomically.

### Analytics

The Phase 6 dashboards now also surface: **buyer** — pending reviews, active
returns; **seller** — average rating, pending returns; **admin** — platform
average rating and total reviews, pending returns across everyone.

## 16. Testing *(Phase 4+)*

Backend tests will cover authentication, product CRUD + state transitions,
shop checkout, auction bidding/closing/concurrency, and authorization boundaries.
Run with:

```bash
npm test --prefix backend
```

## 17. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Could not connect to the database` on startup | `.env` DB credentials wrong, or MySQL not running |
| `/api/health` returns `DB_UNAVAILABLE` | Same as above — check `mysql -u root -p` works manually |
| Port already in use | Change `PORT` in `.env` |
| Frontend loads but shows no products | Run `db/seed.sql`, or create/publish a product as a seller first |
| `⚠ JWT_SECRET is not set` warning at startup | Set `JWT_SECRET` in `backend/.env` to any long random string |
| Login fails with "Invalid email or password" using seed accounts | Make sure you ran the **updated** `db/seed.sql` (Phase 2) — the password for every seeded account is `Password123!` |
| `401 UNAUTHENTICATED` calling `/api/auth/me` | Missing/expired `Authorization: Bearer <token>` header — log in again |
| `403 SYSTEM_ONLY_TRANSITION` changing product status | That transition (e.g. `ACTIVE_SHOP → SHIFTING_TO_AUCTION`) is only ever triggered by the Auction/Order modules, never manually — use the relevant flow instead of `PATCH /api/products/:id/status` |
| `409 USE_AUCTION_ENDPOINT` changing product status | You tried to manually set status to `ACTIVE_AUCTION` or `RETURNED_TO_SHOP` — use `POST /api/auctions/relist` or `POST /api/auctions/return-to-shop` instead |
| `409 INVALID_STATE_TRANSITION` | The `from → to` pair isn't a legal move — check the diagram in [Product State Machine](#9-product-state-machine) |
| `GET /api/products` returns nothing after creating a product | New products start as `DRAFT`, which isn't publicly listed — publish it first via **My Products** or `PATCH /api/products/:id/status` |
| `409 INSUFFICIENT_STOCK` at checkout | Someone else bought the remaining stock first, or your cart quantity exceeds what's left — refresh the cart |
| `409 INVALID_ORDER_TRANSITION` | The order's current status doesn't allow that move — check the table in [Shop Flow](#11-shop-flow--cart-checkout--orders-phase-4) |
| `403 Only the order's seller can perform this action` | You're logged in as the buyer (or a different seller) trying to advance fulfillment — log in as the seller who owns an item in that order |
| Checkout succeeds but the product still shows `ACTIVE_SHOP` at 0 stock | Shouldn't happen — checkout auto-flips to `OUT_OF_STOCK` when `available_qty` hits 0; if you see this, check the backend console for a transaction error |
| `409 BID_TOO_LOW` | Your bid was below `current_price + bid_increment` (or below `starting_price` if it's the first bid) — the error message includes the actual minimum |
| `409 AUCTION_NOT_OPEN` / `AUCTION_ENDED` placing a bid | The auction hasn't started yet, or its end time has already passed — refresh the page to see its current status |
| Auction doesn't close automatically | The scheduler ticks every 15s (`AUCTION_SCHEDULER_INTERVAL_MS` in `.env`) — wait a tick, refresh the auction page (it lazily syncs on read), or call `POST /api/auctions/run-scheduler` as an admin |
| `409 NO_WIN_TO_COMPLETE` / `403 NOT_THE_WINNER` on complete-order | The auction isn't `CLOSED` yet, has no winning bid, or you're not the bidder who won it |
| Scan → Image Search always says "Scan service not configured." | Expected with no `SCAN_IMAGE_PROVIDER_API_KEY` set — this is intentional, not a bug (see [Search & Scan](#14-search--scan-phase-7)) |
| Barcode camera tab shows "doesn't support live barcode scanning" | Your browser doesn't implement the `BarcodeDetector` API (Safari/Firefox don't yet) — use **Enter Code** instead, or try Chrome/Edge |
| Scanning/looking up a code finds nothing | Seeded products don't have a `sku` set — look up by plain numeric product id (e.g. `1`) instead |
| `409 NOT_YET_DELIVERED` submitting a review | The order has to have reached `DELIVERED` at some point in its history first |
| `409 ALREADY_REVIEWED` | One review per order item — you already reviewed this purchase |
| `409 USE_RETURNS_ENDPOINT` changing order status | You tried to manually set status to `RETURN_REQUESTED` — use `POST /api/returns` instead, so the reason gets recorded |
| `409 ORDER_NOT_DELIVERED` requesting a return | Returns can only be requested while the order is currently `DELIVERED` |
| Notification bell badge doesn't clear | Opening the dropdown marks the visible batch read; visit `/frontend/notifications.html` and click "Mark all as read" for everything |

---

## Roadmap

- [x] **Phase 1 — Foundation**: server, DB schema/seed, landing page shell
- [x] **Phase 2 — Authentication**: register/login/logout/me, JWT, role-based `authorize()`, login/register pages, placeholder dashboards
- [x] **Phase 3 — Product Foundation**: categories, product CRUD, inventory rows, state machine (`productStateMachine.js`) with owner/admin vs. system-only transitions, seller product-management page
- [x] **Phase 4 — Shop Flow**: cart, wishlist, addresses, transactional checkout (row-locking, auto out-of-stock), order state machine (`orderStateMachine.js`), full buyer + seller order UI
- [x] **Phase 5 — Auction**: shift-to-auction, row-locked concurrent bidding, automatic idempotent closing with reserve-price checks + notifications, background scheduler, relist/return-to-shop, winner "complete order" payment step, full buyer + seller auction UI
- [x] **Phase 6 — Dashboards**: role-scoped `/api/dashboard/{buyer,seller,admin}` aggregates (never cross-user), real buyer/seller/admin dashboard pages replacing the Phase 2 placeholders, 7-day sales chart for admins
- [x] **Phase 7 — Search + Scan**: global search with filters/sort for Shop and Auctions, autocomplete + recent/popular searches (`search_queries`-backed), header search dropdown, dedicated results page with per-tab filter panels, real barcode/QR scanning (browser `BarcodeDetector`, camera + photo upload), and an honest "not configured" image-search integration point
- [x] **Phase 8 — Notifications, Reviews, Returns & Analytics**: real-event notification feed (bids, orders, returns, new sellers/products) with a header bell + full inbox page; delivered-only, one-per-item product reviews with ratings shown on product pages; a full return/refund lifecycle (`REQUESTED → APPROVED → PICKED_UP → REFUNDED`) synced with the order state machine; extra analytics (ratings, pending returns/reviews) on all three dashboards

This completes the planned 8-phase build.
- [ ] Phase 9 — UI polish, responsiveness, accessibility

Each phase is built and reviewed before the next begins.
